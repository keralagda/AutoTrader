import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId, riskMode, amount, dayOfWeek } = await request.json()

    if (!userId || !riskMode || !amount || !dayOfWeek) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Get user's active deposits
    const deposits = await db.deposit.findMany({
      where: { userId, status: 'active' },
      include: { plan: true },
    })

    if (deposits.length === 0) {
      return NextResponse.json({ error: 'No active deposits found for this user' }, { status: 404 })
    }

    const results = []

    for (const deposit of deposits) {
      // Create earning
      const earning = await db.earning.create({
        data: {
          userId,
          depositId: deposit.id,
          amount,
          type: 'daily',
        },
      })

      // Create profit distribution record
      const profitDist = await db.profitDistribution.create({
        data: {
          depositId: deposit.id,
          amount,
          riskMode,
          dayOfWeek,
        },
      })

      // Update deposit earned so far
      await db.deposit.update({
        where: { id: deposit.id },
        data: { earnedSoFar: deposit.earnedSoFar + amount },
      })

      // Update user balance and total earnings
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user) {
        await db.user.update({
          where: { id: userId },
          data: {
            balance: user.balance + amount,
            totalEarnings: user.totalEarnings + amount,
          },
        })
      }

      // Distribute profit share to upline (30% of profit goes to trade profit share)
      const REFERRAL_PERCENTS = [25, 20, 15, 10, 10, 10, 10]
      const profitShareAmount = (amount * 30) / 100
      let currentReferrerId = user?.referredById
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
          },
        })

        await db.user.update({
          where: { id: referrer.id },
          data: {
            totalEarnings: referrer.totalEarnings + shareAmount,
            balance: referrer.balance + shareAmount,
          },
        })

        currentReferrerId = referrer.referredById
        level++
      }

      results.push({ earning, profitDist })

      // Check if deposit reached max earning limit
      if (deposit.earnedSoFar + amount >= deposit.plan.maxEarningLimit) {
        await db.deposit.update({
          where: { id: deposit.id },
          data: { status: 'completed' },
        })
      }
    }

    return NextResponse.json({ message: 'Profit added successfully', results }, { status: 201 })
  } catch (error) {
    console.error('Add profit error:', error)
    return NextResponse.json({ error: 'Failed to add profit' }, { status: 500 })
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
