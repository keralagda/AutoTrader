import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const earnings = await db.earning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const summary = {
      total: earnings.filter(e => e.type !== 'subtract').reduce((sum, e) => sum + e.amount, 0),
      referral: earnings.filter(e => e.type === 'referral').reduce((sum, e) => sum + e.amount, 0),
      profitShare: earnings.filter(e => e.type === 'profit_share').reduce((sum, e) => sum + e.amount, 0),
      daily: earnings.filter(e => e.type === 'daily').reduce((sum, e) => sum + e.amount, 0),
      binary: earnings.filter(e => e.type === 'binary_pairing_bonus' || e.type === 'binary_cycle_bonus' || e.type === 'binary_flush_bonus' || e.type.startsWith('binary_')).reduce((sum, e) => sum + e.amount, 0),
      bonus: earnings.filter(e => (e.type === 'bonus' || e.type === 'stacking_bonus') && !e.type.startsWith('binary_')).reduce((sum, e) => sum + e.amount, 0),
      subtracted: earnings.filter(e => e.type === 'subtract').reduce((sum, e) => sum + e.amount, 0),
    }

    // Fetch active plan referral rules to get dynamic level percentages
    const activeBinaryPlan = await db.plan.findFirst({
      where: { isActive: true, isBinaryMlmEnabled: true },
      include: { referralRules: { where: { enabled: true }, orderBy: { level: 'asc' } } }
    })
    const activePlan = activeBinaryPlan || await db.plan.findFirst({
      where: { isActive: true },
      include: { referralRules: { where: { enabled: true }, orderBy: { level: 'asc' } } }
    })

    const registrationRules = activePlan?.referralRules.filter(r => r.type === 'registration') || []
    const profitRules = activePlan?.referralRules.filter(r => r.type === 'profit') || []
    const defaultRates = [25, 20, 15, 10, 10, 10, 10]
    const maxLevels = activePlan?.registrationReferralLevels ?? 7

    const referralByLevel = Array.from({ length: maxLevels }, (_, i) => {
      const level = i + 1
      const levelEarnings = earnings.filter(e => e.type === 'referral' && e.level === level)
      const rule = registrationRules.find(r => r.level === level)
      return {
        level,
        percent: rule ? rule.commission : (defaultRates[i] || 10),
        earnings: levelEarnings.reduce((sum, e) => sum + e.amount, 0),
        count: levelEarnings.length,
      }
    })

    const profitShareByLevel = Array.from({ length: maxLevels }, (_, i) => {
      const level = i + 1
      const levelEarnings = earnings.filter(e => e.type === 'profit_share' && e.level === level)
      const rule = profitRules.find(r => r.level === level)
      return {
        level,
        percent: rule ? rule.commission : (defaultRates[i] || 10),
        earnings: levelEarnings.reduce((sum, e) => sum + e.amount, 0),
        count: levelEarnings.length,
      }
    })

    return NextResponse.json({ earnings, summary, referralByLevel, profitShareByLevel })
  } catch (error) {
    console.error('Get earnings error:', error)
    return NextResponse.json({ error: 'Failed to get earnings' }, { status: 500 })
  }
}
