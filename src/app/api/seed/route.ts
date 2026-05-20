import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_PLANS } from '@/lib/types'

export async function POST() {
  try {
    // Create admin if not exists
    const existingAdmin = await db.user.findFirst({ where: { role: 'admin' } })
    if (!existingAdmin) {
      const adminReferralCode = 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase()
      await db.user.create({
        data: {
          email: 'admin@autotrade.com',
          name: 'Admin',
          password: 'admin123',
          role: 'admin',
          referralCode: adminReferralCode,
          balance: 0,
          totalEarnings: 0,
          totalDeposited: 0,
        },
      })
    }

    // Create plans
    for (const plan of DEFAULT_PLANS) {
      const existing = await db.plan.findFirst({ where: { name: plan.name } })
      if (!existing) {
        await db.plan.create({ data: plan })
      }
    }

    // Create settings
    const settings = [
      { key: 'platform_name', value: 'Auto Trade' },
      { key: 'currency', value: 'USDC' },
      { key: 'min_withdrawal', value: '10' },
      { key: 'withdrawal_fee', value: '2' },
      { key: 'trading_days', value: 'monday,tuesday,wednesday,thursday,friday' },
      { key: 'profit_cycle', value: 'weekly' },
      { key: 'challenges_enabled', value: 'false' },
    ]

    for (const setting of settings) {
      const existing = await db.setting.findFirst({ where: { key: setting.key } })
      if (!existing) {
        await db.setting.create({ data: setting })
      }
    }

    // Create demo user if not exists
    let demoUser = await db.user.findUnique({ where: { email: 'demo@autotrade.com' } })
    if (!demoUser) {
      const adminUser = await db.user.findFirst({ where: { role: 'admin' } })
      demoUser = await db.user.create({
        data: {
          email: 'demo@autotrade.com',
          name: 'Alex Johnson',
          password: 'demo123',
          role: 'user',
          referralCode: 'ALEX' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD38',
          balance: 2450.75,
          totalEarnings: 1832.50,
          totalDeposited: 5000.00,
          referredById: adminUser?.id || null,
        },
      })
    }

    // Create sample earnings for demo user
    const existingEarnings = await db.earning.findFirst({ where: { userId: demoUser.id } })
    if (!existingEarnings) {
      const earningTypes = ['referral', 'profit_share', 'daily', 'bonus'] as const
      const now = new Date()
      const earningsData = []

      for (let i = 30; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString()

        // Daily earning
        earningsData.push({
          userId: demoUser.id,
          amount: Math.round((15 + Math.random() * 35) * 100) / 100,
          type: 'daily',
          level: null,
          createdAt: dateStr,
        })

        // Some referral earnings
        if (i % 3 === 0) {
          earningsData.push({
            userId: demoUser.id,
            amount: Math.round((5 + Math.random() * 25) * 100) / 100,
            type: 'referral',
            level: Math.ceil(Math.random() * 3),
            createdAt: dateStr,
          })
        }

        // Some profit share earnings
        if (i % 4 === 0) {
          earningsData.push({
            userId: demoUser.id,
            amount: Math.round((10 + Math.random() * 20) * 100) / 100,
            type: 'profit_share',
            level: Math.ceil(Math.random() * 7),
            createdAt: dateStr,
          })
        }
      }

      // Create earnings in batches
      for (let i = 0; i < earningsData.length; i += 10) {
        await db.earning.createMany({
          data: earningsData.slice(i, i + 10),
        })
      }
    }

    // Create sample withdrawals
    const existingWithdrawals = await db.withdrawal.findFirst({ where: { userId: demoUser.id } })
    if (!existingWithdrawals) {
      const withdrawalStatuses = ['completed', 'pending', 'approved', 'rejected'] as const
      const now = new Date()
      const withdrawalsData = []

      for (let i = 0; i < 8; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - i * 3)
        withdrawalsData.push({
          userId: demoUser.id,
          amount: Math.round((50 + Math.random() * 200) * 100) / 100,
          walletAddress: demoUser.walletAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD38',
          status: withdrawalStatuses[i % withdrawalStatuses.length],
          createdAt: date.toISOString(),
        })
      }

      await db.withdrawal.createMany({ data: withdrawalsData })
    }

    // Create sample leaderboard users
    const existingLeaderboardUsers = await db.user.count({ where: { role: 'user' } })
    if (existingLeaderboardUsers < 5) {
      const sampleUsers = [
        { name: 'Sarah Chen', earnings: 3250.80 },
        { name: 'Mike Rivera', earnings: 2980.50 },
        { name: 'Emma Wilson', earnings: 1650.25 },
        { name: 'James Park', earnings: 1420.00 },
        { name: 'Lisa Wang', earnings: 1200.75 },
        { name: 'David Kim', earnings: 980.30 },
        { name: 'Anna Smith', earnings: 750.00 },
        { name: 'Tom Brown', earnings: 520.50 },
      ]

      for (const su of sampleUsers) {
        const existingUser = await db.user.findFirst({ where: { name: su.name } })
        if (!existingUser) {
          await db.user.create({
            data: {
              email: `${su.name.toLowerCase().replace(' ', '.')}@autotrade.com`,
              name: su.name,
              password: 'demo123',
              role: 'user',
              referralCode: su.name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase(),
              balance: su.earnings * 0.5,
              totalEarnings: su.earnings,
              totalDeposited: su.earnings * 1.5,
              referredById: demoUser.id,
            },
          })
        }
      }
    }

    return NextResponse.json({ message: 'Seed completed successfully' }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
