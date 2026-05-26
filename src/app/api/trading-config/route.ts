import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_CONFIG = {
  winStreakMin: 3,
  winStreakMax: 5,
  lossStreakMin: 2,
  lossStreakMax: 3,
  neutralStreakMin: 3,
  neutralStreakMax: 4,
  signalIntervalMin: 5,
  signalIntervalMax: 12,
  profitMultiplier: 1.0,
  maxWinRate: 72,
  pairs: 'BTC/USDT,ETH/USDT,SOL/USDT,BNB/USDT,XRP/USDT,ADA/USDT,DOGE/USDT,AVAX/USDT',
}

// Public endpoint - accessible by all authenticated users
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
    return NextResponse.json(DEFAULT_CONFIG)
  }
}
