import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// VIP Tier System
const TIERS = [
  { name: 'Bronze', minDeposit: 0, bonus: 0, color: 'amber-600', icon: '🥉', benefits: ['Base earning rates', 'Standard withdrawal speed'] },
  { name: 'Silver', minDeposit: 500, bonus: 0.5, color: 'slate-300', icon: '🥈', benefits: ['+0.5% daily bonus', 'Priority support', 'Lower fees'] },
  { name: 'Gold', minDeposit: 5000, bonus: 1.0, color: 'amber-400', icon: '🥇', benefits: ['+1% daily bonus', 'VIP support', 'No withdrawal fees', 'Early access to plans'] },
  { name: 'Platinum', minDeposit: 25000, bonus: 2.0, color: 'violet-300', icon: '💎', benefits: ['+2% daily bonus', 'Dedicated manager', 'Instant withdrawals', 'Exclusive plans', 'Referral boost'] },
]

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { totalDeposited: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Determine current tier
    let currentTier = TIERS[0]
    let nextTier = TIERS[1]
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (user.totalDeposited >= TIERS[i].minDeposit) {
        currentTier = TIERS[i]
        nextTier = TIERS[i + 1] || null
        break
      }
    }

    const progressToNext = nextTier
      ? ((user.totalDeposited - currentTier.minDeposit) / (nextTier.minDeposit - currentTier.minDeposit)) * 100
      : 100

    return NextResponse.json({
      currentTier,
      nextTier,
      totalDeposited: user.totalDeposited,
      progressToNext: Math.min(progressToNext, 100),
      allTiers: TIERS,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
