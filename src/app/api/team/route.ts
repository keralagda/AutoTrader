import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get direct referrals (level 1)
    const directReferrals = await db.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        email: true,
        totalDeposited: true,
        totalEarnings: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Build team tree up to 7 levels
    const teamByLevel: { level: number; members: any[]; count: number }[] = []
    let currentLevelIds = [userId]

    for (let level = 1; level <= 7; level++) {
      const members = await db.user.findMany({
        where: { referredById: { in: currentLevelIds } },
        select: {
          id: true,
          name: true,
          email: true,
          totalDeposited: true,
          totalEarnings: true,
          isActive: true,
          createdAt: true,
        },
      })

      teamByLevel.push({
        level,
        members,
        count: members.length,
      })

      currentLevelIds = members.map(m => m.id)
      if (currentLevelIds.length === 0) break
    }

    const totalTeam = teamByLevel.reduce((sum, l) => sum + l.count, 0)
    const totalDirect = directReferrals.length

    return NextResponse.json({
      directReferrals,
      teamByLevel,
      totalTeam,
      totalDirect,
    })
  } catch (error) {
    console.error('Get team error:', error)
    return NextResponse.json({ error: 'Failed to get team data' }, { status: 500 })
  }
}
