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
        deposits: {
          where: { status: { in: ['active', 'locked'] } },
          select: { amount: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    const directReferralsFormatted = directReferrals.map(m => {
      const activeDepositsTotal = m.deposits.reduce((sum, d) => sum + d.amount, 0)
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        totalDeposited: activeDepositsTotal > 0 ? activeDepositsTotal : m.totalDeposited,
        totalEarnings: m.totalEarnings,
        isActive: m.isActive,
        createdAt: m.createdAt,
      }
    })

    // Retrieve profit level commissions from active binary plans to determine max levels dynamically
    const activeBinaryPlan = await db.plan.findFirst({
      where: { isActive: true, isBinaryMlmEnabled: true },
      include: { referralRules: { where: { type: 'profit', enabled: true }, orderBy: { level: 'asc' } } }
    })
    const activePlan = activeBinaryPlan || await db.plan.findFirst({
      where: { isActive: true },
      include: { referralRules: { where: { type: 'profit', enabled: true }, orderBy: { level: 'asc' } } }
    })

    const maxLevels = activePlan?.registrationReferralLevels ?? 7

    // Build team tree up to maxLevels
    const teamByLevel: { level: number; members: any[]; count: number }[] = []
    let currentLevelIds = [userId]

    for (let level = 1; level <= maxLevels; level++) {
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
          deposits: {
            where: { status: { in: ['active', 'locked'] } },
            select: { amount: true }
          }
        },
      })

      const membersFormatted = members.map(m => {
        const activeDepositsTotal = m.deposits.reduce((sum, d) => sum + d.amount, 0)
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          totalDeposited: activeDepositsTotal > 0 ? activeDepositsTotal : m.totalDeposited,
          totalEarnings: m.totalEarnings,
          isActive: m.isActive,
          createdAt: m.createdAt,
        }
      })

      teamByLevel.push({
        level,
        members: membersFormatted,
        count: members.length,
      })

      currentLevelIds = members.map(m => m.id)
      if (currentLevelIds.length === 0) break
    }

    const totalTeam = teamByLevel.reduce((sum, l) => sum + l.count, 0)
    const totalDirect = directReferralsFormatted.length
    
    const registrationRates = (activePlan?.referralRules || []).map(r => ({
      level: r.level,
      commission: r.commission,
    }))

    return NextResponse.json({
      directReferrals: directReferralsFormatted,
      teamByLevel,
      totalTeam,
      totalDirect,
      registrationRates,
    })
  } catch (error) {
    console.error('Get team error:', error)
    return NextResponse.json({ error: 'Failed to get team data' }, { status: 500 })
  }
}
