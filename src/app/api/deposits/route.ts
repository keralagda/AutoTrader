import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const deposits = await db.deposit.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(deposits)
  } catch (error) {
    console.error('Get deposits error:', error)
    return NextResponse.json({ error: 'Failed to get deposits' }, { status: 500 })
  }
}

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

    const { userId, planId, amount, paymentMethod, riskLevel } = await request.json()

    if (!userId || !planId || !amount) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (!plan.isActive) {
      return NextResponse.json({ error: 'This plan is currently inactive' }, { status: 400 })
    }

    if (amount < plan.minDeposit || amount > plan.maxDeposit) {
      // Admin bypasses deposit limits
      const userCheck = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (userCheck?.role !== 'admin') {
        return NextResponse.json({
          error: `Deposit must be between $${plan.minDeposit} and $${plan.maxDeposit}`
        }, { status: 400 })
      }
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin'

    // 1. VIP Tier Check
    const VIP_TIERS = { Bronze: 0, Silver: 1, Gold: 2, Platinum: 3 }
    type VipTier = keyof typeof VIP_TIERS
    const getVipTier = (total: number): VipTier => {
      if (total >= 25000) return 'Platinum'
      if (total >= 5000) return 'Gold'
      if (total >= 500) return 'Silver'
      return 'Bronze'
    }

    const userDeposits = await db.deposit.findMany({
      where: { userId, status: { in: ['active', 'locked'] } },
      select: { amount: true }
    })
    const totalDeposited = userDeposits.reduce((sum, d) => sum + d.amount, 0)
    const userTier = getVipTier(totalDeposited)
    const minVip = (plan.minVipTier || 'Bronze') as VipTier
    if ((VIP_TIERS[userTier] ?? 0) < (VIP_TIERS[minVip] ?? 0)) {
      if (!isAdmin) {
        return NextResponse.json({
          error: `Your VIP tier is ${userTier}. This plan requires ${minVip} tier.`
        }, { status: 400 })
      }
    }

    // 2. Spots Limit Check
    if (plan.spotsLimit > 0) {
      const activeSpotsCount = await db.deposit.count({
        where: { planId: plan.id, status: { in: ['active', 'locked', 'pending'] } }
      })
      if (activeSpotsCount >= plan.spotsLimit) {
        if (!isAdmin) {
          return NextResponse.json({
            error: `This plan has reached its limit of ${plan.spotsLimit} active spots.`
          }, { status: 400 })
        }
      }
    }

    // 3. Deposit Multiples Validation
    if (plan.strictMultiples && plan.depositMultipleOf > 0) {
      const isMultiple = Math.abs(amount / plan.depositMultipleOf - Math.round(amount / plan.depositMultipleOf)) < 1e-5
      if (!isMultiple) {
        if (!isAdmin) {
          return NextResponse.json({
            error: `Deposit amount must be a multiple of $${plan.depositMultipleOf}`
          }, { status: 400 })
        }
      }
    }

    // Check stacking limits (skip for admin)
    if (!isAdmin) {
      if (plan.stackingEnabled) {
        const existingDepositsCount = await db.deposit.count({
          where: { userId, planId, status: 'active' },
        })
        if (existingDepositsCount >= plan.maxStacks) {
          return NextResponse.json({
            error: `Maximum ${plan.maxStacks} active deposits allowed for ${plan.name} plan`
          }, { status: 400 })
        }
      } else {
        const existingDeposit = await db.deposit.findFirst({
          where: { userId, planId, status: 'active' },
        })
        if (existingDeposit) {
          return NextResponse.json({
            error: `You already have an active deposit in the ${plan.name} plan. Stacking is not enabled.`
          }, { status: 400 })
        }
      }
    }

    // Calculate stack index
    const existingDeposits = await db.deposit.findMany({
      where: { userId, planId, status: 'active' },
      orderBy: { stackIndex: 'desc' },
    })
    const stackIndex = existingDeposits.length > 0 ? existingDeposits[0].stackIndex + 1 : 1

    // Calculate stacking bonus for this deposit
    const stackingBonus = plan.stackingEnabled && stackIndex > 1
      ? plan.stackingBonusPercent * (stackIndex - 1)
      : 0

    // Calculate lock period
    const lockedUntil = plan.lockPeriodDays > 0
      ? new Date(Date.now() + plan.lockPeriodDays * 24 * 60 * 60 * 1000)
      : null

    // Calculate plan end date and next profit time
    const now = new Date()
    const endsAt = plan.durationDays > 0
      ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
      : null
    
    // Add gracePeriodDays to nextProfitAt delay
    const graceDays = plan.gracePeriodDays || 0
    const nextProfitAt = new Date(now.getTime() + (plan.returnPeriodHours * 60 * 60 * 1000) + (graceDays * 24 * 60 * 60 * 1000))

    // Check if user has enough balance in trading wallet (skip for admin)
    if (!isAdmin && amount > user.tradingBalance) {
      return NextResponse.json({
        error: `Insufficient trading wallet balance. You have $${user.tradingBalance.toFixed(2)}. Deposit funds first.`
      }, { status: 400 })
    }

    // Create deposit - pending approval for regular users, active for admin
    let depositStatus: string
    if (isAdmin) {
      depositStatus = plan.lockPeriodDays > 0 ? 'locked' : 'active'
    } else {
      depositStatus = 'pending' // Requires admin approval before profits start
    }

    const deposit = await db.deposit.create({
      data: {
        userId,
        planId,
        amount,
        status: depositStatus,
        earnedSoFar: 0,
        stackIndex,
        riskLevel: riskLevel || user.riskCategory || 'medium',
        lockedUntil,
        endsAt,
        nextProfitAt: depositStatus === 'pending' ? null : nextProfitAt, // Don't schedule profit until approved
      },
    })

    // Deduct from trading wallet
    const newBalance = isAdmin ? user.tradingBalance : user.tradingBalance - amount
    await db.user.update({
      where: { id: userId },
      data: {
        tradingBalance: newBalance,
      },
    })

    // Transaction log
    await db.transactionLog.create({
      data: {
        userId, type: 'investment', amount: -amount,
        balanceBefore: user.tradingBalance, balanceAfter: newBalance,
        wallet: 'trading', description: `Invested $${amount} in ${plan.name} plan`,
        referenceId: deposit.id,
      },
    })

    // Create payment record
    if (paymentMethod) {
      await db.payment.create({
        data: {
          userId,
          amount,
          method: paymentMethod,
          status: 'confirmed',
          planId,
        },
      })
    }

    // Process referral earnings from deposit bonus (only for immediately active deposits, not pending)
    if (depositStatus !== 'pending') {
      const planNameLower = plan.name.toLowerCase()
      const isDailyFlashPlan = planNameLower.includes('silver') || planNameLower.includes('gold') || planNameLower.includes('platinum')

      const referralRules = await db.planReferralRule.findMany({
        where: { planId: plan.id, type: 'deposit', enabled: true }
      })

      const DEFAULT_DEP_PERCENTS = isDailyFlashPlan ? [5, 2, 1, 0.5, 0.5, 0.5, 0.5] : [0, 0, 0, 0, 0, 0, 0]
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

        // Process Deposit Bonus (based on deposit amount)
        let depEarning = 0
        const depRule = referralRules.find(r => r.level === (level + 1) && r.type === 'deposit')
        if (depRule) {
          if (activeDepositsTotal >= depRule.minSponsorDeposit && directReferrals >= depRule.minDirectReferrals) {
            depEarning = depRule.amount > 0 ? depRule.amount : (amount * depRule.commission) / 100
          }
        } else {
          const rate = DEFAULT_DEP_PERCENTS[level] !== undefined ? DEFAULT_DEP_PERCENTS[level] : 0
          depEarning = (amount * rate) / 100
        }

        if (depEarning > 0) {
          const depWallet = depRule?.targetWallet === 'withdrawal' ? 'withdrawal' : 'trading'

          // Payout deposit bonus referral earnings
          if (depWallet === 'withdrawal') {
            await db.user.update({
              where: { id: referrer.id },
              data: {
                withdrawalBalance: referrer.withdrawalBalance + depEarning,
                totalEarnings: referrer.totalEarnings + depEarning
              }
            })
          } else {
            await db.user.update({
              where: { id: referrer.id },
              data: {
                tradingBalance: referrer.tradingBalance + depEarning,
                totalEarnings: referrer.totalEarnings + depEarning
              }
            })
          }
          await db.earning.create({
            data: {
              userId: referrer.id,
              depositId: deposit.id,
              amount: depEarning,
              type: 'referral',
              level: level + 1,
              walletTarget: depWallet
            }
          })

          await db.notification.create({
            data: {
              userId: referrer.id,
              title: 'Referral Earnings!',
              message: `You earned $${depEarning.toFixed(2)} from ${user.name}'s deposit (Level ${level + 1})`,
              type: 'referral'
            }
          })
        }

        currentReferrerId = referrer.referredById
        level++
      }
    }

    return NextResponse.json({
      ...deposit,
      stackingBonus,
      effectiveDailyPercent: plan.dailyEarningPercent + stackingBonus,
    }, { status: 201 })
  } catch (error) {
    console.error('Create deposit error:', error)
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}
