import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
