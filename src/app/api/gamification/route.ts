import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { loadNPConfig } from '@/lib/nova-points-config'
import { USER_HELP_GUIDES } from '@/lib/help-center-data'

// GET /api/gamification?userId=xxx - Get user gamification stats
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
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const config = await loadNPConfig()
    const XP_PER_LEVEL = config.xpPerLevel || 1000
    const XP_CHECKIN_BASE = config.gamification?.checkinBaseNP || 12
    const XP_CHECKIN_STREAK_BONUS = config.gamification?.checkinStreakBonus || 3
    const CHECKIN_USDC_BONUS_STREAK = config.gamification?.streakUsdcDay || 7
    const CHECKIN_USDC_BONUS_AMOUNT = config.gamification?.streakUsdcAmount || 1

    // Get or create user stats
    const stats = await db.userStats.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })

    // Get user badges with badge details
    const userBadges = await db.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    })

    // Get all available badges
    const allBadges = await db.badge.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
    })

    // Calculate XP progress
    const level = stats.level
    const currentLevelXp = (level - 1) * XP_PER_LEVEL
    const xpInLevel = stats.xp - currentLevelXp
    const xpNeeded = XP_PER_LEVEL
    const xpPercent = Math.min((xpInLevel / xpNeeded) * 100, 100)

    // Check if can check in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const todayCheckIn = await db.dailyCheckIn.findFirst({
      where: {
        userId,
        checkDate: new Date(todayStr),
      },
    })

    const canCheckIn = !todayCheckIn

    // Calculate streak info
    const streakMultiplier = Math.min(1 + (stats.currentStreak * 0.05), 2) // 5% per day, max 2x

    // Get challenge completion stats
    const completedChallenges = await db.userChallenge.count({
      where: { userId, completed: true },
    })
    const activeChallenges = await db.userChallenge.count({
      where: { userId, completed: false },
    })
    const unclaimedRewards = await db.userChallenge.count({
      where: { userId, completed: true, claimed: false },
    })

    // Badge stats
    const earnedBadgeIds = userBadges.map((ub) => ub.badgeId)
    const unlockedBadges = allBadges.filter((b) => earnedBadgeIds.includes(b.id))
    const lockedBadges = allBadges.filter((b) => !earnedBadgeIds.includes(b.id))

    // Badge rarity counts
    const badgeRarityCounts = {
      common: unlockedBadges.filter((b) => b.rarity === 'common').length,
      uncommon: unlockedBadges.filter((b) => b.rarity === 'uncommon').length,
      rare: unlockedBadges.filter((b) => b.rarity === 'rare').length,
      epic: unlockedBadges.filter((b) => b.rarity === 'epic').length,
      legendary: unlockedBadges.filter((b) => b.rarity === 'legendary').length,
    }

    // Next level info
    const nextLevelXp = level * XP_PER_LEVEL
    const xpToNextLevel = nextLevelXp - stats.xp

    // Get completed quizzes from Settings SSoT
    const prefix = `quiz_complete_${userId}_`
    const completedQuizSettings = await db.setting.findMany({
      where: {
        key: {
          startsWith: prefix,
        },
      },
    })
    const completedQuizzes = completedQuizSettings.map((s) => s.key.substring(prefix.length))

    return NextResponse.json({
      stats: {
        ...stats,
        xpInLevel,
        xpNeeded,
        xpPercent,
        nextLevelXp,
        xpToNextLevel,
        streakMultiplier,
      },
      checkIn: {
        canCheckIn,
        todayXp: XP_CHECKIN_BASE + stats.currentStreak * XP_CHECKIN_STREAK_BONUS,
        todayBonus: stats.currentStreak > 0 && (stats.currentStreak + 1) % CHECKIN_USDC_BONUS_STREAK === 0
          ? CHECKIN_USDC_BONUS_AMOUNT
          : 0,
        streakDay: stats.currentStreak + 1,
      },
      challenges: {
        completed: completedChallenges,
        active: activeChallenges,
        unclaimedRewards,
      },
      badges: {
        earned: unlockedBadges.map((b) => ({
          ...b,
          earnedAt: userBadges.find((ub) => ub.badgeId === b.id)?.earnedAt,
        })),
        locked: lockedBadges,
        totalBadges: allBadges.length,
        earnedCount: unlockedBadges.length,
        rarityCounts: badgeRarityCounts,
      },
      completedQuizzes,
    })
  } catch (error) {
    console.error('Get gamification error:', error)
    return NextResponse.json({ error: 'Failed to get gamification data' }, { status: 500 })
  }
}

// POST /api/gamification - Daily check-in & Quiz completions
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

    const { userId, action, quizId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const config = await loadNPConfig()
    const XP_PER_LEVEL = config.xpPerLevel || 1000
    const XP_CHECKIN_BASE = config.gamification?.checkinBaseNP || 12
    const XP_CHECKIN_STREAK_BONUS = config.gamification?.checkinStreakBonus || 3
    const CHECKIN_USDC_BONUS_STREAK = config.gamification?.streakUsdcDay || 7
    const CHECKIN_USDC_BONUS_AMOUNT = config.gamification?.streakUsdcAmount || 1

    if (action === 'checkin') {
      // Check if already checked in today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      const existingCheckIn = await db.dailyCheckIn.findFirst({
        where: {
          userId,
          checkDate: new Date(todayStr),
        },
      })

      if (existingCheckIn) {
        return NextResponse.json({ error: 'Already checked in today' }, { status: 409 })
      }

      // Get current stats
      const stats = await db.userStats.upsert({
        where: { userId },
        create: { userId },
        update: {},
      })

      // Calculate streak
      let newStreak = 1
      if (stats.lastCheckIn) {
        const lastCheckInDate = new Date(stats.lastCheckIn)
        lastCheckInDate.setHours(0, 0, 0, 0)
        const diffTime = today.getTime() - lastCheckInDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          // Consecutive day
          newStreak = stats.currentStreak + 1
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1
        }
      }

      // Calculate XP
      const xpEarned = XP_CHECKIN_BASE + (newStreak - 1) * XP_CHECKIN_STREAK_BONUS

      // Check if bonus USDC (every 7th day)
      let bonusEarned = 0
      if (newStreak % CHECKIN_USDC_BONUS_STREAK === 0) {
        bonusEarned = CHECKIN_USDC_BONUS_AMOUNT
      }

      // Create check-in record
      await db.dailyCheckIn.create({
        data: {
          userId,
          checkDate: new Date(todayStr),
          xpEarned,
          bonusEarned,
          streakDay: newStreak,
        },
      })

      // Update user stats
      const newLevel = Math.floor((stats.xp + xpEarned) / XP_PER_LEVEL) + 1
      await db.userStats.update({
        where: { id: stats.id },
        data: {
          xp: { increment: xpEarned },
          totalXpEarned: { increment: xpEarned },
          level: newLevel,
          currentStreak: newStreak,
          longestStreak: Math.max(stats.longestStreak, newStreak),
          lastCheckIn: new Date(),
          totalCheckIns: { increment: 1 },
        },
      })

      // Award USDC bonus if applicable
      if (bonusEarned > 0) {
        await db.user.update({
          where: { id: userId },
          data: { tradingBalance: { increment: bonusEarned } },
        })
        await db.earning.create({
          data: {
            userId,
            amount: bonusEarned,
            type: 'bonus',
            walletTarget: 'trading',
          },
        })
      }

      // Check for streak-based badge unlocks
      const streakBadges = await db.badge.findMany({
        where: { isActive: true, category: 'streak' },
      })

      for (const badge of streakBadges) {
        const hasBadge = await db.userBadge.findFirst({
          where: { userId, badgeId: badge.id },
        })
        if (!hasBadge) {
          // Check condition - "Check in for N consecutive days"
          const match = badge.condition.match(/(\d+)/)
          if (match && parseInt(match[1]) <= newStreak) {
            await db.userBadge.create({
              data: { userId, badgeId: badge.id },
            })
          }
        }
      }

      return NextResponse.json({
        success: true,
        xpEarned,
        bonusEarned,
        newStreak,
        newLevel,
        streakDay: newStreak,
      })
    } else if (action === 'quiz_complete') {
      if (!quizId) {
        return NextResponse.json({ error: 'quizId is required' }, { status: 400 })
      }

      const key = `quiz_complete_${userId}_${quizId}`
      const existing = await db.setting.findUnique({
        where: { key }
      })

      if (existing) {
        return NextResponse.json({ success: true, alreadyCompleted: true, message: 'Quiz already completed' })
      }

      // Save completion in Setting SSoT
      await db.setting.create({
        data: {
          key,
          value: 'true'
        }
      })

      // Get or create user stats
      const stats = await db.userStats.upsert({
        where: { userId },
        create: { userId },
        update: {},
      })

      const xpEarned = 50
      const newXp = stats.xp + xpEarned
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1

      // Increment user XP by 50 in UserStats
      await db.userStats.update({
        where: { id: stats.id },
        data: {
          xp: { increment: xpEarned },
          totalXpEarned: { increment: xpEarned },
          level: newLevel,
        }
      })

      // Get guide title
      const guide = USER_HELP_GUIDES.find((g) => g.id === quizId)
      const guideTitle = guide ? guide.title : 'Assessment'

      // Create notification
      await db.notification.create({
        data: {
          userId,
          title: 'Assessment Completed',
          message: `You completed the "${guideTitle}" assessment and earned 50 XP!`,
          type: 'success',
        }
      })

      return NextResponse.json({
        success: true,
        xpEarned,
        newLevel,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Gamification action error:', error)
    return NextResponse.json({ error: 'Failed to process gamification action' }, { status: 500 })
  }
}
