import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const where: any = { userId }
    if (type) where.type = type

    const earnings = await db.earning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate summary
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0)
    const referralEarnings = earnings.filter(e => e.type === 'referral').reduce((sum, e) => sum + e.amount, 0)
    const profitShareEarnings = earnings.filter(e => e.type === 'profit_share').reduce((sum, e) => sum + e.amount, 0)
    const dailyEarnings = earnings.filter(e => e.type === 'daily').reduce((sum, e) => sum + e.amount, 0)
    const bonusEarnings = earnings.filter(e => e.type === 'bonus').reduce((sum, e) => sum + e.amount, 0)

    // Group referral earnings by level
    const referralByLevel = Array.from({ length: 7 }, (_, i) => {
      const level = i + 1
      const levelEarnings = earnings.filter(e => e.type === 'referral' && e.level === level)
      return {
        level,
        percent: [25, 20, 15, 10, 10, 10, 10][i],
        earnings: levelEarnings.reduce((sum, e) => sum + e.amount, 0),
        count: levelEarnings.length,
      }
    })

    // Group profit share earnings by level
    const profitShareByLevel = Array.from({ length: 7 }, (_, i) => {
      const level = i + 1
      const levelEarnings = earnings.filter(e => e.type === 'profit_share' && e.level === level)
      return {
        level,
        percent: [25, 20, 15, 10, 10, 10, 10][i],
        earnings: levelEarnings.reduce((sum, e) => sum + e.amount, 0),
        count: levelEarnings.length,
      }
    })

    return NextResponse.json({
      earnings,
      summary: {
        total: totalEarnings,
        referral: referralEarnings,
        profitShare: profitShareEarnings,
        daily: dailyEarnings,
        bonus: bonusEarnings,
      },
      referralByLevel,
      profitShareByLevel,
    })
  } catch (error) {
    console.error('Get earnings error:', error)
    return NextResponse.json({ error: 'Failed to get earnings' }, { status: 500 })
  }
}
