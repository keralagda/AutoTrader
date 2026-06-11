import { db } from './db'

export async function runProfitDistribution() {
  const lastRunKey = 'last_auto_distribute_time'
  const now = new Date()
  const nowStr = now.toISOString()

  // 1. Distributed lock to prevent concurrent runs (within 30 seconds)
  try {
    const lastRun = await db.setting.findUnique({ where: { key: lastRunKey } })
    if (lastRun) {
      const lastRunTime = new Date(lastRun.value).getTime()
      if (Date.now() - lastRunTime < 30000) {
        return { success: true, skipped: true, reason: 'Distributed lock active (run within last 30s)' }
      }
    }
    await db.setting.upsert({
      where: { key: lastRunKey },
      create: { key: lastRunKey, value: nowStr },
      update: { value: nowStr },
    })
  } catch (lockError) {
    console.error('Lock error in profit distribution:', lockError)
    // Continue anyway if database connectivity is working
  }

  let processed = 0
  let credited = 0
  let completed = 0
  let capitalReturned = 0

  // Load global logic builder config
  const globalSetting = await db.setting.findUnique({ where: { key: 'logic_builder_config' } })
  const globalConfig = globalSetting ? JSON.parse(globalSetting.value) : null

  let globalBaseSkew = 3
  let globalMinFloor = 0.1
  let globalDailyCap = 15
  let globalVolatility = 0.5
  let globalLossChance = 5
  let globalBonusChance = 3
  let globalCompoundRate = 1.02
  let globalReferralBoost = 0.05

  if (globalConfig?.variables) {
    const vars = globalConfig.variables
    const findVal = (id: string, def: number) => {
      const v = vars.find((x: any) => x.id === id)
      return v ? (v.value !== undefined ? v.value : (v.min + v.max) / 2) : def
    }
    globalBaseSkew = findVal('var_base_skew', 3)
    globalMinFloor = findVal('var_min_floor', 0.1)
    globalDailyCap = findVal('var_daily_cap', 15)
    globalVolatility = findVal('var_volatility', 0.5)
    globalLossChance = findVal('var_loss_threshold', 5)
    globalBonusChance = findVal('var_bonus_threshold', 3)
    globalCompoundRate = findVal('var_compound_rate', 1.02)
    globalReferralBoost = findVal('var_referral_boost', 0.05)
  }

  const globalProfitRules = globalConfig?.profitRules || []
  const isLossDayGlobalRule = globalProfitRules.find((r: any) => r.id === 'loss_day' && r.enabled)
  const isBonusDayGlobalRule = globalProfitRules.find((r: any) => r.id === 'bonus_day' && r.enabled)
  const isWeekendReducedGlobalRule = globalProfitRules.find((r: any) => r.id === 'weekend_reduced' && r.enabled)
  const isWeekdayOnlyGlobalRule = globalProfitRules.find((r: any) => r.id === 'weekday_only' && r.enabled)
  const isVipMultiplierGlobalRule = globalProfitRules.find((r: any) => r.id === 'vip_multiplier' && r.enabled)
  const isReferralBoostGlobalRule = globalProfitRules.find((r: any) => r.id === 'referral_boost' && r.enabled)
  const isMinFloorGlobalRule = globalProfitRules.find((r: any) => r.id === 'min_floor' && r.enabled)

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

  if (deposits.length === 0) {
    return {
      success: true,
      processed: 0,
      totalCredited: '0.00',
      completed: 0,
      capitalReturned: 0,
      timestamp: nowStr,
    }
  }

  for (const deposit of deposits) {
    const plan = deposit.plan
    const user = deposit.user

    // Skip if user is not active
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
    if (isWeekdayOnlyGlobalRule && (dayAbbr === 'sat' || dayAbbr === 'sun')) {
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

    const lossChance = isLossDayGlobalRule ? globalLossChance : (plan.lossDayChance || 0)
    const bonusChance = isBonusDayGlobalRule ? globalBonusChance : (plan.bonusDayChance || 0)

    if (rand < lossChance) {
      isLossDay = true
    } else if (rand > (100 - bonusChance)) {
      isBonusDay = true
    }

    let dailyPercent = 0
    if (isLossDay) {
      const minLoss = plan.minLossPercent || 0.1
      const maxLoss = plan.maxLossPercent || 5.0
      dailyPercent = -(minLoss + Math.random() * (maxLoss - minLoss))
    } else {
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
          minPercent = plan.mediumRiskMin ?? 2.0
          maxPercent = plan.mediumRiskMax ?? 5.0
        }
      }

      let volatilityMultiplier = 1.0
      const volMode = plan.volatilityMode || 'moderate'
      if (volMode === 'low') {
        volatilityMultiplier = 0.7
      } else if (volMode === 'high') {
        volatilityMultiplier = 1.3
      } else if (globalConfig) {
        volatilityMultiplier = globalVolatility * 2
      }

      let bonusMultiplier = 1.0
      if (isBonusDay) {
        bonusMultiplier = isBonusDayGlobalRule ? 2.0 : 1.5
      }

      let vipMultiplier = 1.0
      if (isVipMultiplierGlobalRule) {
        const userVipTier = (user as any).vipTier || 'Bronze'
        const tiers = isVipMultiplierGlobalRule.tiers || { bronze: 1.0, silver: 1.02, gold: 1.05, platinum: 1.08 }
        const tierMultiplier = tiers[userVipTier.toLowerCase()] || 1.0
        vipMultiplier = tierMultiplier
      }

      let weekendMultiplier = 1.0
      if (isWeekendReducedGlobalRule && (dayAbbr === 'sat' || dayAbbr === 'sun')) {
        const ruleVal = isWeekendReducedGlobalRule.value !== undefined ? isWeekendReducedGlobalRule.value : 0.3
        weekendMultiplier = ruleVal
      }

      let referralBoostPercent = 0
      if (isReferralBoostGlobalRule) {
        const directReferrals = await db.user.count({ where: { referredById: user.id } })
        if (directReferrals >= (isReferralBoostGlobalRule.minReferrals || 3)) {
          referralBoostPercent = globalReferralBoost * directReferrals
        }
      }

      const skewPower = globalConfig ? globalBaseSkew : 3
      const randomFactor = Math.pow(Math.random(), skewPower)
      dailyPercent = (minPercent + (randomFactor * (maxPercent - minPercent))) * volatilityMultiplier * bonusMultiplier * vipMultiplier * weekendMultiplier
      dailyPercent += referralBoostPercent

      if (isMinFloorGlobalRule && dailyPercent > 0 && dailyPercent < globalMinFloor) {
        dailyPercent = globalMinFloor
      }
    }

    // Clamp daily cap
    const maxDayCap = plan.dailyEarningCapPercent > 0
      ? plan.dailyEarningCapPercent
      : globalDailyCap
    if (dailyPercent > maxDayCap) {
      dailyPercent = maxDayCap
    }

    let profitAmount = (deposit.amount * dailyPercent) / 100

    // Stacking bonus
    if (deposit.stackIndex > 1 && plan.stackingEnabled && plan.stackingBonusPercent > 0) {
      const bonusPct = plan.stackingBonusPercent * (deposit.stackIndex - 1)
      const stackBonus = (profitAmount * bonusPct) / 100
      profitAmount += stackBonus
    }

    // Handle compound interest: autoCompound adds profit to principal
    if (plan.autoCompound && dailyPercent > 0) {
      const compoundRate = globalConfig ? globalCompoundRate : 1.02
      profitAmount *= compoundRate
    }

    // Distribution splits
    let investorShare = profitAmount
    let sharePoolAmount = 0
    let rewardsShare = 0
    let platformFeeShare = 0
    let charityShare = 0
    let insuranceShare = 0
    let developerShare = 0
    let liquidityShare = 0

    const accountHolderPct = plan.accountHolderPercent
    const tradeProfitSharePct = plan.tradeProfitSharePercent
    const rewardsOffersPct = plan.rewardsOffersPercent
    const platformFeePct = plan.platformFeePercent
    const charityPct = plan.charityDonationPercent
    const insurancePct = plan.insuranceReservePercent
    const developerPct = plan.developerFundPercent
    const liquidityPct = plan.liquidityPoolPercent

    const totalSplits = accountHolderPct + tradeProfitSharePct + rewardsOffersPct + platformFeePct + charityPct + insurancePct + developerPct + liquidityPct

    if (totalSplits > 0) {
      if (dailyPercent < 0) {
        // Loss day - deduction from principal
        const actualLossAmount = Math.max(profitAmount, -deposit.amount)
        investorShare = actualLossAmount
        const newBalance = Math.max(0, user.tradingBalance + actualLossAmount)

        await db.user.update({
          where: { id: user.id },
          data: { tradingBalance: newBalance },
        })

        await db.earning.create({
          data: {
            userId: user.id, depositId: deposit.id, amount: actualLossAmount,
            type: 'loss', walletTarget: 'trading',
          },
        })

        await db.transactionLog.create({
          data: {
            userId: user.id, type: 'loss', amount: actualLossAmount,
            balanceBefore: user.tradingBalance, balanceAfter: newBalance,
            wallet: 'trading',
            description: `${plan.name} plan trading loss`,
            referenceId: deposit.id,
          },
        })

        user.tradingBalance = newBalance

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

        await db.planPnLLog.create({
          data: {
            planId: plan.id,
            yield: dailyPercent,
            isLoss: true,
            distributed: actualLossAmount,
          }
        })

        processed++
        continue
      } else {
        // Profit split distribution
        const maxLimit = plan.maxEarningLimit
        if (maxLimit > 0 && deposit.earnedSoFar + profitAmount >= maxLimit) {
          profitAmount = Math.max(0, maxLimit - deposit.earnedSoFar)
        }

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
      const newBalance = user.tradingBalance + investorShare
      await db.user.update({
        where: { id: user.id },
        data: {
          tradingBalance: newBalance,
          totalEarnings: user.totalEarnings + investorShare,
        },
      })

      await db.earning.create({
        data: {
          userId: user.id, depositId: deposit.id, amount: investorShare,
          type: 'daily', walletTarget: 'trading',
        },
      })

      await db.transactionLog.create({
        data: {
          userId: user.id, type: 'profit', amount: investorShare,
          balanceBefore: user.tradingBalance, balanceAfter: newBalance,
          wallet: 'trading',
          description: `${plan.name} plan profit (${plan.returnType} return)`,
          referenceId: deposit.id,
        },
      })

      user.tradingBalance = newBalance
      user.totalEarnings += investorShare
    }

    // Update deposit nextProfitAt and earnedSoFar
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
        where: { planId: plan.id, type: 'profit', enabled: true },
        orderBy: { level: 'asc' },
      })

      const maxLevels = plan.registrationReferralLevels || 7
      const defaultRates = [25, 20, 15, 10, 10, 10, 10]
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
          const rate = defaultRates[level] !== undefined ? defaultRates[level] : 0
          shareAmount = (sharePoolAmount * rate) / 100
        }

        if (shareAmount > 0) {
          const targetWallet = rule?.targetWallet === 'withdrawal' ? 'withdrawal' : 'trading'
          if (targetWallet === 'withdrawal') {
            await db.user.update({
              where: { id: referrer.id },
              data: {
                withdrawalBalance: referrer.withdrawalBalance + shareAmount,
                totalEarnings: referrer.totalEarnings + shareAmount,
              },
            })
          } else {
            await db.user.update({
              where: { id: referrer.id },
              data: {
                tradingBalance: referrer.tradingBalance + shareAmount,
                totalEarnings: referrer.totalEarnings + shareAmount,
              },
            })
          }

          await db.earning.create({
            data: {
              userId: referrer.id, depositId: deposit.id, amount: shareAmount,
              type: 'profit_share', level: level + 1, walletTarget: targetWallet,
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
      details: JSON.stringify({ processed, credited: credited.toFixed(2), completed, capitalReturned, timestamp: nowStr }),
    },
  })

  return {
    success: true,
    processed,
    totalCredited: credited.toFixed(2),
    completed,
    capitalReturned,
    timestamp: nowStr,
  }
}
