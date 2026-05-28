import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { loadNPConfig } from '@/app/api/admin/nova-points/route'

// GET /api/challenges?userId=xxx - Get all active challenges with user progress
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const challenges = await db.challenge.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })

    let userChallenges: any[] = []
    if (userId) {
      userChallenges = await db.userChallenge.findMany({
        where: { userId },
        include: { challenge: true },
      })
    }

    // Merge challenge data with user progress
    const enrichedChallenges = challenges.map((challenge) => {
      const uc = userChallenges.find((u) => u.challengeId === challenge.id)
      return {
        ...challenge,
        userProgress: uc?.progress || 0,
        userCompleted: uc?.completed || false,
        userClaimed: uc?.claimed || false,
        userStreakCount: uc?.streakCount || 0,
        userStartedAt: uc?.startedAt || null,
        userCompletedAt: uc?.completedAt || null,
        userChallengeId: uc?.id || null,
      }
    })

    return NextResponse.json(enrichedChallenges)
  } catch (error) {
    console.error('Get challenges error:', error)
    return NextResponse.json({ error: 'Failed to get challenges' }, { status: 500 })
  }
}

// POST /api/challenges - Join a challenge or update progress
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, challengeId, action, progress } = body

    if (!userId || !challengeId) {
      return NextResponse.json({ error: 'userId and challengeId are required' }, { status: 400 })
    }

    const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge || !challenge.isActive) {
      return NextResponse.json({ error: 'Challenge not found or inactive' }, { status: 404 })
    }

    if (action === 'join') {
      // Join a challenge
      const existing = await db.userChallenge.findFirst({
        where: { userId, challengeId },
      })

      if (existing) {
        return NextResponse.json({ error: 'Already joined this challenge' }, { status: 409 })
      }

      const userChallenge = await db.userChallenge.create({
        data: {
          userId,
          challengeId,
          progress: 0,
          completed: false,
          claimed: false,
          startedAt: new Date(),
        },
      })

      return NextResponse.json(userChallenge, { status: 201 })
    }

    if (action === 'update_progress') {
      // Update progress on a challenge
      let uc = await db.userChallenge.findFirst({ where: { userId, challengeId } })
      if (!uc) {
        // Auto-join
        uc = await db.userChallenge.create({
          data: { userId, challengeId, progress: 0, completed: false, claimed: false, startedAt: new Date() },
        })
      }

      if (uc.completed) {
        return NextResponse.json({ error: 'Challenge already completed' }, { status: 400 })
      }

      const newProgress = (uc.progress || 0) + (progress || 0)
      const completed = newProgress >= challenge.targetValue

      const updated = await db.userChallenge.update({
        where: { id: uc.id },
        data: {
          progress: Math.min(newProgress, challenge.targetValue),
          completed,
          completedAt: completed ? new Date() : undefined,
          lastProgressAt: new Date(),
        },
      })

      // If completed, award NP (multiplier from admin config)
      if (completed && challenge.xpReward > 0) {
        const npConfig = await loadNPConfig()
        const multiplier = npConfig.challengeMultiplier || 0.25
        await awardXP(userId, Math.max(1, Math.floor(challenge.xpReward * multiplier)))
      }

      return NextResponse.json(updated)
    }

    if (action === 'claim') {
      // Claim reward for completed challenge
      const uc = await db.userChallenge.findFirst({ where: { userId, challengeId } })
      if (!uc) {
        return NextResponse.json({ error: 'Not joined this challenge' }, { status: 404 })
      }
      if (!uc.completed) {
        return NextResponse.json({ error: 'Challenge not completed yet' }, { status: 400 })
      }
      if (uc.claimed) {
        return NextResponse.json({ error: 'Reward already claimed' }, { status: 409 })
      }

      // Award USDC reward to trading balance
      const rewardAmount = challenge.reward * challenge.bonusMultiplier
      if (rewardAmount > 0) {
        await db.user.update({
          where: { id: userId },
          data: { tradingBalance: { increment: rewardAmount } },
        })
        // Record as earning
        await db.earning.create({
          data: {
            userId,
            amount: rewardAmount,
            type: 'bonus',
            walletTarget: 'trading',
          },
        })
      }

      // Mark as claimed
      const updated = await db.userChallenge.update({
        where: { id: uc.id },
        data: { claimed: true },
      })

      // Update user stats
      const stats = await db.userStats.upsert({
        where: { userId },
        create: { userId },
        update: {},
      })
      await db.userStats.update({
        where: { id: stats.id },
        data: {
          challengesClaimed: { increment: 1 },
          totalUsdcRewards: { increment: rewardAmount },
        },
      })

      return NextResponse.json({ ...updated, rewardAmount })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Challenge action error:', error)
    return NextResponse.json({ error: 'Failed to process challenge action' }, { status: 500 })
  }
}

// Helper: Award XP and handle level-ups
async function awardXP(userId: string, xpAmount: number) {
  const stats = await db.userStats.upsert({
    where: { userId },
    create: { userId, xp: xpAmount, totalXpEarned: xpAmount },
    update: {
      xp: { increment: xpAmount },
      totalXpEarned: { increment: xpAmount },
    },
  })

  // Recalculate level (1 level per 1000 XP)
  const newLevel = Math.floor(stats.xp / 1000) + 1
  if (newLevel !== stats.level) {
    await db.userStats.update({
      where: { id: stats.id },
      data: { level: newLevel },
    })

    // Check for XP-based badge unlocks
    const xpBadges = await db.badge.findMany({
      where: { xpRequired: { lte: stats.xp }, isActive: true },
    })

    for (const badge of xpBadges) {
      const existingBadge = await db.userBadge.findFirst({
        where: { userId, badgeId: badge.id },
      })
      if (!existingBadge) {
        await db.userBadge.create({
          data: { userId, badgeId: badge.id },
        })
      }
    }
  }
}
