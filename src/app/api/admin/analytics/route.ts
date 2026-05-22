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

    const [
      totalUsers,
      activeUsersCount,
      totalDepositsAgg,
      pendingWithdrawalsAgg,
      completedWithdrawalsAgg,
      earningsAgg,
      newUsersInPeriod,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { isFake: false } }),
      prisma.user.count({ where: { isFake: false, isActive: true, totalDeposited: { gt: 0 } } }),
      prisma.deposit.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startDate } } }),
      prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'pending' } }),
      prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: { in: ['approved', 'completed'] }, createdAt: { gte: startDate } } }),
      prisma.earning.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startDate } } }),
      prisma.user.count({ where: { isFake: false, createdAt: { gte: startDate } } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ])

    const totalDeposits = totalDepositsAgg._sum.amount || 0
    const pendingWithdrawals = pendingWithdrawalsAgg._sum.amount || 0
    const completedWithdrawals = completedWithdrawalsAgg._sum.amount || 0
    const totalEarningsDistributed = earningsAgg._sum.amount || 0
    const platformRevenue = totalDeposits * 0.05 // 5% platform fee estimate
    const netRevenue = totalDeposits - completedWithdrawals - totalEarningsDistributed

    // Get deposits by day for chart
    const deposits = await prisma.deposit.findMany({
      where: { createdAt: { gte: startDate } },
      select: { amount: true, createdAt: true },
    })

    const depositsByDay: Record<string, number> = {}
    deposits.forEach(d => {
      const day = new Date(d.createdAt).toISOString().split('T')[0]
      depositsByDay[day] = (depositsByDay[day] || 0) + d.amount
    })

    // Recent real activity
    const formattedActivity = recentActivity.map(a => ({
      id: a.id,
      action: a.action,
      details: a.details ? JSON.parse(a.details) : null,
      createdAt: a.createdAt,
    }))

    return NextResponse.json({
      totalUsers,
      activeUsers: activeUsersCount,
      totalDeposits,
      platformRevenue,
      netRevenue,
      pendingWithdrawals,
      completedWithdrawals,
      totalEarningsDistributed,
      newUsersInPeriod,
      depositsByDay,
      recentActivity: formattedActivity,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
