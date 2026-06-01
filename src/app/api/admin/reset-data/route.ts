import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List restore points or create one
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    if (action === 'create') {
      // Create a restore point — snapshot all critical data
      const [users, deposits, earnings, withdrawals, payments, transactions, userStats, notifications] = await Promise.all([
        db.user.findMany({ where: { role: { notIn: ['admin', 'super_admin'] } } }),
        db.deposit.findMany({}),
        db.earning.findMany({}),
        db.withdrawal.findMany({}),
        db.payment.findMany({}),
        db.transactionLog.findMany({}),
        db.userStats.findMany({}),
        db.notification.findMany({ take: 500 }),
      ])

      const snapshot = {
        createdAt: new Date().toISOString(),
        counts: {
          users: users.length,
          deposits: deposits.length,
          earnings: earnings.length,
          withdrawals: withdrawals.length,
          payments: payments.length,
          transactions: transactions.length,
        },
        data: { users, deposits, earnings, withdrawals, payments, transactions, userStats, notifications },
      }

      const pointId = `restore_point_${Date.now()}`
      await db.setting.create({
        data: { key: pointId, value: JSON.stringify(snapshot) },
      })

      // Keep only last 5 restore points
      const allPoints = await db.setting.findMany({
        where: { key: { startsWith: 'restore_point_' } },
        orderBy: { key: 'desc' },
      })
      if (allPoints.length > 5) {
        const toDelete = allPoints.slice(5).map(p => p.key)
        await db.setting.deleteMany({ where: { key: { in: toDelete } } })
      }

      return NextResponse.json({
        success: true,
        pointId,
        createdAt: snapshot.createdAt,
        counts: snapshot.counts,
        message: 'Restore point created successfully.',
      })
    }

    // List all restore points
    const points = await db.setting.findMany({
      where: { key: { startsWith: 'restore_point_' } },
      orderBy: { key: 'desc' },
    })

    const list = points.map(p => {
      try {
        const data = JSON.parse(p.value)
        return { id: p.key, createdAt: data.createdAt, counts: data.counts }
      } catch {
        return { id: p.key, createdAt: 'Unknown', counts: {} }
      }
    })

    return NextResponse.json({ restorePoints: list })
  } catch (error) {
    console.error('Restore point error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT - Restore from a restore point
export async function PUT(req: NextRequest) {
  try {
    const { pointId } = await req.json()
    if (!pointId) return NextResponse.json({ error: 'pointId required' }, { status: 400 })

    const point = await db.setting.findUnique({ where: { key: pointId } })
    if (!point) return NextResponse.json({ error: 'Restore point not found' }, { status: 404 })

    const snapshot = JSON.parse(point.value)
    const { users, deposits, earnings, withdrawals, payments, transactions, userStats } = snapshot.data

    // Clear current data first (same as reset)
    await db.ticketReply.deleteMany({})
    await db.supportTicket.deleteMany({})
    await db.dailyCheckIn.deleteMany({})
    await db.userBadge.deleteMany({})
    await db.userChallenge.deleteMany({})
    await db.loginHistory.deleteMany({})
    await db.p2PTransfer.deleteMany({})
    await db.notification.deleteMany({})
    await db.message.deleteMany({})
    await db.profitDistribution.deleteMany({})
    await db.earning.deleteMany({})
    await db.transactionLog.deleteMany({})
    await db.payment.deleteMany({})
    await db.withdrawal.deleteMany({})
    await db.deposit.deleteMany({})
    await db.leaderboardEntry.deleteMany({})
    await db.userStats.deleteMany({})
    await db.kycVerification.deleteMany({})
    await db.user.deleteMany({ where: { role: { notIn: ['admin', 'super_admin'] } } })

    // Restore users
    for (const user of users) {
      const { id, ...userData } = user
      try {
        await db.user.create({ data: { id, ...userData, createdAt: new Date(userData.createdAt), updatedAt: new Date(userData.updatedAt) } })
      } catch {}
    }

    // Restore deposits
    for (const dep of deposits) {
      const { id, ...data } = dep
      try {
        await db.deposit.create({ data: { id, ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } })
      } catch {}
    }

    // Restore earnings
    for (const earn of earnings) {
      const { id, ...data } = earn
      try {
        await db.earning.create({ data: { id, ...data, createdAt: new Date(data.createdAt) } })
      } catch {}
    }

    // Restore withdrawals
    for (const w of withdrawals) {
      const { id, ...data } = w
      try {
        await db.withdrawal.create({ data: { id, ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } })
      } catch {}
    }

    // Restore payments
    for (const p of payments) {
      const { id, ...data } = p
      try {
        await db.payment.create({ data: { id, ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } })
      } catch {}
    }

    // Restore transaction logs
    for (const t of transactions) {
      const { id, ...data } = t
      try {
        await db.transactionLog.create({ data: { id, ...data, createdAt: new Date(data.createdAt) } })
      } catch {}
    }

    // Restore user stats
    for (const s of userStats) {
      const { id, ...data } = s
      try {
        await db.userStats.create({ data: { id, ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } })
      } catch {}
    }

    await db.activityLog.create({
      data: { action: 'data_restored', details: JSON.stringify({ pointId, restoredAt: new Date().toISOString(), counts: snapshot.counts }) },
    })

    return NextResponse.json({
      success: true,
      message: `Data restored from point created at ${snapshot.createdAt}`,
      counts: snapshot.counts,
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'Restore failed. Check server logs.' }, { status: 500 })
  }
}

// POST - Reset platform data to zero state (keeps configurations)
export async function POST(req: NextRequest) {
  try {
    const { confirmCode } = await req.json()

    // Require confirmation code to prevent accidental resets
    if (confirmCode !== 'RESET-BNFX-CONFIRM') {
      return NextResponse.json({ error: 'Invalid confirmation code. Send { confirmCode: "RESET-BNFX-CONFIRM" }' }, { status: 400 })
    }

    const results: Record<string, number> = {}

    // Delete all user-generated data (order matters for FK constraints)
    results.ticketReplies = (await db.ticketReply.deleteMany({})).count
    results.supportTickets = (await db.supportTicket.deleteMany({})).count
    results.dailyCheckIns = (await db.dailyCheckIn.deleteMany({})).count
    results.userBadges = (await db.userBadge.deleteMany({})).count
    results.userChallenges = (await db.userChallenge.deleteMany({})).count
    results.loginHistory = (await db.loginHistory.deleteMany({})).count
    results.p2pTransfers = (await db.p2PTransfer.deleteMany({})).count
    results.notifications = (await db.notification.deleteMany({})).count
    results.messages = (await db.message.deleteMany({})).count
    results.profitDistributions = (await db.profitDistribution.deleteMany({})).count
    results.earnings = (await db.earning.deleteMany({})).count
    results.transactionLogs = (await db.transactionLog.deleteMany({})).count
    results.payments = (await db.payment.deleteMany({})).count
    results.withdrawals = (await db.withdrawal.deleteMany({})).count
    results.deposits = (await db.deposit.deleteMany({})).count
    results.leaderboardEntries = (await db.leaderboardEntry.deleteMany({})).count
    results.userStats = (await db.userStats.deleteMany({})).count
    results.kycVerifications = (await db.kycVerification.deleteMany({})).count
    results.activityLogs = (await db.activityLog.deleteMany({})).count
    results.news = (await db.news.deleteMany({})).count
    results.fakeNotifications = (await db.fakeNotification.deleteMany({})).count
    results.testimonials = (await db.testimonial.deleteMany({})).count
    results.promotions = (await db.promotion.deleteMany({})).count

    // Delete all non-admin users (keep admin accounts)
    results.users = (await db.user.deleteMany({ where: { role: { notIn: ['admin', 'super_admin'] } } })).count

    // Reset admin user balances to zero
    await db.user.updateMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      data: { tradingBalance: 0, withdrawalBalance: 0, totalEarnings: 0, totalDeposited: 0 },
    })

    // Delete screen-time and NP history settings (keep configs)
    await db.setting.deleteMany({
      where: {
        key: {
          startsWith: 'screen_time_np_',
        },
      },
    })
    await db.setting.deleteMany({
      where: {
        key: {
          startsWith: 'np_history_',
        },
      },
    })
    await db.setting.deleteMany({
      where: {
        key: {
          startsWith: 'perk_',
        },
      },
    })
    await db.setting.deleteMany({
      where: {
        key: {
          startsWith: 'spectate_',
        },
      },
    })

    // NOT deleted (configurations preserved):
    // - Plans, Badges, Challenges, PaymentGateways
    // - Settings (theme, templates, feature flags, chatbot config, NP config, logic builder, etc.)
    // - LandingSections, MediaUploads
    // - FakeNotificationSettings

    return NextResponse.json({
      success: true,
      message: 'Platform data reset to zero state. Configurations preserved.',
      deleted: results,
      preserved: ['Plans', 'Badges', 'Challenges', 'Payment Gateways', 'Settings', 'Templates', 'Feature Flags', 'Landing Sections', 'Media'],
    })
  } catch (error) {
    console.error('Reset data error:', error)
    return NextResponse.json({ error: 'Reset failed. Check server logs.' }, { status: 500 })
  }
}
