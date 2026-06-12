import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const { userId, riskMode, amount, dayOfWeek, operation, reason } = await request.json()

    if (!userId || !riskMode || !amount || !dayOfWeek) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const op = operation || 'add'
    if (op !== 'add' && op !== 'subtract') {
      return NextResponse.json({ error: 'Operation must be "add" or "subtract"' }, { status: 400 })
    }

    // Get user's active deposits
    const deposits = await db.deposit.findMany({
      where: { userId, status: { in: ['active', 'locked'] } },
      include: { plan: true },
    })

    if (deposits.length === 0) {
      return NextResponse.json({ error: 'No active deposits found for this user' }, { status: 404 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const results: any[] = []

    for (const deposit of deposits) {
      const absAmount = Math.abs(amount)
      const plan = deposit.plan
      const yieldPct = (absAmount / deposit.amount) * 100
      let accountHolderPct = plan.accountHolderPercent ?? 50
      let tradeProfitSharePct = plan.tradeProfitSharePercent ?? 30
      let rewardsOffersPct = plan.rewardsOffersPercent ?? 15
      let platformFeePct = plan.platformFeePercent ?? 5
      let pauseReferrals = false

      const { evaluatePlanLogics } = await import('@/lib/logic-engine')
      const logicResult = await evaluatePlanLogics(plan.id, yieldPct, plan)

      if (logicResult.disablePlan) {
        continue // Skip if plan is disabled by conditional logic
      }

      accountHolderPct = logicResult.accountHolderPercent
      tradeProfitSharePct = logicResult.tradeProfitSharePercent
      platformFeePct = logicResult.platformFeePercent
      pauseReferrals = logicResult.pauseReferrals

      const investorShare = (absAmount * accountHolderPct) / 100
      const sharePoolAmount = pauseReferrals ? 0 : (absAmount * tradeProfitSharePct) / 100
      const rewardsShare = (absAmount * rewardsOffersPct) / 100
      const platformFeeShare = (absAmount * platformFeePct) / 100

      if (op === 'subtract') {
        // SUBTRACT operation: reduce user's balance and earnings
        const earning = await db.earning.create({
          data: {
            userId,
            depositId: deposit.id,
            amount: -investorShare,
            type: 'subtract',
            walletTarget: 'trading',
          },
        })

        const profitDist = await db.profitDistribution.create({
          data: {
            depositId: deposit.id,
            amount: -absAmount,
            riskMode,
            dayOfWeek,
            operation: 'subtract',
            reason: reason || 'Admin adjustment - profit leveled',
          },
        })

        // Update deposit earned so far (reduce it)
        const newEarnedSoFar = Math.max(0, deposit.earnedSoFar - investorShare)
        await db.deposit.update({
          where: { id: deposit.id },
          data: { earnedSoFar: newEarnedSoFar },
        })

        // Reduce user trading balance and total earnings
        const newTradingBalance = Math.max(0, user.tradingBalance - investorShare)
        const newTotalEarnings = Math.max(0, user.totalEarnings - investorShare)
        await db.user.update({
          where: { id: userId },
          data: {
            tradingBalance: newTradingBalance,
            totalEarnings: newTotalEarnings,
          },
        })
        user.tradingBalance = newTradingBalance
        user.totalEarnings = newTotalEarnings

        // Reverse profit share to upline
        if (sharePoolAmount > 0) {
          const referralRules = await db.planReferralRule.findMany({
            where: { planId: plan.id, type: 'profit', enabled: true }
          })
          const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
          const maxLevels = plan.registrationReferralLevels || 7

          let currentReferrerId = user.referredById
          let level = 0

          while (currentReferrerId && level < maxLevels) {
            const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
            if (!referrer) break

            const directReferrals = await db.user.count({ where: { referredById: referrer.id } })

            // Enforce direct referrals condition: Level L (1-indexed) requires >= L direct referrals
            const requiredReferrals = level + 1
            if (directReferrals < requiredReferrals) {
              currentReferrerId = referrer.referredById
              level++
              continue
            }

            const rule = referralRules.find(r => r.level === (level + 1))
            let shareAmount = 0
            if (rule) {
              shareAmount = rule.amount > 0 ? rule.amount : (sharePoolAmount * rule.commission) / 100
            } else {
              const rate = REFERRAL_PERCENTS[level] !== undefined ? REFERRAL_PERCENTS[level] : 0
              shareAmount = (sharePoolAmount * rate) / 100
            }

            if (shareAmount > 0) {
              const targetWallet = rule?.targetWallet === 'withdrawal' ? 'withdrawal' : 'trading'
              await db.earning.create({
                data: {
                  userId: referrer.id,
                  depositId: deposit.id,
                  amount: -shareAmount,
                  type: 'subtract',
                  level: level + 1,
                  walletTarget: targetWallet,
                },
              })

              if (targetWallet === 'withdrawal') {
                await db.user.update({
                  where: { id: referrer.id },
                  data: {
                    totalEarnings: Math.max(0, referrer.totalEarnings - shareAmount),
                    withdrawalBalance: Math.max(0, referrer.withdrawalBalance - shareAmount),
                  },
                })
              } else {
                await db.user.update({
                  where: { id: referrer.id },
                  data: {
                    totalEarnings: Math.max(0, referrer.totalEarnings - shareAmount),
                    tradingBalance: Math.max(0, referrer.tradingBalance - shareAmount),
                  },
                })
              }
            }

            currentReferrerId = referrer.referredById
            level++
          }
        }

        // Deduct Rewards & Platform Fee from Admin/Platform account
        const admin = await db.user.findFirst({ where: { role: 'admin' } })
        if (admin) {
          if (rewardsShare > 0) {
            const adminBefore = admin.tradingBalance
            const adminAfter = Math.max(0, adminBefore - rewardsShare)

            await db.user.update({
              where: { id: admin.id },
              data: {
                tradingBalance: adminAfter,
                totalEarnings: Math.max(0, admin.totalEarnings - rewardsShare),
              },
            })

            admin.tradingBalance = adminAfter
            admin.totalEarnings = Math.max(0, admin.totalEarnings - rewardsShare)

            await db.earning.create({
              data: {
                userId: admin.id,
                depositId: deposit.id,
                amount: -rewardsShare,
                type: 'subtract',
                walletTarget: 'trading',
              },
            })
          }
          if (platformFeeShare > 0) {
            const adminBefore = admin.tradingBalance
            const adminAfter = Math.max(0, adminBefore - platformFeeShare)

            await db.user.update({
              where: { id: admin.id },
              data: {
                tradingBalance: adminAfter,
                totalEarnings: Math.max(0, admin.totalEarnings - platformFeeShare),
              },
            })

            admin.tradingBalance = adminAfter
            admin.totalEarnings = Math.max(0, admin.totalEarnings - platformFeeShare)

            await db.earning.create({
              data: {
                userId: admin.id,
                depositId: deposit.id,
                amount: -platformFeeShare,
                type: 'subtract',
                walletTarget: 'trading',
              },
            })
          }
        }

        results.push({ earning, profitDist })
      } else {
        // ADD operation
        // Calculate stacking bonus
        const stackingBonus = deposit.plan.stackingEnabled && deposit.stackIndex > 1
          ? deposit.plan.stackingBonusPercent * (deposit.stackIndex - 1)
          : 0
        const effectiveDailyPercent = deposit.plan.dailyEarningPercent + stackingBonus

        if (investorShare > 0) {
          const earning = await db.earning.create({
            data: {
              userId,
              depositId: deposit.id,
              amount: investorShare,
              type: 'daily',
              walletTarget: 'trading',
            },
          })

          // Update deposit earned so far
          await db.deposit.update({
            where: { id: deposit.id },
            data: { earnedSoFar: deposit.earnedSoFar + investorShare },
          })

          // Update user trading balance and total earnings
          const newTradingBalance = user.tradingBalance + investorShare
          const newTotalEarnings = user.totalEarnings + investorShare
          await db.user.update({
            where: { id: userId },
            data: {
              tradingBalance: newTradingBalance,
              totalEarnings: newTotalEarnings,
            },
          })
          user.tradingBalance = newTradingBalance
          user.totalEarnings = newTotalEarnings
        }

        const profitDist = await db.profitDistribution.create({
          data: {
            depositId: deposit.id,
            amount: absAmount,
            riskMode,
            dayOfWeek,
            operation: 'add',
            reason: reason || `Daily profit added (${riskMode} mode, ${effectiveDailyPercent}% effective)`,
          },
        })

        // Distribute profit share to upline (referrals)
        if (sharePoolAmount > 0) {
          const referralRules = await db.planReferralRule.findMany({
            where: { planId: plan.id, type: 'profit', enabled: true },
            orderBy: { level: 'asc' }
          })
          const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
          const maxLevels = plan.registrationReferralLevels || 7
          let currentReferrerId = user.referredById
          let level = 0

          while (currentReferrerId && level < maxLevels) {
            const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
            if (!referrer) break

            const directReferrals = await db.user.count({ where: { referredById: referrer.id } })

            // Enforce direct referrals condition: Level L (1-indexed) requires >= L direct referrals
            const requiredReferrals = level + 1
            if (directReferrals < requiredReferrals) {
              currentReferrerId = referrer.referredById
              level++
              continue
            }

            const activeDepositsList = await db.deposit.findMany({
              where: { userId: referrer.id, status: 'active' },
              select: { amount: true }
            })
            const activeDepositsTotal = activeDepositsList.reduce((sum, d) => sum + d.amount, 0)

            const rule = referralRules.find(r => r.level === (level + 1))
            let shareAmount = 0
            if (rule) {
              if (activeDepositsTotal >= rule.minSponsorDeposit && directReferrals >= rule.minDirectReferrals) {
                shareAmount = rule.amount > 0 ? rule.amount : (sharePoolAmount * rule.commission) / 100
              }
            } else {
              const rate = REFERRAL_PERCENTS[level] !== undefined ? REFERRAL_PERCENTS[level] : 0
              shareAmount = (sharePoolAmount * rate) / 100
            }

            if (shareAmount > 0) {
              const targetWallet = rule?.targetWallet === 'withdrawal' ? 'withdrawal' : 'trading'
              await db.earning.create({
                data: {
                  userId: referrer.id,
                  depositId: deposit.id,
                  amount: shareAmount,
                  type: 'profit_share',
                  level: level + 1,
                  walletTarget: targetWallet,
                },
              })

              if (targetWallet === 'withdrawal') {
                await db.user.update({
                  where: { id: referrer.id },
                  data: {
                    totalEarnings: referrer.totalEarnings + shareAmount,
                    withdrawalBalance: referrer.withdrawalBalance + shareAmount,
                  },
                })
              } else {
                await db.user.update({
                  where: { id: referrer.id },
                  data: {
                    totalEarnings: referrer.totalEarnings + shareAmount,
                    tradingBalance: referrer.tradingBalance + shareAmount,
                  },
                })
              }
            }

            currentReferrerId = referrer.referredById
            level++
          }
        }

        // Credit Rewards & Platform Fee to Admin/Platform account
        const admin = await db.user.findFirst({ where: { role: 'admin' } })
        if (admin) {
          if (rewardsShare > 0) {
            const adminBefore = admin.tradingBalance
            const adminAfter = adminBefore + rewardsShare
            
            await db.user.update({
              where: { id: admin.id },
              data: {
                tradingBalance: adminAfter,
                totalEarnings: admin.totalEarnings + rewardsShare,
              },
            })
            
            await db.earning.create({
              data: {
                userId: admin.id,
                depositId: deposit.id,
                amount: rewardsShare,
                type: 'rewards',
                walletTarget: 'trading',
              },
            })

            await db.transactionLog.create({
              data: {
                userId: admin.id,
                type: 'bonus',
                amount: rewardsShare,
                balanceBefore: adminBefore,
                balanceAfter: adminAfter,
                wallet: 'trading',
                description: `Rewards allocation (${rewardsOffersPct}%) from manual profit distribution`,
                referenceId: deposit.id,
              },
            })
            
            admin.tradingBalance = adminAfter
            admin.totalEarnings += rewardsShare
          }

          if (platformFeeShare > 0) {
            const adminBefore = admin.tradingBalance
            const adminAfter = adminBefore + platformFeeShare
            
            await db.user.update({
              where: { id: admin.id },
              data: {
                tradingBalance: adminAfter,
                totalEarnings: admin.totalEarnings + platformFeeShare,
              },
            })
            
            await db.earning.create({
              data: {
                userId: admin.id,
                depositId: deposit.id,
                amount: platformFeeShare,
                type: 'platform_fee',
                walletTarget: 'trading',
              },
            })

            await db.transactionLog.create({
              data: {
                userId: admin.id,
                type: 'fee',
                amount: platformFeeShare,
                balanceBefore: adminBefore,
                balanceAfter: adminAfter,
                wallet: 'trading',
                description: `Platform fee allocation (${platformFeePct}%) from manual profit distribution`,
                referenceId: deposit.id,
              },
            })
            
            admin.tradingBalance = adminAfter
            admin.totalEarnings += platformFeeShare
          }
        }

        results.push({ profitDist })

        // Check if deposit reached max earning limit
        if (deposit.earnedSoFar >= deposit.plan.maxEarningLimit) {
          await db.deposit.update({
            where: { id: deposit.id },
            data: { status: 'completed' },
          })
        }
      }
    }

    return NextResponse.json({
      message: op === 'add' ? 'Profit added successfully' : 'Profit subtracted successfully',
      operation: op,
      results,
    }, { status: 201 })
  } catch (error) {
    console.error('Profit operation error:', error)
    return NextResponse.json({ error: 'Failed to process profit operation' }, { status: 500 })
  }
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {}
    if (userId) {
      const deposits = await db.deposit.findMany({ where: { userId } })
      where.depositId = { in: deposits.map(d => d.id) }
    }

    const distributions = await db.profitDistribution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(distributions)
  } catch (error) {
    console.error('Get profit distributions error:', error)
    return NextResponse.json({ error: 'Failed to get profit distributions' }, { status: 500 })
  }
}
