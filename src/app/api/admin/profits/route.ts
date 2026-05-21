import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
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

    const results = []

    for (const deposit of deposits) {
      const absAmount = Math.abs(amount)

      if (op === 'subtract') {
        // SUBTRACT operation: reduce user's balance and earnings
        const earning = await db.earning.create({
          data: {
            userId,
            depositId: deposit.id,
            amount: -absAmount,
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
        const newEarnedSoFar = Math.max(0, deposit.earnedSoFar - absAmount)
        await db.deposit.update({
          where: { id: deposit.id },
          data: { earnedSoFar: newEarnedSoFar },
        })

        // Reduce user trading balance and total earnings
        const newTradingBalance = Math.max(0, user.tradingBalance - absAmount)
        const newTotalEarnings = Math.max(0, user.totalEarnings - absAmount)
        await db.user.update({
          where: { id: userId },
          data: {
            tradingBalance: newTradingBalance,
            totalEarnings: newTotalEarnings,
          },
        })

        // Reverse profit share to upline
        const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
        const profitShareAmount = (absAmount * 30) / 100
        let currentReferrerId = user.referredById
        let level = 0

        while (currentReferrerId && level < 7) {
          const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
          if (!referrer) break

          const shareAmount = (profitShareAmount * REFERRAL_PERCENTS[level]) / 100

          await db.earning.create({
            data: {
              userId: referrer.id,
              depositId: deposit.id,
              amount: -shareAmount,
              type: 'subtract',
              level: level + 1,
              walletTarget: 'trading',
            },
          })

          await db.user.update({
            where: { id: referrer.id },
            data: {
              totalEarnings: Math.max(0, referrer.totalEarnings - shareAmount),
              tradingBalance: Math.max(0, referrer.tradingBalance - shareAmount),
            },
          })

          currentReferrerId = referrer.referredById
          level++
        }

        results.push({ earning, profitDist })
      } else {
        // ADD operation (existing logic)
        // Calculate stacking bonus
        const stackingBonus = deposit.plan.stackingEnabled && deposit.stackIndex > 1
          ? deposit.plan.stackingBonusPercent * (deposit.stackIndex - 1)
          : 0
        const effectiveDailyPercent = deposit.plan.dailyEarningPercent + stackingBonus

        const earning = await db.earning.create({
          data: {
            userId,
            depositId: deposit.id,
            amount: absAmount,
            type: stackingBonus > 0 ? 'daily' : 'daily',
            walletTarget: 'trading',
          },
        })

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

        // Update deposit earned so far
        await db.deposit.update({
          where: { id: deposit.id },
          data: { earnedSoFar: deposit.earnedSoFar + absAmount },
        })

        // Update user trading balance and total earnings
        await db.user.update({
          where: { id: userId },
          data: {
            tradingBalance: user.tradingBalance + absAmount,
            totalEarnings: user.totalEarnings + absAmount,
          },
        })

        // Distribute profit share to upline (30% of profit goes to trade profit share)
        const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
        const profitShareAmount = (absAmount * 30) / 100
        let currentReferrerId = user.referredById
        let level = 0

        while (currentReferrerId && level < 7) {
          const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
          if (!referrer) break

          const shareAmount = (profitShareAmount * REFERRAL_PERCENTS[level]) / 100

          await db.earning.create({
            data: {
              userId: referrer.id,
              depositId: deposit.id,
              amount: shareAmount,
              type: 'profit_share',
              level: level + 1,
              walletTarget: 'trading',
            },
          })

          await db.user.update({
            where: { id: referrer.id },
            data: {
              totalEarnings: referrer.totalEarnings + shareAmount,
              tradingBalance: referrer.tradingBalance + shareAmount,
            },
          })

          currentReferrerId = referrer.referredById
          level++
        }

        results.push({ earning, profitDist })

        // Check if deposit reached max earning limit
        if (deposit.earnedSoFar + absAmount >= deposit.plan.maxEarningLimit) {
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
