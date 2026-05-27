import { NextRequest, NextResponse } from 'next/server'

// Fetch real-time crypto prices from Binance public API (no key needed)
export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get('symbol') || 'BTCUSDT'
    const interval = req.nextUrl.searchParams.get('interval') || '1m'
    const limit = req.nextUrl.searchParams.get('limit') || '60'

    // Binance Klines (candlestick) API - free, no auth required
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { next: { revalidate: 5 } } // Cache for 5 seconds
    )

    if (!res.ok) {
      // Fallback to ticker price
      const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
      if (tickerRes.ok) {
        const ticker = await tickerRes.json()
        return NextResponse.json({ price: parseFloat(ticker.price), symbol })
      }
      return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 })
    }

    const klines = await res.json()

    // Format: [openTime, open, high, low, close, volume, closeTime, ...]
    const candles = klines.map((k: any[]) => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))

    const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0

    return NextResponse.json({
      symbol,
      interval,
      currentPrice,
      candles,
    })
  } catch (error) {
    console.error('Crypto price error:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
