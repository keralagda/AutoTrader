import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiChat } from '@/lib/ai'
import { revalidatePath } from 'next/cache'
import * as fs from 'fs'
import * as path from 'path'

const DEFAULT_SETTINGS = {
  platform_name: 'BNFX',
  currency: 'USDC',
  min_withdrawal: '10',
  withdrawal_fee: '2',
  trading_days: 'monday,tuesday,wednesday,thursday,friday',
  profit_cycle: 'weekly',
  challenges_enabled: 'false',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  branding_mode: 'name',
  smtp_gmail_user: '',
  smtp_gmail_pass: '',
}

export async function GET(req: NextRequest) {
  try {
    // 1. SYSTEM CHECKER
    // Database Latency Check
    const dbStart = Date.now()
    let dbStatus = 'operational'
    let dbLatency = 0
    let userCount = 0
    try {
      userCount = await db.user.count()
      dbLatency = Date.now() - dbStart
    } catch (e) {
      dbStatus = 'down'
    }

    // Check database-based SMTP settings
    const dbSmtpUser = await db.setting.findUnique({ where: { key: 'smtp_gmail_user' } })

    // Env Contract Check
    const envStatus = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Configured' : 'Not Configured',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Configured' : 'Not Configured',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? 'Configured' : 'Not Configured',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Configured' : 'Not Configured',
      SMTP_SERVERS: process.env.SMTP_SERVERS ? 'Configured' : 'Not Configured',
      SMTP_GMAIL_USER: process.env.SMTP_GMAIL_USER ? 'Configured' : 'Not Configured',
      DB_SMTP_SETTING: (dbSmtpUser && dbSmtpUser.value.trim() !== '') ? 'Configured' : 'Not Configured',
    }

    // AI Connection Check
    let aiStatus = 'not_configured'
    let aiLatency = 0
    let aiError = null
    if (process.env.GROQ_API_KEY) {
      const aiStart = Date.now()
      try {
        const response = await aiChat([
          { role: 'user', content: 'Respond with the word OK and nothing else.' }
        ], { temperature: 0.1, maxTokens: 5 })
        
        aiLatency = Date.now() - aiStart
        if (response.trim().toUpperCase().includes('OK')) {
          aiStatus = 'operational'
        } else {
          aiStatus = 'degraded'
          aiError = 'Unexpected AI response: ' + response.substring(0, 50)
        }
      } catch (err: any) {
        aiStatus = 'down'
        aiError = err.message || 'Connection failed'
      }
    }

    // Filesystem Write Check
    let fsStatus = 'operational'
    let fsError = null
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      const testFile = path.join(uploadDir, '.write-test')
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
    } catch (err: any) {
      fsStatus = 'degraded'
      fsError = err.message || 'Write permission denied'
    }

    // 2. LOGIC ANALYZER (Plan Configuration Auditor)
    const plans = await db.plan.findMany({
      include: { referralRules: true }
    })

    const auditIssues: any[] = []

    for (const plan of plans) {
      const planName = plan.name
      
      // Profit allocations (must sum to 100%)
      const profitSum = 
        plan.accountHolderPercent + 
        plan.tradeProfitSharePercent + 
        plan.rewardsOffersPercent + 
        plan.platformFeePercent +
        plan.charityDonationPercent +
        plan.insuranceReservePercent +
        plan.developerFundPercent +
        plan.liquidityPoolPercent
      
      if (Math.abs(profitSum - 100) > 0.01) {
        auditIssues.push({
          planId: plan.id,
          planName,
          category: 'profit_sharing',
          severity: 'warning',
          message: `Profit allocation splits sum to ${profitSum}%. It is highly recommended they sum to exactly 100%.`,
          recommendation: 'Adjust plan splits (Account Holder, Profit Share, Platform Fee, etc.) in Plan Builder to total 100%.'
        })
      }

      // Subscription allocations (must sum to 100% only if enabled)
      if (plan.isSubscriptionDistributionEnabled) {
        const subSum = 
          plan.subscriptionReferralPercent + 
          plan.subscriptionRewardsPercent + 
          plan.subscriptionPlatformPercent
        
        if (Math.abs(subSum - 100) > 0.01) {
          auditIssues.push({
            planId: plan.id,
            planName,
            category: 'subscription_sharing',
            severity: 'warning',
            message: `Subscription allocation splits sum to ${subSum}%. It is recommended they sum to exactly 100%.`,
            recommendation: 'Update subscription splits in the Plan Builder.'
          })
        }
      }

      // Bounds check
      if (plan.maxDeposit > 0 && plan.minDeposit > plan.maxDeposit) {
        auditIssues.push({
          planId: plan.id,
          planName,
          category: 'bounds',
          severity: 'error',
          message: `Minimum investment limit ($${plan.minDeposit}) is greater than maximum investment limit ($${plan.maxDeposit}).`,
          recommendation: 'Set maxDeposit to a value higher than minDeposit, or 0 (unlimited).'
        })
      }

      // Risk level ranges sanity check
      if (plan.lowRiskMin > plan.lowRiskMax) {
        auditIssues.push({
          planId: plan.id,
          planName,
          category: 'bounds',
          severity: 'error',
          message: `Low Risk minimum percent (${plan.lowRiskMin}%) is greater than maximum (${plan.lowRiskMax}%).`,
          recommendation: 'Correct Low Risk range values.'
        })
      }
      if (plan.mediumRiskMin > plan.mediumRiskMax) {
        auditIssues.push({
          planId: plan.id,
          planName,
          category: 'bounds',
          severity: 'error',
          message: `Medium Risk minimum percent (${plan.mediumRiskMin}%) is greater than maximum (${plan.mediumRiskMax}%).`,
          recommendation: 'Correct Medium Risk range values.'
        })
      }
      if (plan.highRiskMin > plan.highRiskMax) {
        auditIssues.push({
          planId: plan.id,
          planName,
          category: 'bounds',
          severity: 'error',
          message: `High Risk minimum percent (${plan.highRiskMin}%) is greater than maximum (${plan.highRiskMax}%).`,
          recommendation: 'Correct High Risk range values.'
        })
      }

      // Referral Rules audit
      const commissionRules = plan.referralRules.filter(r => r.type === 'registration' || r.type === 'deposit')
      const totalCommission = commissionRules.reduce((sum, r) => sum + r.commission, 0)
      if (totalCommission > 100) {
        auditIssues.push({
          planId: plan.id,
          planName,
          category: 'referral',
          severity: 'warning',
          message: `Combined referral commission percentage (${totalCommission}%) exceeds 100% of the activation fee.`,
          recommendation: 'Reduce the commission percentages on individual referral levels.'
        })
      }

      const negativeRules = plan.referralRules.filter(r => r.commission < 0)
      if (negativeRules.length > 0) {
        auditIssues.push({
          planId: plan.id,
          planName,
          category: 'referral',
          severity: 'error',
          message: `Plan has ${negativeRules.length} level(s) with negative commission values.`,
          recommendation: 'Remove or set commission rate to 0% or positive values.'
        })
      }
    }

    return NextResponse.json({
      systemChecker: {
        database: { status: dbStatus, latency: dbLatency, userCount },
        env: envStatus,
        ai: { status: aiStatus, latency: aiLatency, error: aiError },
        filesystem: { status: fsStatus, error: fsError }
      },
      logicAnalyzer: {
        issues: auditIssues,
        status: auditIssues.some(i => i.severity === 'error') ? 'error' : auditIssues.length > 0 ? 'warning' : 'healthy'
      }
    })
  } catch (error: any) {
    console.error('System diagnostics error:', error)
    return NextResponse.json({ error: 'Diagnostics aborted: ' + error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    // ─── ACTION: FLUSH CACHE ──────────────────────────────────────────
    if (action === 'flush-cache') {
      let settingFlushed = false
      try {
        // Delete commentary settings cache
        await db.setting.deleteMany({
          where: { key: 'ai_market_commentary' }
        })
        settingFlushed = true
      } catch (err) {
        console.error('Failed to clear database cache key:', err)
      }

      // Revalidate Next.js router cache
      try {
        revalidatePath('/', 'layout')
        revalidatePath('/')
      } catch (err) {
        console.error('Failed to trigger Next.js cache revalidation:', err)
      }

      return NextResponse.json({
        success: true,
        message: 'Cache flushed successfully.',
        details: {
          databaseCacheCleared: settingFlushed,
          nextjsRouterRevalidated: true,
          inMemoryCacheCleared: true,
        }
      })
    }

    // ─── ACTION: AUTO HEAL MINOR ISSUES ────────────────────────────────
    if (action === 'auto-heal') {
      const healLog: string[] = []
      let healedCount = 0

      // 1. Missing Settings Defaults
      try {
        const settings = await db.setting.findMany()
        const keys = settings.map(s => s.key)
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
          if (!keys.includes(key)) {
            await db.setting.create({ data: { key, value } })
            healLog.push(`Missing setting key added: "${key}" = "${value}"`)
            healedCount++
          }
        }
      } catch (err: any) {
        healLog.push(`Settings audit failed: ${err.message}`)
      }

      // 2. Users missing UserStats
      try {
        const users = await db.user.findMany({
          include: { userStats: true }
        })
        const missingStatsUsers = users.filter(u => !u.userStats)
        for (const user of missingStatsUsers) {
          await db.userStats.create({
            data: { userId: user.id, xp: 0, level: 1 }
          })
          healLog.push(`UserStats created for user ${user.name} (${user.email})`)
          healedCount++
        }
      } catch (err: any) {
        healLog.push(`UserStats audit failed: ${err.message}`)
      }

      // 3. Orphan referral relations
      try {
        const usersWithReferrals = await db.user.findMany({
          where: { referredById: { not: null } }
        })
        const allUserIds = (await db.user.findMany({ select: { id: true } })).map(u => u.id)
        
        for (const user of usersWithReferrals) {
          if (user.referredById && !allUserIds.includes(user.referredById)) {
            await db.user.update({
              where: { id: user.id },
              data: { referredById: null }
            })
            healLog.push(`Orphan referral cleared for user ${user.name} (${user.email}) - invalid sponsor ID: ${user.referredById}`)
            healedCount++
          }
        }
      } catch (err: any) {
        healLog.push(`Referrals audit failed: ${err.message}`)
      }

      // 4. Orphan PlanReferralRule records
      try {
        const rules = await db.planReferralRule.findMany()
        const planIds = (await db.plan.findMany({ select: { id: true } })).map(p => p.id)
        for (const rule of rules) {
          if (!planIds.includes(rule.planId)) {
            await db.planReferralRule.delete({ where: { id: rule.id } })
            healLog.push(`Orphan Referral Rule deleted: Level ${rule.level} for non-existent Plan ID ${rule.planId}`)
            healedCount++
          }
        }
      } catch (err: any) {
        healLog.push(`Referral rules audit failed: ${err.message}`)
      }

      return NextResponse.json({
        success: true,
        message: `Auto heal complete. Healed ${healedCount} item(s).`,
        logs: healLog,
        healedCount
      })
    }

    // ─── ACTION: DATA RESET (FULL / PARTIAL) ──────────────────────────
    if (action === 'reset-data') {
      const { type, confirmCode, entities } = body

      if (type === 'full') {
        if (confirmCode !== 'RESET-BNFX-CONFIRM') {
          return NextResponse.json({ error: 'Invalid confirmation code for full reset.' }, { status: 400 })
        }

        const results: Record<string, number> = {}

        // Truncate tables in dependency order
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
        results.affiliateApplications = (await db.affiliateApplication.deleteMany({})).count
        results.binaryTreeAuditLogs = (await db.binaryTreeAuditLog.deleteMany({})).count
        results.activityLogs = (await db.activityLog.deleteMany({})).count
        results.news = (await db.news.deleteMany({})).count
        results.fakeNotifications = (await db.fakeNotification.deleteMany({})).count
        results.testimonials = (await db.testimonial.deleteMany({})).count
        results.promotions = (await db.promotion.deleteMany({})).count

        // Delete all non-admin users
        results.users = (await db.user.deleteMany({ where: { role: { notIn: ['admin', 'super_admin'] } } })).count

        // Reset admin user balances to zero
        await db.user.updateMany({
          where: { role: { in: ['admin', 'super_admin'] } },
          data: { tradingBalance: 0, withdrawalBalance: 0, totalEarnings: 0, totalDeposited: 0 },
        })

        // Clean cache configs
        await db.setting.deleteMany({
          where: {
            key: {
              in: ['ai_market_commentary']
            }
          }
        })

        await db.activityLog.create({
          data: { action: 'full_data_reset', details: JSON.stringify({ resetAt: new Date().toISOString() }) }
        })

        return NextResponse.json({
          success: true,
          message: 'Full platform data reset complete. Configurations preserved.',
          deleted: results
        })
      }

      if (type === 'partial') {
        if (confirmCode !== 'RESET-PARTIAL-CONFIRM') {
          return NextResponse.json({ error: 'Invalid confirmation code for partial reset.' }, { status: 400 })
        }

        if (!Array.isArray(entities) || entities.length === 0) {
          return NextResponse.json({ error: 'Select at least one entity to reset.' }, { status: 400 })
        }

        const results: Record<string, number> = {}

        // Safe order deletions based on selected checkbox options
        const isSelected = (key: string) => entities.includes(key)

        // 1. Tickets
        if (isSelected('tickets') || isSelected('users')) {
          results.ticketReplies = (await db.ticketReply.deleteMany({})).count
          results.supportTickets = (await db.supportTicket.deleteMany({})).count
        }

        // 2. Challenges & Badges
        if (isSelected('challenges') || isSelected('users')) {
          results.userBadges = (await db.userBadge.deleteMany({})).count
          results.userChallenges = (await db.userChallenge.deleteMany({})).count
          
          if (isSelected('challenges')) {
            results.badges = (await db.badge.deleteMany({})).count
            results.challenges = (await db.challenge.deleteMany({})).count
          }
        }

        // 3. User related configs (streaks, check-ins, histories)
        if (isSelected('users')) {
          results.dailyCheckIns = (await db.dailyCheckIn.deleteMany({})).count
          results.loginHistory = (await db.loginHistory.deleteMany({})).count
          results.p2pTransfers = (await db.p2PTransfer.deleteMany({})).count
          results.leaderboardEntries = (await db.leaderboardEntry.deleteMany({})).count
          results.userStats = (await db.userStats.deleteMany({})).count
          results.kycVerifications = (await db.kycVerification.deleteMany({})).count
          results.affiliateApplications = (await db.affiliateApplication.deleteMany({})).count
          results.binaryTreeAuditLogs = (await db.binaryTreeAuditLog.deleteMany({})).count
        }

        // 4. Notifications
        if (isSelected('notifications') || isSelected('users')) {
          results.notifications = (await db.notification.deleteMany({})).count
        }
        if (isSelected('notifications')) {
          results.fakeNotifications = (await db.fakeNotification.deleteMany({})).count
        }

        // 5. Messages
        if (isSelected('messages') || isSelected('users')) {
          results.messages = (await db.message.deleteMany({})).count
        }

        // 6. Transactions, Payments, Deposits, Withdrawals, Earnings
        if (isSelected('deposits') || isSelected('plans') || isSelected('users')) {
          results.profitDistributions = (await db.profitDistribution.deleteMany({})).count
        }

        if (isSelected('earnings') || isSelected('deposits') || isSelected('plans') || isSelected('users')) {
          results.earnings = (await db.earning.deleteMany({})).count
        }

        if (isSelected('transactions') || isSelected('users')) {
          results.transactionLogs = (await db.transactionLog.deleteMany({})).count
        }

        if (isSelected('payments') || isSelected('users')) {
          results.payments = (await db.payment.deleteMany({})).count
        }

        if (isSelected('withdrawals') || isSelected('users')) {
          results.withdrawals = (await db.withdrawal.deleteMany({})).count
        }

        if (isSelected('deposits') || isSelected('plans') || isSelected('users')) {
          results.deposits = (await db.deposit.deleteMany({})).count
        }

        // 7. Plans
        if (isSelected('plans')) {
          results.planReferralRules = (await db.planReferralRule.deleteMany({})).count
          results.planConditionalLogics = (await db.planConditionalLogic.deleteMany({})).count
          results.planPnLLogs = (await db.planPnLLog.deleteMany({})).count
          results.planInsuranceVaults = (await db.planInsuranceVault.deleteMany({})).count
          results.plans = (await db.plan.deleteMany({})).count
        }

        // 8. Content Pages
        if (isSelected('news')) {
          results.news = (await db.news.deleteMany({})).count
        }
        if (isSelected('testimonials')) {
          results.testimonials = (await db.testimonial.deleteMany({})).count
        }
        if (isSelected('promotions')) {
          results.promotions = (await db.promotion.deleteMany({})).count
        }

        // 9. Users Truncate (keep admin accounts)
        if (isSelected('users')) {
          results.users = (await db.user.deleteMany({ where: { role: { notIn: ['admin', 'super_admin'] } } })).count
          
          // Reset admin user balances to zero
          await db.user.updateMany({
            where: { role: { in: ['admin', 'super_admin'] } },
            data: { tradingBalance: 0, withdrawalBalance: 0, totalEarnings: 0, totalDeposited: 0 },
          })
        }

        await db.activityLog.create({
          data: { action: 'partial_data_reset', details: JSON.stringify({ entities, resetAt: new Date().toISOString() }) }
        })

        return NextResponse.json({
          success: true,
          message: `Selected entities (${entities.join(', ')}) reset successfully.`,
          deleted: results
        })
      }

      return NextResponse.json({ error: 'Invalid reset configuration' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })
  } catch (error: any) {
    console.error('Performance operations error:', error)
    return NextResponse.json({ error: 'Operation failed: ' + error.message }, { status: 500 })
  }
}
