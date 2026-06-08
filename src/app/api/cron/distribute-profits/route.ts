import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// This endpoint is called by:
// 1. Vercel Cron (vercel.json schedule) - sends CRON_SECRET via Authorization header
// 2. cron-job.org - sends x-cron-secret header
// 3. Admin manual trigger from dashboard

export async function POST(request: Request) {
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

      // Skip if user is not active (hasn't made a deposit yet)
      if (!user.isActive) continue

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

      // 1. Check scheduling: Days, Hours, Holidays
      const dayAbbr = now.toLocaleString('en-US', { weekday: 'short' }).toLowerCase() // e.g. "mon"
      const daysAllowed = plan.profitDays ? plan.profitDays.toLowerCase().split(',') : []
      let skipDueToSchedule = false

      if (daysAllowed.length > 0 && !daysAllowed.includes(dayAbbr)) {
        skipDueToSchedule = true
      }
      if (!skipDueToSchedule && plan.holidayPauses) {
        const currentDateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
        const holidays = plan.holidayPauses.split(',')
        if (holidays.includes(currentDateStr)) {
          skipDueToSchedule = true
        }
      }
      if (!skipDueToSchedule && plan.profitHours) {
        const currentHour = now.getHours().toString() // e.g. "14"
        const hoursAllowed = plan.profitHours.split(',')
        if (!hoursAllowed.includes(currentHour)) {
          skipDueToSchedule = true
        }
      }

      if (skipDueToSchedule) {
        // Prevent cron from getting stuck by advancing nextProfitAt to the next scheduled interval
        const currentNext = deposit.nextProfitAt || now
        const nextProfit = new Date(currentNext.getTime() + plan.returnPeriodHours * 60 * 60 * 1000)
        await db.deposit.update({
          where: { id: deposit.id },
          data: { nextProfitAt: nextProfit },
        })
        continue
      }

      // 2. Determine Volatility Mode & P&L Logics
      const rand = Math.random() * 100
      let isLossDay = false
      let isBonusDay = false

      if (rand < (plan.lossDayChance || 0)) {
        isLossDay = true
      } else if (rand > (100 - (plan.bonusDayChance || 0))) {
        isBonusDay = true
      }

      let dailyPercent = 0
      if (isLossDay) {
        // Negative return within minLossPercent and maxLossPercent
        const minLoss = plan.minLossPercent || 0.1
        const maxLoss = plan.maxLossPercent || 5.0
        dailyPercent = -(minLoss + Math.random() * (maxLoss - minLoss))
      } else {
        // Positive return - check risk category overrides or defaults
        const depositRiskLevel = deposit.riskLevel || user.riskCategory || 'medium'
        const customWinMin = (user as any).customWinMin
        const customWinMax = (user as any).customWinMax

        let minPercent: number
        let maxPercent: number

        if (customWinMin !== null && customWinMax !== null && customWinMin !== undefined && customWinMax !== undefined) {
          minPercent = customWinMin
          maxPercent = customWinMax
        } else {
          if (depositRiskLevel === 'low') {
            minPercent = plan.lowRiskMin ?? 0.5
            maxPercent = plan.lowRiskMax ?? 2.0
          } else if (depositRiskLevel === 'high') {
            minPercent = plan.highRiskMin ?? 5.0
            maxPercent = plan.highRiskMax ?? 15.0
          } else {
            // medium
            minPercent = plan.mediumRiskMin ?? 2.0
            maxPercent = plan.mediumRiskMax ?? 5.0
          }
        }

        let volatilityMultiplier = 1.0
        if (plan.volatilityMode === 'low') {
          volatilityMultiplier = 0.7
        } else if (plan.volatilityMode === 'high') {
          volatilityMultiplier = 1.3
        }

        let bonusMultiplier = 1.0
        if (isBonusDay) {
          bonusMultiplier = 1.5
        }

        const randomFactor = Math.pow(Math.random(), 3)
        dailyPercent = (minPercent + (randomFactor * (maxPercent - minPercent))) * volatilityMultiplier * bonusMultiplier
      }

      // Calculate gross profit amount for this period
      const periodsPerDay = 24 / plan.returnPeriodHours
      let profitAmount = (deposit.amount * dailyPercent / 100) / periodsPerDay

      // Apply stacking bonus (only for positive returns)
      if (profitAmount > 0 && plan.stackingEnabled && deposit.stackIndex > 1) {
        profitAmount += profitAmount * (plan.stackingBonusPercent * (deposit.stackIndex - 1)) / 100
      }

      // Handle Negative P&L (Loss Day)
      if (profitAmount < 0) {
        let actualLossAmount = profitAmount
        if (!plan.allowNegativeBalance) {
          if (user.tradingBalance + profitAmount < 0) {
            actualLossAmount = -user.tradingBalance // Clamp loss to remaining balance
          }
        }

        if (actualLossAmount < 0) {
          const newBalance = user.tradingBalance + actualLossAmount
          await db.user.update({
            where: { id: user.id },
            data: {
              tradingBalance: newBalance,
              totalEarnings: { decrement: Math.abs(actualLossAmount) }
            }
          })

          await db.earning.create({
            data: {
              userId: user.id, depositId: deposit.id, amount: actualLossAmount,
              type: 'daily', walletTarget: 'trading',
            },
          })

          await db.transactionLog.create({
            data: {
              userId: user.id, type: 'fee', amount: actualLossAmount,
              balanceBefore: user.tradingBalance, balanceAfter: newBalance,
              wallet: 'trading',
              description: `${plan.name} plan loss distribution`,
              referenceId: deposit.id,
            },
          })

          // Record PnLLog
          await db.planPnLLog.create({
            data: {
              planId: plan.id,
              yield: dailyPercent,
              isLoss: true,
              distributed: actualLossAmount,
            }
          })

          user.tradingBalance = newBalance
          credited += actualLossAmount
        }

        const nextProfit = new Date(now.getTime() + plan.returnPeriodHours * 60 * 60 * 1000)
        await db.deposit.update({
          where: { id: deposit.id },
          data: {
            earnedSoFar: deposit.earnedSoFar + actualLossAmount,
            profitCount: deposit.profitCount + 1,
            lastProfitAt: now,
            nextProfitAt: nextProfit,
          },
        })

        processed++
        continue
      }

      // Cap at max earning limit
      if (plan.maxEarningLimit > 0) {
        profitAmount = Math.min(profitAmount, plan.maxEarningLimit - deposit.earnedSoFar)
      }

      if (profitAmount <= 0) continue

      // Calculate splits based on plan settings (8-way split)
      const accountHolderPct = plan.accountHolderPercent ?? 50
      const tradeProfitSharePct = plan.tradeProfitSharePercent ?? 30
      const rewardsOffersPct = plan.rewardsOffersPercent ?? 15
      const platformFeePct = plan.platformFeePercent ?? 5
      const charityPct = plan.charityDonationPercent ?? 0
      const insurancePct = plan.insuranceReservePercent ?? 0
      const developerPct = plan.developerFundPercent ?? 0
      const liquidityPct = plan.liquidityPoolPercent ?? 0

      let investorShare = (profitAmount * accountHolderPct) / 100
      let sharePoolAmount = (profitAmount * tradeProfitSharePct) / 100
      let rewardsShare = (profitAmount * rewardsOffersPct) / 100
      let platformFeeShare = (profitAmount * platformFeePct) / 100
      let charityShare = (profitAmount * charityPct) / 100
      let insuranceShare = (profitAmount * insurancePct) / 100
      let developerShare = (profitAmount * developerPct) / 100
      let liquidityShare = (profitAmount * liquidityPct) / 100

      // Enforce Earning Capping
      const dailyCapUSD = deposit.amount * (plan.dailyEarningCapPercent || 0) / 100
      if (plan.dailyEarningCapPercent > 0) {
        let sumToCheck = 0
        if (plan.cappingAppliesTo === 'all') {
          sumToCheck = investorShare + sharePoolAmount
        } else if (plan.cappingAppliesTo === 'profits_only') {
          sumToCheck = investorShare
        } else if (plan.cappingAppliesTo === 'referrals_only') {
          sumToCheck = sharePoolAmount
        }

        if (sumToCheck > dailyCapUSD) {
          const clampRatio = dailyCapUSD / sumToCheck
          profitAmount = profitAmount * clampRatio

          // Recalculate splits
          investorShare = (profitAmount * accountHolderPct) / 100
          sharePoolAmount = (profitAmount * tradeProfitSharePct) / 100
          rewardsShare = (profitAmount * rewardsOffersPct) / 100
          platformFeeShare = (profitAmount * platformFeePct) / 100
          charityShare = (profitAmount * charityPct) / 100
          insuranceShare = (profitAmount * insurancePct) / 100
          developerShare = (profitAmount * developerPct) / 100
          liquidityShare = (profitAmount * liquidityPct) / 100
        }
      }

      if (investorShare > 0) {
        // Credit profit to user
        const newBalance = user.tradingBalance + investorShare
        await db.user.update({
          where: { id: user.id },
          data: {
            tradingBalance: newBalance,
            totalEarnings: user.totalEarnings + investorShare,
          },
        })

        // Create earning record
        await db.earning.create({
          data: {
            userId: user.id, depositId: deposit.id, amount: investorShare,
            type: 'daily', walletTarget: 'trading',
          },
        })

        // Create transaction log
        await db.transactionLog.create({
          data: {
            userId: user.id, type: 'profit', amount: investorShare,
            balanceBefore: user.tradingBalance, balanceAfter: newBalance,
            wallet: 'trading',
            description: `${plan.name} plan profit (${plan.returnType} return)`,
            referenceId: deposit.id,
          },
        })

        // Update local user object for subsequent loop operations
        user.tradingBalance = newBalance
        user.totalEarnings += investorShare
      }

      // Update deposit
      const nextProfit = new Date(now.getTime() + plan.returnPeriodHours * 60 * 60 * 1000)
      await db.deposit.update({
        where: { id: deposit.id },
        data: {
          earnedSoFar: deposit.earnedSoFar + investorShare,
          profitCount: deposit.profitCount + 1,
          lastProfitAt: now,
          nextProfitAt: nextProfit,
        },
      })

      // Record PlanPnLLog
      await db.planPnLLog.create({
        data: {
          planId: plan.id,
          yield: dailyPercent,
          isLoss: false,
          distributed: investorShare,
        }
      })

      // Distribute profit share to upline (referrals) using dynamic referral rules
      if (sharePoolAmount > 0) {
        const referralRules = await db.planReferralRule.findMany({
          where: { planId: plan.id },
          orderBy: { level: 'asc' },
        })

        const referralRates = referralRules.length > 0 
          ? referralRules.map(r => r.commission)
          : [25, 20, 15, 10, 10, 10, 10]

        const maxLevels = plan.registrationReferralLevels || referralRates.length
        let currentReferrerId = user.referredById
        let level = 0

        while (currentReferrerId && level < maxLevels) {
          const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
          if (!referrer) break

          const rate = referralRates[level] !== undefined ? referralRates[level] : 0
          const shareAmount = (sharePoolAmount * rate) / 100
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
      }

      // Process Insurance reserve vault contribution
      if (insuranceShare > 0) {
        await db.planInsuranceVault.upsert({
          where: { planId: plan.id },
          update: { balance: { increment: insuranceShare } },
          create: { planId: plan.id, balance: insuranceShare },
        })
      }

      // Credit remaining platform splits to Admin/Platform account
      const admin = await db.user.findFirst({ where: { role: 'admin' } })
      if (admin) {
        const splitsToAdmin = [
          { amount: rewardsShare, pct: rewardsOffersPct, type: 'rewards', desc: 'Rewards allocation' },
          { amount: platformFeeShare, pct: platformFeePct, type: 'platform_fee', desc: 'Platform fee allocation' },
          { amount: charityShare, pct: charityPct, type: 'charity', desc: 'Charity donation allocation' },
          { amount: developerShare, pct: developerPct, type: 'developer_fee', desc: 'Developer fund allocation' },
          { amount: liquidityShare, pct: liquidityPct, type: 'liquidity_pool', desc: 'Liquidity pool allocation' },
        ]

        for (const split of splitsToAdmin) {
          if (split.amount > 0) {
            const adminBefore = admin.tradingBalance
            const adminAfter = adminBefore + split.amount

            await db.user.update({
              where: { id: admin.id },
              data: {
                tradingBalance: adminAfter,
                totalEarnings: admin.totalEarnings + split.amount,
              },
            })

            await db.earning.create({
              data: {
                userId: admin.id,
                depositId: deposit.id,
                amount: split.amount,
                type: split.type,
                walletTarget: 'trading',
              },
            })

            await db.transactionLog.create({
              data: {
                userId: admin.id,
                type: split.type === 'platform_fee' || split.type === 'developer_fee' ? 'fee' : 'bonus',
                amount: split.amount,
                balanceBefore: adminBefore,
                balanceAfter: adminAfter,
                wallet: 'trading',
                description: `${split.desc} (${split.pct}%) from ${plan.name} profit distribution`,
                referenceId: deposit.id,
              },
            })

            admin.tradingBalance = adminAfter
            admin.totalEarnings += split.amount
          }
        }
      }

      processed++
      credited += investorShare
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
