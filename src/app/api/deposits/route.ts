import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
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
    const { userId, planId, amount, paymentMethod } = await request.json()

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
      return NextResponse.json({
        error: `Deposit must be between $${plan.minDeposit} and $${plan.maxDeposit}`
      }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check stacking limits
    if (plan.stackingEnabled) {
      const existingDeposits = await db.deposit.count({
        where: { userId, planId, status: 'active' },
      })
      if (existingDeposits >= plan.maxStacks) {
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

    // Create deposit
    const deposit = await db.deposit.create({
      data: {
        userId,
        planId,
        amount,
        status: plan.lockPeriodDays > 0 ? 'locked' : 'active',
        earnedSoFar: 0,
        stackIndex,
        lockedUntil,
      },
    })

    // Update user total deposited
    await db.user.update({
      where: { id: userId },
      data: { totalDeposited: user.totalDeposited + amount },
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

    // Process referral earnings from entry fee (subscription fee distribution)
    // 80% goes to referral/profit share cascade, 15% rewards & offers, 5% platform
    const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
    const entryFee = plan.entryFee
    const referralPoolAmount = (entryFee * plan.subscriptionReferralPercent) / 100

    let currentReferrerId = user.referredById
    let level = 0

    while (currentReferrerId && level < 7) {
      const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
      if (!referrer) break

      const referralEarning = (referralPoolAmount * REFERRAL_PERCENTS[level]) / 100

      await db.earning.create({
        data: {
          userId: referrer.id,
          depositId: deposit.id,
          amount: referralEarning,
          type: 'referral',
          level: level + 1,
          walletTarget: 'trading',
        },
      })

      await db.user.update({
        where: { id: referrer.id },
        data: {
          totalEarnings: referrer.totalEarnings + referralEarning,
          tradingBalance: referrer.tradingBalance + referralEarning,
        },
      })

      currentReferrerId = referrer.referredById
      level++
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
