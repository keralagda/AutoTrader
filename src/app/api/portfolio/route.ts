import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tradingBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
        totalDeposited: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active deposits with plan info
    const activeDeposits = await prisma.deposit.findMany({
      where: { userId, status: 'active' },
      include: { plan: { select: { name: true, dailyEarningPercent: true, returnType: true } } },
    })

    // Get earnings by type (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEarnings = await prisma.earning.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { type: true, amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group earnings by day for chart
    const earningsByDay: Record<string, number> = {}
    recentEarnings.forEach(e => {
      const day = new Date(e.createdAt).toISOString().split('T')[0]
      earningsByDay[day] = (earningsByDay[day] || 0) + e.amount
    })

    // Group earnings by type
    const earningsByType: Record<string, number> = {}
    recentEarnings.forEach(e => {
      earningsByType[e.type] = (earningsByType[e.type] || 0) + e.amount
    })

    // Get withdrawal history
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      select: { amount: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'approved' || w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0)

    // Calculate portfolio value
    const totalInvested = activeDeposits.reduce((sum, d) => sum + d.amount, 0)
    const totalEarnedFromDeposits = activeDeposits.reduce((sum, d) => sum + d.earnedSoFar, 0)
    const portfolioValue = user.tradingBalance + user.withdrawalBalance + totalInvested

    // Daily earnings chart data (last 30 days)
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = date.toISOString().split('T')[0]
      chartData.push({
        date: dayKey,
        earnings: earningsByDay[dayKey] || 0,
      })
    }

    return NextResponse.json({
      summary: {
        portfolioValue,
        tradingBalance: user.tradingBalance,
        withdrawalBalance: user.withdrawalBalance,
        totalInvested,
        totalEarnings: user.totalEarnings,
        totalWithdrawn,
        totalEarnedFromDeposits,
        roi: user.totalDeposited > 0 ? ((user.totalEarnings / user.totalDeposited) * 100).toFixed(1) : '0',
      },
      activeDeposits: activeDeposits.map(d => ({
        id: d.id,
        planName: d.plan.name,
        amount: d.amount,
        earnedSoFar: d.earnedSoFar,
        dailyPercent: d.plan.dailyEarningPercent,
        returnType: d.plan.returnType,
        createdAt: d.createdAt,
      })),
      earningsByType,
      chartData,
      recentWithdrawals: withdrawals,
    })
  } catch (error) {
    console.error('Portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
