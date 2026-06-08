import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_CONFIG = {
  enabled: true,
  minDirectReferralsToApply: 3,
  minPersonalDepositToApply: 100.0,
  silverTierMultiplier: 1.2,
  goldTierMultiplier: 1.5,
  diamondTierMultiplier: 2.0,
  signupCommissionBonus: 5.0, // Credited to affiliate on new verified user register
  affiliateCommissionMode: 'tier_multiplied' // "tier_multiplied" or "fixed_rate"
}

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function GET() {
  try {
    await checkDb()
    const setting = await db.setting.findUnique({ where: { key: 'affiliate_config' } })
    if (setting) {
      return NextResponse.json(JSON.parse(setting.value))
    }
    return NextResponse.json(DEFAULT_CONFIG)
  } catch {
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    const data = await req.json()
    await db.setting.upsert({
      where: { key: 'affiliate_config' },
      update: { value: JSON.stringify(data) },
      create: { key: 'affiliate_config', value: JSON.stringify(data) }
    })

    return NextResponse.json({ success: true, message: 'Affiliate configurations saved successfully' })
  } catch (error) {
    console.error('Affiliate config update error:', error)
    return NextResponse.json({ error: 'Failed to save configurations' }, { status: 500 })
  }
}
