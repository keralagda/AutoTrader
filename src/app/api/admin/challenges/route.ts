import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/challenges - Get all challenges (including inactive)
export async function GET() {
  try {
    const challenges = await db.challenge.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: {
        _count: {
          select: { userChallenges: true },
        },
      },
    })

    const badges = await db.badge.findMany({
      orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { userBadges: true },
        },
      },
    })

    // Overall stats
    const totalChallenges = challenges.length
    const activeChallenges = challenges.filter((c) => c.isActive).length
    const totalParticipations = challenges.reduce((sum, c) => sum + c._count.userChallenges, 0)

    return NextResponse.json({
      challenges: challenges.map((c) => ({
        ...c,
        participantCount: c._count.userChallenges,
      })),
      badges: badges.map((b) => ({
        ...b,
        earnedByCount: b._count.userBadges,
      })),
      stats: {
        totalChallenges,
        activeChallenges,
        totalParticipations,
        totalBadges: badges.length,
      },
    })
  } catch (error) {
    console.error('Get admin challenges error:', error)
    return NextResponse.json({ error: 'Failed to get challenges' }, { status: 500 })
  }
}

// POST /api/admin/challenges - Create a new challenge or badge
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'challenge') {
      const challenge = await db.challenge.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category || 'milestone',
          challengeType: data.challengeType || 'target',
          targetValue: data.targetValue || 1,
          reward: data.reward || 0,
          xpReward: data.xpReward || 0,
          badgeIcon: data.badgeIcon || '🎯',
          difficulty: data.difficulty || 'easy',
          colorTheme: data.colorTheme || 'emerald',
          streakBased: data.streakBased || false,
          requireStreakDays: data.requireStreakDays || 0,
          bonusMultiplier: data.bonusMultiplier || 1,
          isRecurring: data.isRecurring || false,
          recurrencePeriod: data.recurrencePeriod || 'none',
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          sortOrder: data.sortOrder || 0,
        },
      })
      return NextResponse.json(challenge, { status: 201 })
    }

    if (type === 'badge') {
      const badge = await db.badge.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon || '🏅',
          category: data.category || 'achievement',
          rarity: data.rarity || 'common',
          xpRequired: data.xpRequired || 0,
          condition: data.condition || '',
          colorTheme: data.colorTheme || 'emerald',
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })
      return NextResponse.json(badge, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type. Use "challenge" or "badge"' }, { status: 400 })
  } catch (error) {
    console.error('Create challenge/badge error:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

// PUT /api/admin/challenges - Update a challenge or badge
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { type, id, ...data } = body

    if (type === 'challenge') {
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

      const challenge = await db.challenge.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          challengeType: data.challengeType,
          targetValue: data.targetValue,
          reward: data.reward,
          xpReward: data.xpReward,
          badgeIcon: data.badgeIcon,
          difficulty: data.difficulty,
          colorTheme: data.colorTheme,
          streakBased: data.streakBased,
          requireStreakDays: data.requireStreakDays,
          bonusMultiplier: data.bonusMultiplier,
          isRecurring: data.isRecurring,
          recurrencePeriod: data.recurrencePeriod,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        },
      })
      return NextResponse.json(challenge)
    }

    if (type === 'badge') {
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

      const badge = await db.badge.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          category: data.category,
          rarity: data.rarity,
          xpRequired: data.xpRequired,
          condition: data.condition,
          colorTheme: data.colorTheme,
          isActive: data.isActive,
        },
      })
      return NextResponse.json(badge)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Update challenge/badge error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE /api/admin/challenges - Delete a challenge or badge
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 })
    }

    if (type === 'challenge') {
      // Delete user challenges first
      await db.userChallenge.deleteMany({ where: { challengeId: id } })
      await db.challenge.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'badge') {
      await db.userBadge.deleteMany({ where: { badgeId: id } })
      await db.badge.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Delete challenge/badge error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
