import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkMlmRankUpgrade } from '@/lib/binary-tree'

export async function GET() {
  try {
    // 1. Fetch plans
    const plans = await db.plan.findMany({
      select: {
        id: true,
        name: true,
        isBinaryMlmEnabled: true,
        mlmRewardsConfig: true
      }
    })

    // 2. Fetch users and raw data to compute aggregate metrics in JS (highly performant)
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        personalVolume: true,
        businessVolume: true,
        teamVolume: true,
        mlmRank: true,
        mlmLevel: true,
        binaryTreeLeftVolume: true,
        binaryTreeRightVolume: true,
        isActive: true,
        createdAt: true
      }
    })

    const deposits = await db.deposit.findMany({
      where: { status: { in: ['active', 'locked'] } },
      select: { userId: true, amount: true, planId: true }
    })

    const referrals = await db.user.findMany({
      select: { id: true, referredById: true, isActive: true, mlmLevel: true }
    })

    // Map metrics
    const usersMapped = users.map(user => {
      const userDeposits = deposits.filter(d => d.userId === user.id)
      const activeInvestment = userDeposits.reduce((sum, d) => sum + d.amount, 0)
      const activePlanIds = userDeposits.map(d => d.planId)
      
      const userReferrals = referrals.filter(r => r.referredById === user.id)
      const directsCount = userReferrals.length
      const activeDirectsCount = userReferrals.filter(r => r.isActive).length

      return {
        ...user,
        activeInvestment,
        activePlanIds,
        directsCount,
        activeDirectsCount,
        directReferrals: userReferrals
      }
    })

    // 3. Fetch dispatch ledger
    const ledgerSetting = await db.setting.findUnique({
      where: { key: 'mlm_rewards_dispatch_ledger' }
    })
    const dispatchLedger = ledgerSetting ? JSON.parse(ledgerSetting.value) : {}

    return NextResponse.json({
      plans,
      users: usersMapped,
      dispatchLedger
    })
  } catch (error: any) {
    console.error('MLM Rewards GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch MLM rewards data' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { action, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (action === 'overrideRank') {
      const { newRankName, newRankLevel } = body
      if (newRankName === undefined || newRankLevel === undefined) {
        return NextResponse.json({ error: 'Rank name and level are required for override' }, { status: 400 })
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { mlmRank: true, mlmLevel: true }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      await db.user.update({
        where: { id: userId },
        data: {
          mlmRank: newRankName,
          mlmLevel: newRankLevel
        }
      })

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'admin_rank_override',
          details: JSON.stringify({
            userId,
            oldRank: user.mlmRank,
            oldLevel: user.mlmLevel,
            newRank: newRankName,
            newLevel: newRankLevel
          })
        }
      })

      return NextResponse.json({ message: `User rank successfully overridden to ${newRankName}` })
    }

    if (action === 'reevaluate') {
      await checkMlmRankUpgrade(userId)
      const updatedUser = await db.user.findUnique({
        where: { id: userId },
        select: { mlmRank: true, mlmLevel: true }
      })
      return NextResponse.json({
        message: `Rank check complete. User is currently ${updatedUser?.mlmRank || 'Member'}`,
        rank: updatedUser?.mlmRank,
        level: updatedUser?.mlmLevel
      })
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 })
  } catch (error: any) {
    console.error('MLM Rewards PUT error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ledger } = body

    if (!ledger) {
      return NextResponse.json({ error: 'Ledger data is required' }, { status: 400 })
    }

    await db.setting.upsert({
      where: { key: 'mlm_rewards_dispatch_ledger' },
      update: { value: JSON.stringify(ledger) },
      create: { key: 'mlm_rewards_dispatch_ledger', value: JSON.stringify(ledger) }
    })

    return NextResponse.json({ message: 'Dispatch ledger updated successfully' })
  } catch (error: any) {
    console.error('MLM Rewards POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update dispatch ledger' }, { status: 500 })
  }
}
