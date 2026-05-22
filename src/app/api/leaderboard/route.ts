import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all_time'

    const users = await db.user.findMany({
      where: { role: 'user', isActive: true },
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
