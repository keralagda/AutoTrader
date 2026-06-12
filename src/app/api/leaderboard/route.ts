import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all_time'
    const teamOnly = searchParams.get('teamOnly') === 'true'
    const userId = searchParams.get('userId')

    const whereClause: any = {
      role: 'user',
      isActive: true,
      totalDeposited: { gt: 0 },
      NOT: [
        { email: { contains: '@removed.local' } },
        { name: { startsWith: 'Deleted User' } }
      ]
    }

    if (teamOnly && userId) {
      let currentLevelIds = [userId]
      const teamIds = [userId]
      for (let level = 1; level <= 7; level++) {
        const members = await db.user.findMany({
          where: { referredById: { in: currentLevelIds } },
          select: { id: true },
        })
        if (members.length === 0) break
        const ids = members.map(m => m.id)
        teamIds.push(...ids)
        currentLevelIds = ids
      }
      whereClause.id = { in: teamIds }
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        totalEarnings: true,
      },
      orderBy: { totalEarnings: 'desc' },
      take: 50,
    })

    const leaderboard = users.map((user, index) => ({
      id: user.id,
      userId: user.id,
      userName: user.name,
      totalEarnings: user.totalEarnings,
      rank: index + 1,
      period,
    }))

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to get leaderboard' }, { status: 500 })
  }
}
