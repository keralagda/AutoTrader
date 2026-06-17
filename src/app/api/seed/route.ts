import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_PLANS, DEFAULT_CHALLENGES, DEFAULT_BADGES } from '@/lib/types'

export async function POST() {
  try {
    // Database connectivity guard
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    // Create admin user if not exists
    const existingAdmin = await db.user.findFirst({ where: { role: 'admin' } })
    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: 'admin@bnfx.com',
          name: 'Admin',
          password: 'admin123',
          role: 'admin',
          referralCode: 'ADMIN001',
          tradingBalance: 1000000,
          withdrawalBalance: 1000000,
        },
      })
    } else {
      // Ensure admin always has unlimited funds
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          tradingBalance: Math.max(existingAdmin.tradingBalance, 1000000),
          withdrawalBalance: Math.max(existingAdmin.withdrawalBalance, 1000000),
        },
      })
    }

    // Create default plans if none exist
    const existingPlans = await db.plan.count()
    if (existingPlans === 0) {
      for (const plan of DEFAULT_PLANS) {
        await db.plan.create({ data: plan })
      }
    }

    // Create default payment gateways
    const existingGateways = await db.paymentGateway.count()
    if (existingGateways === 0) {
      const defaultGateways = [
        { name: 'MetaMask', type: 'crypto', network: 'ethereum', minAmount: 10, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 1 },
        { name: 'CoinPayments', type: 'crypto', network: 'multi', minAmount: 10, maxAmount: 500000, feePercent: 0.5, isActive: true, sortOrder: 2 },
        { name: 'NOWPayments', type: 'crypto', network: 'multi', minAmount: 5, maxAmount: 100000, feePercent: 0.5, isActive: true, sortOrder: 3 },
        { name: 'USDC (BEP-20)', type: 'crypto', network: 'bsc', minAmount: 10, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 4, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', apiSecret: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', apiKey: 'https://bsc-dataseed.binance.org/', webhookUrl: 'https://bscscan.com/tx/' },
        { name: 'Bitcoin (BTC)', type: 'crypto', network: 'bitcoin', minAmount: 50, maxAmount: 100000, feePercent: 0, isActive: false, sortOrder: 5 },


      ]
      for (const gw of defaultGateways) {
        await db.paymentGateway.create({ data: gw })
      }
    }

    // Create default settings
    const existingSettings = await db.setting.count()
    if (existingSettings === 0) {
      const defaultSettings = [
        { key: 'platform_name', value: 'BNFX' },
        { key: 'min_withdrawal', value: '10' },
        { key: 'withdrawal_fee_percent', value: '2' },
        { key: 'trading_days', value: 'monday,tuesday,wednesday,thursday,friday' },
        { key: 'auto_approve_withdrawals', value: 'false' },
        { key: 'max_withdrawal_per_day', value: '5000' },
      ]
      for (const s of defaultSettings) {
        await db.setting.create({ data: s })
      }
    }

    // Create default challenges if none exist
    const existingChallenges = await db.challenge.count()
    if (existingChallenges === 0) {
      for (const challenge of DEFAULT_CHALLENGES) {
        await db.challenge.create({ data: challenge })
      }
    }

    // Create default badges if none exist
    const existingBadges = await db.badge.count()
    if (existingBadges === 0) {
      for (const badge of DEFAULT_BADGES) {
        await db.badge.create({ data: badge })
      }
    }

    // Create default fake notifications if none exist
    const existingFakeNotifs = await db.fakeNotification.count()
    if (existingFakeNotifs === 0) {
      const defaultFakeNotifs = [
        { userName: 'Alex M.', planName: 'Gold', amount: 2500, sortOrder: 1 },
        { userName: 'Sarah K.', planName: 'Platinum', amount: 10000, sortOrder: 2 },
        { userName: 'James R.', planName: 'Silver', amount: 1000, sortOrder: 3 },
        { userName: 'Emily W.', planName: 'Gold', amount: 5000, sortOrder: 4 },
        { userName: 'Michael T.', planName: 'Starter', amount: 500, sortOrder: 5 },
        { userName: 'Lisa P.', planName: 'Platinum', amount: 15000, sortOrder: 6 },
        { userName: 'David H.', planName: 'Silver', amount: 2000, sortOrder: 7 },
        { userName: 'Anna S.', planName: 'Gold', amount: 3000, sortOrder: 8 },
        { userName: 'Robert J.', planName: 'Starter', amount: 300, sortOrder: 9 },
        { userName: 'Maria L.', planName: 'Platinum', amount: 20000, sortOrder: 10 },
      ]
      for (const notif of defaultFakeNotifs) {
        await db.fakeNotification.create({ data: notif })
      }

      // Create default notification settings
      const existingSettings2 = await db.fakeNotificationSettings.count()
      if (existingSettings2 === 0) {
        await db.fakeNotificationSettings.create({
          data: { isEnabled: true, minDelaySeconds: 5, maxDelaySeconds: 15 },
        })
      }
    }

    // Create sample news if none exist
    const existingNews = await db.news.count()
    if (existingNews === 0) {
      const defaultNews = [
        { title: 'Welcome to BNFX!', content: 'We are excited to launch our AI-powered trading platform. Start earning daily returns with our automated trading system.', category: 'general' },
        { title: 'New Platinum Plan Available', content: 'Our premium Platinum plan is now live with up to 15% daily returns and 5x stacking capability. Upgrade today!', category: 'promotion' },
        { title: 'Platform Maintenance - June 2026', content: 'Scheduled maintenance on June 15, 2026 from 2:00 AM to 4:00 AM UTC. Trading will resume automatically.', category: 'update' },
        { title: 'Referral Bonus Doubled!', content: 'For a limited time, all referral commissions are doubled. Invite your friends and earn more!', category: 'promotion' },
      ]
      for (const news of defaultNews) {
        await db.news.create({ data: news })
      }
    }

    // Create default testimonials
    const existingTestimonials = await db.testimonial.count()
    if (existingTestimonials === 0) {
      const defaultTestimonials = [
        { name: 'Rajesh Kumar', avatar: '👨🏽', role: 'Gold Plan Investor', content: 'BNFX has completely changed my financial life. The daily returns are consistent and the platform is very easy to use.', rating: 5, earnings: '$12,500 earned', sortOrder: 1 },
        { name: 'Priya Sharma', avatar: '👩🏽', role: 'Platinum Trader', content: 'I was skeptical at first but after 3 months of consistent returns, I upgraded to Platinum. Best decision ever!', rating: 5, earnings: '$45,000 earned', sortOrder: 2 },
        { name: 'Amit Patel', avatar: '👨🏻', role: 'Silver Plan Member', content: 'The referral system is amazing. I have built a team of 50+ and the passive income from profit sharing is incredible.', rating: 4, earnings: '$8,200 earned', sortOrder: 3 },
        { name: 'Sneha Reddy', avatar: '👩🏾', role: 'Gold Plan Investor', content: 'What I love most is the transparency. I can see every trade signal and my earnings grow daily. Highly recommended!', rating: 5, earnings: '$18,000 earned', sortOrder: 4 },
        { name: 'Vikram Singh', avatar: '👨🏽', role: 'Starter Plan', content: 'Started with just $100 and now earning daily. The stacking feature helped me grow my portfolio quickly.', rating: 4, earnings: '$3,500 earned', sortOrder: 5 },
        { name: 'Ananya Joshi', avatar: '👩🏻', role: 'Platinum VIP', content: 'The live trading simulator gives me confidence that my money is being managed by AI. Returns are always on target.', rating: 5, earnings: '$67,000 earned', sortOrder: 6 },
      ]
      for (const t of defaultTestimonials) {
        await db.testimonial.create({ data: t })
      }
    }

    // Create default promotion
    const existingPromos = await db.promotion.count()
    if (existingPromos === 0) {
      await db.promotion.create({
        data: {
          title: '2x Referral Bonus Week',
          description: 'Earn double referral commissions on all new sign-ups this week! Share your link and maximize your earnings.',
          bannerText: '🔥 2x Referral Bonus - Limited Time!',
          type: 'referral_bonus',
          multiplier: 2,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isActive: true,
          showOnLanding: true,
          showOnDashboard: true,
        },
      })
    }

    // Sync totalDeposited for all real users with the sum of their confirmed payments
    const allUsers = await db.user.findMany({ where: { isFake: false }, select: { id: true } })
    for (const u of allUsers) {
      const confirmedPayments = await db.payment.aggregate({
        where: { userId: u.id, status: 'confirmed' },
        _sum: { amount: true }
      })
      const totalDeposited = confirmedPayments._sum.amount || 0
      await db.user.update({
        where: { id: u.id },
        data: { totalDeposited }
      })
    }

    return NextResponse.json({ message: 'Seed completed and user deposits synced' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
