import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get direct referrals (Level 1)
    const level1 = await prisma.user.findMany({
      where: { referredById: userId, isFake: false },
      select: {
        id: true,
        name: true,
        email: true,
        totalDeposited: true,
        totalEarnings: true,
        isActive: true,
        createdAt: true,
        _count: { select: { referrals: true } },
      },
    })

    // Get Level 2 referrals
    const level1Ids = level1.map(u => u.id)
    const level2 = await prisma.user.findMany({
      where: { referredById: { in: level1Ids }, isFake: false },
      select: {
        id: true,
        name: true,
        email: true,
        totalDeposited: true,
        referredById: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Get Level 3 referrals
    const level2Ids = level2.map(u => u.id)
    const level3 = await prisma.user.findMany({
      where: { referredById: { in: level2Ids }, isFake: false },
      select: {
        id: true,
        name: true,
        totalDeposited: true,
        referredById: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Calculate team stats
    const totalTeam = level1.length + level2.length + level3.length
    const totalTeamDeposits = [...level1, ...level2, ...level3].reduce((sum, u) => sum + u.totalDeposited, 0)
    const activeTeam = [...level1, ...level2, ...level3].filter(u => u.isActive).length

    // Get referral earnings
    const referralEarnings = await prisma.earning.aggregate({
      where: { userId, type: 'referral' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      stats: {
        totalTeam,
        activeTeam,
        totalTeamDeposits,
        totalReferralEarnings: referralEarnings._sum.amount || 0,
        level1Count: level1.length,
        level2Count: level2.length,
        level3Count: level3.length,
      },
      level1: level1.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
        totalDeposited: u.totalDeposited,
        isActive: u.isActive,
        referrals: u._count.referrals,
        joinedAt: u.createdAt,
      })),
      level2: level2.map(u => ({
        id: u.id,
        name: u.name,
        totalDeposited: u.totalDeposited,
        referredBy: u.referredById,
        isActive: u.isActive,
        joinedAt: u.createdAt,
      })),
      level3: level3.map(u => ({
        id: u.id,
        name: u.name,
        totalDeposited: u.totalDeposited,
        isActive: u.isActive,
        joinedAt: u.createdAt,
      })),
    })
  } catch (error) {
    console.error('Referral network error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
