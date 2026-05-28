import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_CONFIG = {
  maxLevels: 7,
  depositCommission: {
    enabled: true,
    levels: [5, 3, 2, 1, 1, 0.5, 0.5], // % per level
  },
  profitShare: {
    enabled: true,
    levels: [25, 20, 15, 10, 10, 10, 10], // % per level
  },
  subscriptionFeeShare: {
    enabled: true,
    levels: [80, 0, 0, 0, 0, 0, 0], // % of entry fee (L1 gets 80%)
  },
  qualificationRules: {
    level2MinReferrals: 1, // Need 1 direct referral to earn from L2
    level3MinReferrals: 3,
    level4MinReferrals: 5,
    level5MinReferrals: 10,
    level6MinReferrals: 15,
    level7MinReferrals: 20,
    minDepositToEarn: 0, // Minimum own deposit to qualify for referral earnings
  },
  bonusMultipliers: {
    vipTierMultiplier: { Bronze: 1, Silver: 1.1, Gold: 1.25, Platinum: 1.5 },
    contestMultiplier: 1, // Set to 2 during promotions
  },
  signupBonus: {
    enabled: false,
    amount: 0, // $ credited to referrer on signup
  },
}

// GET - Get referral configuration
export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'referral_config' } })
    if (setting) {
      return NextResponse.json(JSON.parse(setting.value))
    }
    return NextResponse.json(DEFAULT_CONFIG)
  } catch {
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

// PUT - Update referral configuration
export async function PUT(req: NextRequest) {
  try {
    const config = await req.json()

    await db.setting.upsert({
      where: { key: 'referral_config' },
      update: { value: JSON.stringify(config) },
      create: { key: 'referral_config', value: JSON.stringify(config) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Referral config error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
