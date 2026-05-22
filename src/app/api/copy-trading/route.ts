import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get top traders to follow
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    // Get top earners as "traders"
    const topTraders = await prisma.user.findMany({
      where: {
        isFake: false,
        totalEarnings: { gt: 0 },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        totalEarnings: true,
        totalDeposited: true,
        createdAt: true,
        _count: {
          select: { referrals: true },
        },
      },
      orderBy: { totalEarnings: 'desc' },
      take: 20,
    })

    // Calculate performance metrics
    const traders = topTraders.map((trader, index) => {
      const roi = trader.totalDeposited > 0
        ? ((trader.totalEarnings / trader.totalDeposited) * 100).toFixed(1)
        : '0'
      const daysSinceJoin = Math.max(1, Math.floor((Date.now() - new Date(trader.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      const dailyAvg = (trader.totalEarnings / daysSinceJoin).toFixed(2)

      return {
        id: trader.id,
        name: trader.name,
        rank: index + 1,
        totalEarnings: trader.totalEarnings,
        roi: parseFloat(roi),
        dailyAverage: parseFloat(dailyAvg),
        followers: trader._count.referrals,
        isFollowing: false, // Would check against a follow table
      }
    })

    return NextResponse.json(traders)
  } catch (error) {
    console.error('Copy trading error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
