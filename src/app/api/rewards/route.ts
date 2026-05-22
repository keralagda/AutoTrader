import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get user rewards summary
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get user stats
    const userStats = await prisma.userStats.findUnique({ where: { userId } })

    // Get user badges
    const badges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    })

    // Get completed challenges
    const completedChallenges = await prisma.userChallenge.findMany({
      where: { userId, completed: true },
      include: { challenge: true },
      orderBy: { completedAt: 'desc' },
      take: 10,
    })

    // Get available (uncompleted) challenges
    const allChallenges = await prisma.challenge.findMany({
      where: { isActive: true },
    })

    const userChallengeIds = await prisma.userChallenge.findMany({
      where: { userId, completed: true },
      select: { challengeId: true },
    })
    const completedIds = new Set(userChallengeIds.map(uc => uc.challengeId))

    const availableChallenges = allChallenges
      .filter(c => !completedIds.has(c.id))
      .slice(0, 5)

    // Calculate rewards tier
    const totalXp = userStats?.xp || 0
    let tier = 'Bronze'
    let tierColor = 'text-amber-600'
    if (totalXp >= 5000) { tier = 'Diamond'; tierColor = 'text-cyan-300' }
    else if (totalXp >= 2000) { tier = 'Platinum'; tierColor = 'text-violet-300' }
    else if (totalXp >= 1000) { tier = 'Gold'; tierColor = 'text-amber-400' }
    else if (totalXp >= 500) { tier = 'Silver'; tierColor = 'text-slate-300' }

    // Cashback rate based on tier
    const cashbackRates: Record<string, number> = {
      Bronze: 0.5,
      Silver: 1.0,
      Gold: 1.5,
      Platinum: 2.0,
      Diamond: 3.0,
    }

    return NextResponse.json({
      stats: {
        xp: userStats?.xp || 0,
        level: userStats?.level || 1,
        currentStreak: userStats?.currentStreak || 0,
        longestStreak: userStats?.longestStreak || 0,
        challengesCompleted: userStats?.challengesCompleted || 0,
        totalUsdcRewards: userStats?.totalUsdcRewards || 0,
        totalCheckIns: userStats?.totalCheckIns || 0,
      },
      tier,
      tierColor,
      cashbackRate: cashbackRates[tier] || 0.5,
      badges: badges.map(b => ({
        id: b.badge.id,
        name: b.badge.name,
        description: b.badge.description,
        icon: b.badge.icon,
        rarity: b.badge.rarity,
        earnedAt: b.earnedAt,
      })),
      completedChallenges: completedChallenges.map(uc => ({
        id: uc.challenge.id,
        title: uc.challenge.title,
        reward: uc.challenge.reward,
        xpReward: uc.challenge.xpReward,
        completedAt: uc.completedAt,
      })),
      availableChallenges: availableChallenges.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        reward: c.reward,
        xpReward: c.xpReward,
        difficulty: c.difficulty,
        badgeIcon: c.badgeIcon,
      })),
    })
  } catch (error) {
    console.error('Rewards error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
