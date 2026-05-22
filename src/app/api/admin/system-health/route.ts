import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Get platform metrics
    const [
      totalUsers,
      activeUsers24h,
      totalDeposits,
      pendingWithdrawals,
      pendingKYC,
      openTickets,
      recentTransactions,
      totalEarningsDistributed,
    ] = await Promise.all([
      prisma.user.count({ where: { isFake: false } }),
      prisma.loginHistory.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        distinct: ['userId'],
      }),
      prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'active' } }),
      prisma.withdrawal.count({ where: { status: 'pending' } }),
      prisma.kycVerification.count({ where: { status: 'pending' } }),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.transactionLog.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.earning.aggregate({ _sum: { amount: true } }),
    ])

    // Database health check
    let dbHealthy = true
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      dbHealthy = false
    }

    // Calculate platform balance
    const userBalances = await prisma.user.aggregate({
      _sum: { tradingBalance: true, withdrawalBalance: true },
      where: { isFake: false },
    })

    const platformLiability = (userBalances._sum.tradingBalance || 0) + (userBalances._sum.withdrawalBalance || 0)

    return NextResponse.json({
      status: dbHealthy ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: now.toISOString(),
      metrics: {
        totalUsers,
        activeUsers24h: activeUsers24h.length,
        totalActiveDeposits: totalDeposits._sum.amount || 0,
        pendingWithdrawals,
        pendingKYC,
        openTickets,
        recentTransactionsPerHour: recentTransactions,
        totalEarningsDistributed: totalEarningsDistributed._sum.amount || 0,
        platformLiability,
      },
      services: {
        database: dbHealthy ? 'operational' : 'down',
        api: 'operational',
        payments: 'operational',
        notifications: 'operational',
      },
    })
  } catch (error) {
    console.error('System health error:', error)
    return NextResponse.json({
      status: 'error',
      error: 'Failed to fetch system health',
    }, { status: 500 })
  }
}
