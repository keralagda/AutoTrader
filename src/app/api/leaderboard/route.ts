import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getDeterministicFakeWithdrawal(userId: string, totalEarnings: number): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  // Generate a stable ratio between 0.15 and 0.55 of earnings
  const ratio = 0.15 + (Math.abs(hash) % 40) / 100
  return Math.round((totalEarnings * ratio) * 100) / 100
}

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
        totalDeposited: true,
        isFake: true,
      },
      orderBy: { totalEarnings: 'desc' },
      take: 50,
    })

    // Aggregate real withdrawals
    const realUserIds = users.filter(u => !u.isFake).map(u => u.id)
    const withdrawalSums = await db.withdrawal.groupBy({
      by: ['userId'],
      where: {
        userId: { in: realUserIds },
        status: { in: ['completed', 'approved'] }
      },
      _sum: {
        amount: true
      }
    })

    const withdrawalMap = new Map<string, number>()
    withdrawalSums.forEach(w => {
      withdrawalMap.set(w.userId, w._sum.amount || 0)
    })

    const leaderboard = users.map((user, index) => {
      let totalWithdrawals = 0
      if (user.isFake) {
        totalWithdrawals = getDeterministicFakeWithdrawal(user.id, user.totalEarnings)
      } else {
        totalWithdrawals = withdrawalMap.get(user.id) || 0
      }

      return {
        id: user.id,
        userId: user.id,
        userName: user.name,
        totalEarnings: user.totalEarnings,
        totalDeposited: user.totalDeposited,
        totalWithdrawals,
        isFake: user.isFake,
        rank: index + 1,
        period,
      }
    })

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to get leaderboard' }, { status: 500 })
  }
}

