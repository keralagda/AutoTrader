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
    const { userId, planId, amount } = await request.json()

    if (!userId || !planId || !amount) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
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

    // Create deposit
    const deposit = await db.deposit.create({
      data: {
        userId,
        planId,
        amount,
        status: 'active',
        earnedSoFar: 0,
      },
    })

    // Update user total deposited
    await db.user.update({
      where: { id: userId },
      data: { totalDeposited: user.totalDeposited + amount },
    })

    // Process referral earnings up to 7 levels
    const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
    let currentReferrerId = user.referredById
    let level = 0

    while (currentReferrerId && level < 7) {
      const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
      if (!referrer) break

      const referralEarning = (plan.entryFee * REFERRAL_PERCENTS[level]) / 100

      await db.earning.create({
        data: {
          userId: referrer.id,
          depositId: deposit.id,
          amount: referralEarning,
          type: 'referral',
          level: level + 1,
        },
      })

      await db.user.update({
        where: { id: referrer.id },
        data: {
          totalEarnings: referrer.totalEarnings + referralEarning,
          balance: referrer.balance + referralEarning,
        },
      })

      currentReferrerId = referrer.referredById
      level++
    }

    return NextResponse.json(deposit, { status: 201 })
  } catch (error) {
    console.error('Create deposit error:', error)
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}
