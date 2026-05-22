import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ['withdrawal_min', 'withdrawal_max', 'withdrawal_fee_percent', 'daily_limit', 'weekly_limit'] } },
    })

    const result: any = {}
    settings.forEach(s => {
      result[s.key] = parseFloat(s.value) || 0
    })

    return NextResponse.json({
      withdrawalMin: result.withdrawal_min || 10,
      withdrawalMax: result.withdrawal_max || 10000,
      withdrawalFeePercent: result.withdrawal_fee_percent || 1,
      dailyLimit: result.daily_limit || 5000,
      weeklyLimit: result.weekly_limit || 20000,
    })
  } catch (error) {
    console.error('Get withdrawal limits error:', error)
    return NextResponse.json({ error: 'Failed to get withdrawal limits' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { withdrawalMin, withdrawalMax, withdrawalFeePercent, dailyLimit, weeklyLimit } = await request.json()

    const updates = [
      { key: 'withdrawal_min', value: withdrawalMin.toString() },
      { key: 'withdrawal_max', value: withdrawalMax.toString() },
      { key: 'withdrawal_fee_percent', value: withdrawalFeePercent.toString() },
      { key: 'daily_limit', value: dailyLimit.toString() },
      { key: 'weekly_limit', value: weeklyLimit.toString() },
    ]

    for (const update of updates) {
      await db.setting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      })
    }

    return NextResponse.json({ success: true, message: 'Withdrawal limits updated' })
  } catch (error) {
    console.error('Update withdrawal limits error:', error)
    return NextResponse.json({ error: 'Failed to update withdrawal limits' }, { status: 500 })
  }
}
