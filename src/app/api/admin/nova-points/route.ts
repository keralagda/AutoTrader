import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { loadNPConfig } from '@/lib/nova-points-config'
export { loadNPConfig } // Re-export for backward compatibility

// Default reward pool config
const DEFAULT_CONFIG = {
  conversionRate: 1000, // NP per $1 USDC
  xpPerLevel: 1000,
  checkin: {
    baseNP: 2,
    streak3NP: 5,
    streak5NP: 8,
    streak7NP: 12,
    streak3Bonus: 0.10,
    streak5Bonus: 0.25,
    streak7Bonus: 0.50,
    milestone7NP: 12,
    milestone7Bonus: 1.00,
    milestone30NP: 25,
    milestone30Bonus: 2.00,
  },
  gamification: {
    checkinBaseNP: 12,
    checkinStreakBonus: 3,
    streakUsdcDay: 7,
    streakUsdcAmount: 1,
  },
  challengeMultiplier: 0.25, // Challenges pay 25% of configured NP
  storeItems: [
    { id: 'convert_to_usdc', name: 'Convert to USDC', cost: 1000, description: 'Convert 1000 NP to $1 USDC in your trading wallet', type: 'conversion', enabled: true },
    { id: 'fee_waiver', name: 'Withdrawal Fee Waiver', cost: 500, description: 'Waive withdrawal fee on your next withdrawal', type: 'perk', enabled: true },
    { id: 'priority_withdrawal', name: 'Priority Withdrawal', cost: 200, description: 'Skip the withdrawal queue — instant processing', type: 'perk', enabled: true },
    { id: 'bonus_2x_24h', name: '2x Earnings (24h)', cost: 2000, description: 'Double your earnings for the next 24 hours', type: 'boost', enabled: true },
    { id: 'extra_referral_level', name: 'Unlock Level 8 Referral', cost: 5000, description: 'Temporarily unlock an 8th referral level for 7 days', type: 'boost', enabled: true },
    { id: 'lucky_spin', name: 'Lucky Spin', cost: 50, description: 'Spin the wheel for a chance to win bonus', type: 'spin', enabled: true },
    { id: 'custom_badge', name: 'Exclusive Badge', cost: 3000, description: 'Get a unique profile badge that shows your status', type: 'cosmetic', enabled: true },
    { id: 'cooldown_skip', name: 'Skip Cooldown', cost: 300, description: 'Skip the withdrawal cooldown period', type: 'perk', enabled: true },
  ],
  luckySpinPrizes: [
    { amount: 0.10, weight: 30 },
    { amount: 0.25, weight: 25 },
    { amount: 0.50, weight: 20 },
    { amount: 1.00, weight: 12 },
    { amount: 2.00, weight: 8 },
    { amount: 5.00, weight: 4 },
    { amount: 10.00, weight: 1 },
  ],
  rewardPoolBalance: 0, // Admin-tracked pool balance
  totalRedeemed: 0,
  totalNPIssued: 0,
}

// GET - Get Nova Points reward pool config + stats
export async function GET() {
  try {
    const config = await loadNPConfig()

    // Get pool stats
    const totalUsers = await db.userStats.count()
    const totalNPInCirculation = await db.userStats.aggregate({ _sum: { xp: true } })
    const totalNPEverEarned = await db.userStats.aggregate({ _sum: { totalXpEarned: true } })

    return NextResponse.json({
      config,
      stats: {
        totalUsers,
        totalNPInCirculation: totalNPInCirculation._sum.xp || 0,
        totalNPEverEarned: totalNPEverEarned._sum.totalXpEarned || 0,
        estimatedLiability: ((totalNPInCirculation._sum.xp || 0) / config.conversionRate).toFixed(2),
      },
    })
  } catch (error) {
    console.error('Nova Points config GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT - Update Nova Points config
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    const current = await loadNPConfig()
    const updated = { ...current, ...body }

    await db.setting.upsert({
      where: { key: 'nova_points_config' },
      update: { value: JSON.stringify(updated) },
      create: { key: 'nova_points_config', value: JSON.stringify(updated) },
    })

    await db.activityLog.create({
      data: { action: 'nova_points_config_updated', details: JSON.stringify({ updatedFields: Object.keys(body) }) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Nova Points config PUT error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
