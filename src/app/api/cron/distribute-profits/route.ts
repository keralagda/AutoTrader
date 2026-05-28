import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// This endpoint is called by:
// 1. Vercel Cron (vercel.json schedule) - sends CRON_SECRET via Authorization header
// 2. cron-job.org - sends x-cron-secret header
// 3. Admin manual trigger from dashboard

export async function POST(request: Request) {
  try {
    // Auth check - accept multiple auth methods
    const cronSecret = process.env.CRON_SECRET || 'bnfx-cron-2026'
    const xCronSecret = request.headers.get('x-cron-secret')
    const authorizationHeader = request.headers.get('authorization')

    // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
    const vercelAuth = authorizationHeader?.replace('Bearer ', '')

    // Validate: at least one auth method must match (or no auth header = admin manual trigger)
    const hasAuthHeader = xCronSecret || authorizationHeader
    if (hasAuthHeader && xCronSecret !== cronSecret && vercelAuth !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    let processed = 0
    let credited = 0
    let completed = 0
    let capitalReturned = 0

    // Get all active/locked deposits that are due for profit
    const deposits = await db.deposit.findMany({
      where: {
        status: { in: ['active', 'locked'] },
        OR: [
          { nextProfitAt: null }, // Never had profit scheduled
          { nextProfitAt: { lte: now } }, // Due for profit
        ],
      },
      include: { plan: true, user: true },
    })

    for (const deposit of deposits) {
      const plan = deposit.plan
      const user = deposit.user

      // Skip if locked and not yet unlocked
      if (deposit.status === 'locked' && deposit.lockedUntil && new Date(deposit.lockedUntil) > now) {
        continue
      }

      // If locked deposit is now past lock date, activate it
      if (deposit.status === 'locked' && deposit.lockedUntil && new Date(deposit.lockedUntil) <= now) {
        await db.deposit.update({ where: { id: deposit.id }, data: { status: 'active' } })
      }

      // Check if plan has ended (duration-based)
      if (plan.durationDays > 0 && deposit.endsAt && new Date(deposit.endsAt) <= now) {
        // Plan ended - handle capital return
        if (plan.capitalReturn === 'end' && !deposit.capitalReturned) {
          // Return principal to user
          await db.user.update({
            where: { id: user.id },
            data: { tradingBalance: user.tradingBalance + deposit.amount },
          })
          await db.transactionLog.create({
            data: {
              userId: user.id, type: 'capital_return', amount: deposit.amount,
              balanceBefore: user.tradingBalance, balanceAfter: user.tradingBalance + deposit.amount,
              wallet: 'trading', description: `Capital returned from ${plan.name} plan`,
              referenceId: deposit.id,
            },
          })
          await db.deposit.update({ where: { id: deposit.id }, data: { capitalReturned: true } })
          capitalReturned++
        }
        // Mark deposit as ended
        await db.deposit.update({ where: { id: deposit.id }, data: { status: 'ended' } })
        completed++
        continue
      }

      // Check repeat count limit
      if (plan.repeatCount > 0 && deposit.profitCount >= plan.repeatCount) {
        // All payouts done
        if (plan.capitalReturn === 'end' && !deposit.capitalReturned) {
          await db.user.update({
            where: { id: user.id },
            data: { tradingBalance: user.tradingBalance + deposit.amount },
          })
          await db.transactionLog.create({
            data: {
              userId: user.id, type: 'capital_return', amount: deposit.amount,
              balanceBefore: user.tradingBalance, balanceAfter: user.tradingBalance + deposit.amount,
              wallet: 'trading', description: `Capital returned from ${plan.name} plan`,
              referenceId: deposit.id,
            },
          })
          await db.deposit.update({ where: { id: deposit.id }, data: { capitalReturned: true } })
          capitalReturned++
        }
        await db.deposit.update({ where: { id: deposit.id }, data: { status: 'completed' } })
        completed++
        continue
      }

      // Check max earning limit
      if (deposit.earnedSoFar >= plan.maxEarningLimit && plan.maxEarningLimit > 0) {
        await db.deposit.update({ where: { id: deposit.id }, data: { status: 'completed' } })
        completed++
        continue
      }

      // Calculate profit amount for this period using VARIABLE percentages
      // Based on user's risk category (low/medium/high) with randomized daily returns
      let profitAmount: number

      if (plan.totalReturnPercent > 0 && plan.repeatCount > 0) {
        // Fixed total return divided by number of payouts (for fixed-return plans)
        profitAmount = (deposit.amount * plan.totalReturnPercent / 100) / plan.repeatCount
      } else {
        // VARIABLE PERCENTAGE: Use deposit's risk level (per-deposit, stackable)
        // Falls back to user's global riskCategory if deposit doesn't have one
        const depositRiskLevel = (deposit as any).riskLevel || (user as any).riskCategory || 'medium'
        const customWinMin = (user as any).customWinMin
        const customWinMax = (user as any).customWinMax

        let minPercent: number
        let maxPercent: number

        // Use custom per-user overrides if set, otherwise use category defaults
        if (customWinMin !== null && customWinMax !== null && customWinMin !== undefined && customWinMax !== undefined) {
          minPercent = customWinMin
          maxPercent = customWinMax
        } else {
          // Get category settings from DB (cached in this run)
          const categoryDefaults: Record<string, { minPercent: number; maxPercent: number }> = {
            low: { minPercent: 0.3, maxPercent: 1.2 },
            medium: { minPercent: 1.0, maxPercent: 3.0 },
            high: { minPercent: 2.5, maxPercent: 8.0 },
          }
          const cat = categoryDefaults[depositRiskLevel] || categoryDefaults.medium
          minPercent = cat.minPercent
          maxPercent = cat.maxPercent
        }

        // Generate percentage skewed toward the minimum of the range
        // Uses a power curve to heavily favor lower returns (cost savings)
        const randomFactor = Math.pow(Math.random(), 3) // Cube makes it heavily skew low
        const dailyPercent = minPercent + (randomFactor * (maxPercent - minPercent))

        // Scale to the return period
        const periodsPerDay = 24 / plan.returnPeriodHours
        profitAmount = (deposit.amount * dailyPercent / 100) / periodsPerDay
      }

      // Apply stacking bonus
      if (plan.stackingEnabled && deposit.stackIndex > 1) {
        profitAmount += profitAmount * (plan.stackingBonusPercent * (deposit.stackIndex - 1)) / 100
      }

      // Cap at max earning limit
      if (plan.maxEarningLimit > 0) {
        profitAmount = Math.min(profitAmount, plan.maxEarningLimit - deposit.earnedSoFar)
      }

      if (profitAmount <= 0) continue

      // Credit profit to user
      const newBalance = user.tradingBalance + profitAmount
      await db.user.update({
        where: { id: user.id },
        data: {
          tradingBalance: newBalance,
          totalEarnings: user.totalEarnings + profitAmount,
        },
      })

      // Create earning record
      await db.earning.create({
        data: {
          userId: user.id, depositId: deposit.id, amount: profitAmount,
          type: 'daily', walletTarget: 'trading',
        },
      })

      // Create transaction log
      await db.transactionLog.create({
        data: {
          userId: user.id, type: 'profit', amount: profitAmount,
          balanceBefore: user.tradingBalance, balanceAfter: newBalance,
          wallet: 'trading',
          description: `${plan.name} plan profit (${plan.returnType} return)`,
          referenceId: deposit.id,
        },
      })

      // Update deposit
      const nextProfit = new Date(now.getTime() + plan.returnPeriodHours * 60 * 60 * 1000)
      await db.deposit.update({
        where: { id: deposit.id },
        data: {
          earnedSoFar: deposit.earnedSoFar + profitAmount,
          profitCount: deposit.profitCount + 1,
          lastProfitAt: now,
          nextProfitAt: nextProfit,
        },
      })

      // Distribute profit share to upline (30% of profit)
      const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
      const profitShareAmount = (profitAmount * plan.tradeProfitSharePercent) / 100
      let currentReferrerId = user.referredById
      let level = 0

      while (currentReferrerId && level < 7) {
        const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
        if (!referrer) break

        const shareAmount = (profitShareAmount * REFERRAL_PERCENTS[level]) / 100
        if (shareAmount > 0) {
          await db.earning.create({
            data: {
              userId: referrer.id, depositId: deposit.id, amount: shareAmount,
              type: 'profit_share', level: level + 1, walletTarget: 'trading',
            },
          })
          await db.user.update({
            where: { id: referrer.id },
            data: {
              totalEarnings: referrer.totalEarnings + shareAmount,
              tradingBalance: referrer.tradingBalance + shareAmount,
            },
          })
        }

        currentReferrerId = referrer.referredById
        level++
      }

      processed++
      credited += profitAmount
    }

    // Log the cron run
    await db.activityLog.create({
      data: {
        action: 'cron_profit_distribution',
        details: JSON.stringify({ processed, credited: credited.toFixed(2), completed, capitalReturned, timestamp: now.toISOString() }),
      },
    })

    return NextResponse.json({
      success: true,
      processed,
      totalCredited: credited.toFixed(2),
      completed,
      capitalReturned,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Cron profit distribution error:', error)
    return NextResponse.json({ error: 'Failed to distribute profits' }, { status: 500 })
  }
}

// GET - Check cron status / trigger manually from admin
export async function GET() {
  try {
    const lastRun = await db.activityLog.findFirst({
      where: { action: 'cron_profit_distribution' },
      orderBy: { createdAt: 'desc' },
    })

    const activeDeposits = await db.deposit.count({ where: { status: { in: ['active', 'locked'] } } })
    const dueDeposits = await db.deposit.count({
      where: { status: 'active', nextProfitAt: { lte: new Date() } },
    })

    return NextResponse.json({
      lastRun: lastRun ? JSON.parse(lastRun.details || '{}') : null,
      lastRunAt: lastRun?.createdAt || null,
      activeDeposits,
      dueDeposits,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get cron status' }, { status: 500 })
  }
}
