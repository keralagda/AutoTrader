import { NextRequest, NextResponse } from 'next/server'
import { generateTradingSignal } from '@/lib/ai'

export async function GET(req: NextRequest) {
  try {
    const pair = req.nextUrl.searchParams.get('pair') || 'BTC/USDT'
    
    // Fetch live market price from Binance API to align entry/target/stopLoss with live rates
    const symbol = pair.replace('/', '')
    let currentPrice = 0
    try {
      const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
        next: { revalidate: 10 }
      })
      if (priceRes.ok) {
        const ticker = await priceRes.json()
        currentPrice = parseFloat(ticker.price) || 0
      }
    } catch (priceError) {
      console.error('Failed to fetch live price for signal alignment:', priceError)
    }

    const signal = await generateTradingSignal(pair, currentPrice)
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
