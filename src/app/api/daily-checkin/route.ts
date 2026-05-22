import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get check-in status
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const userStats = await prisma.userStats.findUnique({ where: { userId } })
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayCheckIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        checkDate: { gte: today },
      },
    })

    // Get recent check-ins (last 7 days)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const recentCheckIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        checkDate: { gte: weekAgo },
      },
      orderBy: { checkDate: 'desc' },
    })

    return NextResponse.json({
      checkedInToday: !!todayCheckIn,
      currentStreak: userStats?.currentStreak || 0,
      longestStreak: userStats?.longestStreak || 0,
      totalCheckIns: userStats?.totalCheckIns || 0,
      xp: userStats?.xp || 0,
      level: userStats?.level || 1,
      recentCheckIns: recentCheckIns.map(c => ({
        date: c.checkDate,
        xpEarned: c.xpEarned,
        bonusEarned: c.bonusEarned,
        streakDay: c.streakDay,
      })),
    })
  } catch (error) {
    console.error('Daily check-in GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Perform daily check-in
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already checked in today
    const existing = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        checkDate: { gte: today },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
    }

    // Get or create user stats
    let userStats = await prisma.userStats.findUnique({ where: { userId } })
    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: { userId },
      })
    }

    // Calculate streak
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayCheckIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        checkDate: {
          gte: yesterday,
          lt: today,
        },
      },
    })

    const newStreak = yesterdayCheckIn ? userStats.currentStreak + 1 : 1
    const streakDay = newStreak

    // Calculate rewards based on streak
    let xpEarned = 10 // Base XP
    let bonusEarned = 0

    // Streak bonuses
    if (newStreak >= 7) {
      xpEarned = 50
      bonusEarned = 0.50 // $0.50 bonus for 7-day streak
    } else if (newStreak >= 5) {
      xpEarned = 30
      bonusEarned = 0.25
    } else if (newStreak >= 3) {
      xpEarned = 20
      bonusEarned = 0.10
    }

    // Milestone bonuses
    const totalCheckIns = userStats.totalCheckIns + 1
    if (totalCheckIns === 30) {
      xpEarned += 100
      bonusEarned += 2.00
    } else if (totalCheckIns === 7) {
      xpEarned += 50
      bonusEarned += 1.00
    }

    // Create check-in record
    await prisma.dailyCheckIn.create({
      data: {
        userId,
        checkDate: today,
        xpEarned,
        bonusEarned,
        streakDay,
      },
    })

    // Update user stats
    const newLongestStreak = Math.max(userStats.longestStreak, newStreak)
    const newXp = userStats.xp + xpEarned
    const newLevel = Math.floor(newXp / 100) + 1

    await prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCheckIn: new Date(),
        totalCheckIns: { increment: 1 },
        xp: { increment: xpEarned },
        level: newLevel,
        totalXpEarned: { increment: xpEarned },
        totalUsdcRewards: { increment: bonusEarned },
      },
    })

    // Credit bonus to trading wallet if any
    if (bonusEarned > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { tradingBalance: { increment: bonusEarned } },
      })

      await prisma.transactionLog.create({
        data: {
          userId,
          type: 'bonus',
          amount: bonusEarned,
          wallet: 'trading',
          description: `Daily check-in streak bonus (Day ${streakDay})`,
          status: 'completed',
        },
      })
    }

    return NextResponse.json({
      success: true,
      xpEarned,
      bonusEarned,
      currentStreak: newStreak,
      totalCheckIns,
      level: newLevel,
      totalXp: newXp,
    })
  } catch (error) {
    console.error('Daily check-in POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
