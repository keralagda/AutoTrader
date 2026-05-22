import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_CONFIG = {
  winStreakMin: 3,
  winStreakMax: 5,
  lossStreakMin: 2,
  lossStreakMax: 3,
  neutralStreakMin: 3,
  neutralStreakMax: 4,
  signalIntervalMin: 5, // seconds
  signalIntervalMax: 12,
  profitMultiplier: 1.0, // multiplier on plan's daily %
  maxWinRate: 72, // target win rate %
  pairs: 'BTC/USDT,ETH/USDT,SOL/USDT,BNB/USDT,XRP/USDT,ADA/USDT,DOGE/USDT,AVAX/USDT',
}

export async function GET() {
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'trading_config' },
    })

    if (!setting) {
      return NextResponse.json(DEFAULT_CONFIG)
    }

    return NextResponse.json(JSON.parse(setting.value))
  } catch (error) {
    console.error('Get trading config error:', error)
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

export async function PUT(request: Request) {
  try {
    const config = await request.json()

    await db.setting.upsert({
      where: { key: 'trading_config' },
      create: { key: 'trading_config', value: JSON.stringify(config) },
      update: { value: JSON.stringify(config) },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Update trading config error:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
