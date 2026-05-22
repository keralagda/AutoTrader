import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || '30d'

    let startDate = new Date()
    switch (period) {
      case '7d': startDate.setDate(startDate.getDate() - 7); break
      case '30d': startDate.setDate(startDate.getDate() - 30); break
      case '90d': startDate.setDate(startDate.getDate() - 90); break
      case 'all': startDate = new Date('2020-01-01'); break
    }

    // Total deposits in period
    const deposits = await prisma.deposit.findMany({
      where: { createdAt: { gte: startDate } },
      select: { amount: true, createdAt: true },
    })

    // Total withdrawals in period
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['approved', 'completed'] },
      },
      select: { amount: true, createdAt: true },
    })

    // Total earnings distributed in period
    const earnings = await prisma.earning.findMany({
      where: { createdAt: { gte: startDate } },
      select: { amount: true, type: true, createdAt: true },
    })

    // New users in period
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate }, isFake: false },
    })

    // Revenue by day
    const revenueByDay: Record<string, { deposits: number; withdrawals: number; earnings: number }> = {}

    deposits.forEach(d => {
      const day = new Date(d.createdAt).toISOString().split('T')[0]
      if (!revenueByDay[day]) revenueByDay[day] = { deposits: 0, withdrawals: 0, earnings: 0 }
      revenueByDay[day].deposits += d.amount
    })

    withdrawals.forEach(w => {
      const day = new Date(w.createdAt).toISOString().split('T')[0]
      if (!revenueByDay[day]) revenueByDay[day] = { deposits: 0, withdrawals: 0, earnings: 0 }
      revenueByDay[day].withdrawals += w.amount
    })

    earnings.forEach(e => {
      const day = new Date(e.createdAt).toISOString().split('T')[0]
      if (!revenueByDay[day]) revenueByDay[day] = { deposits: 0, withdrawals: 0, earnings: 0 }
      revenueByDay[day].earnings += e.amount
    })

    // Sort by date
    const chartData = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }))

    // Totals
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0)
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0)
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0)

    // Platform fee estimate (5% of deposits)
    const platformFee = totalDeposits * 0.05

    // Net revenue = deposits - withdrawals - earnings distributed
    const netRevenue = totalDeposits - totalWithdrawals - totalEarnings

    // Earnings by type
    const earningsByType: Record<string, number> = {}
    earnings.forEach(e => {
      earningsByType[e.type] = (earningsByType[e.type] || 0) + e.amount
    })

    return NextResponse.json({
      period,
      summary: {
        totalDeposits,
        totalWithdrawals,
        totalEarningsDistributed: totalEarnings,
        platformFee,
        netRevenue,
        newUsers,
        avgDepositSize: deposits.length > 0 ? totalDeposits / deposits.length : 0,
      },
      earningsByType,
      chartData,
    })
  } catch (error) {
    console.error('Revenue API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
