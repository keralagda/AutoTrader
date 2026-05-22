import { NextRequest, NextResponse } from 'next/server'
import { generateTradingSignal } from '@/lib/ai'

export async function GET(req: NextRequest) {
  try {
    const pair = req.nextUrl.searchParams.get('pair') || 'BTC/USDT'
    const signal = await generateTradingSignal(pair)
    return NextResponse.json(signal)
  } catch (error: any) {
    console.error('Trading signal error:', error)
    return NextResponse.json({
      signal: 'HOLD',
      confidence: 50,
      reasoning: 'AI analysis temporarily unavailable',
      entry: '0',
      target: '0',
      stopLoss: '0',
    })
  }
}
