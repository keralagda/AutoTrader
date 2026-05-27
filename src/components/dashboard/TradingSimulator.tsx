'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Zap, DollarSign } from 'lucide-react'

interface Deposit {
  id: string
  amount: number
  status: string
  earnedSoFar: number
  plan: {
    name: string
    dailyEarningPercent: number
    maxEarningLimit: number
  }
}

interface TradeSignal {
  id: number
  pair: string
  type: 'BUY' | 'SELL'
  entry: number
  target: number
  stopLoss: number
  profit: number
  status: 'won' | 'lost' | 'neutral'
  duration: string
  riskReward: string
  timestamp: string
}

interface TradingConfig {
  winStreakMin: number
  winStreakMax: number
  lossStreakMin: number
  lossStreakMax: number
  neutralStreakMin: number
  neutralStreakMax: number
  signalIntervalMin: number
  signalIntervalMax: number
  profitMultiplier: number
  maxWinRate: number
  pairs: string
}

interface PlanRate {
  dailyPercent: number
  dailyAllowedEarning: number
  totalAllowedEarning: number
  creditedEarnings: number
  maxEarning: number
  daysSinceCreation: number
  depositAmount: number
}

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
}

const DEFAULT_CONFIG: TradingConfig = {
  winStreakMin: 3, winStreakMax: 5,
  lossStreakMin: 2, lossStreakMax: 3,
  neutralStreakMin: 3, neutralStreakMax: 4,
  signalIntervalMin: 5, signalIntervalMax: 12,
  profitMultiplier: 1.0, maxWinRate: 72,
  pairs: 'BTC/USDT,ETH/USDT,SOL/USDT,BNB/USDT,XRP/USDT,ADA/USDT,DOGE/USDT,AVAX/USDT',
}

const BASE_PRICES: Record<string, number> = {
  'BTC/USDT': 67500, 'ETH/USDT': 3450, 'SOL/USDT': 178, 'BNB/USDT': 605,
  'XRP/USDT': 0.62, 'ADA/USDT': 0.45, 'DOGE/USDT': 0.165, 'AVAX/USDT': 38.5,
}

type Phase = 'win' | 'loss' | 'neutral'

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function TradingSimulator({ deposit }: { deposit: Deposit }) {
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [candles, setCandles] = useState<CandleData[]>([])
  const [currentPrice, setCurrentPrice] = useState(67500)
  const [selectedPair, setSelectedPair] = useState('BTC/USDT')
  const [totalProfit, setTotalProfit] = useState(0)
  const [winCount, setWinCount] = useState(0)
  const [lossCount, setLossCount] = useState(0)
  const [neutralCount, setNeutralCount] = useState(0)
  const [config, setConfig] = useState<TradingConfig>(DEFAULT_CONFIG)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [planRate, setPlanRate] = useState<PlanRate | null>(null)
  const [creditedEarnings, setCreditedEarnings] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef<Phase>('win')
  const phaseCountRef = useRef(0)
  const phaseTargetRef = useRef(0)
  const signalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const creditTimerRef = useRef<NodeJS.Timeout | null>(null)
  const patternQueueRef = useRef<string[]>([])
  const patternIndexRef = useRef(0)

  const pairs = config.pairs.split(',').map(p => p.trim())

  // Load config
  useEffect(() => {
    fetch('/api/trading-config')
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {})
  }, [])

  // Load saved session + plan rate info
  useEffect(() => {
    fetch(`/api/trading-session?depositId=${deposit.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.session) {
          setTotalProfit(data.session.totalProfit || 0)
          setWinCount(data.session.winCount || 0)
          setLossCount(data.session.lossCount || 0)
          setNeutralCount(data.session.neutralCount || 0)
          if (data.session.signals?.length) setSignals(data.session.signals)
        }
        if (data.planRate) {
          setPlanRate(data.planRate)
          setCreditedEarnings(data.planRate.creditedEarnings || 0)
        }
        setSessionLoaded(true)
      })
      .catch(() => setSessionLoaded(true))
  }, [deposit.id])

  // Save session (debounced)
  const saveSession = useCallback(() => {
    if (!sessionLoaded) return
    fetch('/api/trading-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositId: deposit.id, totalProfit, winCount, lossCount, neutralCount, signals,
      }),
    }).catch(() => {})
  }, [deposit.id, totalProfit, winCount, lossCount, neutralCount, signals, sessionLoaded])

  useEffect(() => {
    if (!sessionLoaded) return
    const timer = setTimeout(saveSession, 2000)
    return () => clearTimeout(timer)
  }, [saveSession, sessionLoaded])

  useEffect(() => { return () => { saveSession() } }, [saveSession])

  // Periodic earnings credit sync (every 60s, credits plan-rate earnings)
  useEffect(() => {
    if (!sessionLoaded) return
    const syncCredit = () => {
      fetch('/api/trading-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: deposit.id, totalProfit, winCount, lossCount, neutralCount, signals,
          syncEarnings: true,
        }),
      }).then(r => r.json()).then(data => {
        if (data.credited && data.credited > 0) {
          setCreditedEarnings(data.newEarnedSoFar || 0)
        }
      }).catch(() => {})
    }
    // Sync on mount and every 60 seconds
    const initialSync = setTimeout(syncCredit, 5000)
    creditTimerRef.current = setInterval(syncCredit, 60000)
    return () => {
      clearTimeout(initialSync)
      if (creditTimerRef.current) clearInterval(creditTimerRef.current)
    }
  }, [sessionLoaded, deposit.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize phase - fetch pattern from API
  useEffect(() => {
    fetch(`/api/trading-pattern?count=30&depositId=${deposit.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.pattern) {
          patternQueueRef.current = data.pattern
          patternIndexRef.current = 0
        }
      })
      .catch(() => {
        // Fallback: generate locally
        patternQueueRef.current = Array.from({ length: 30 }, () => {
          const r = Math.random()
          return r < 0.5 ? 'W' : r < 0.75 ? 'L' : 'N'
        })
      })
  }, [config, deposit.id])

  // Generate candle data from real Binance prices
  useEffect(() => {
    const symbol = selectedPair.replace('/', '')
    fetch(`/api/crypto-price?symbol=${symbol}&interval=1m&limit=60`)
      .then(r => r.json())
      .then(data => {
        if (data.candles && data.candles.length > 0) {
          setCandles(data.candles.map((c: any) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })))
          setCurrentPrice(data.currentPrice)
        } else if (data.price) {
          // Fallback: single price, generate candles around it
          const basePrice = data.price
          const initialCandles: CandleData[] = []
          let price = basePrice
          for (let i = 60; i >= 0; i--) {
            const volatility = price * 0.002
            const open = price
            const close = open + (Math.random() - 0.45) * volatility
            const high = Math.max(open, close) + Math.random() * volatility * 0.5
            const low = Math.min(open, close) - Math.random() * volatility * 0.5
            initialCandles.push({ time: Date.now() - i * 60000, open, high, low, close })
            price = close
          }
          setCandles(initialCandles)
          setCurrentPrice(basePrice)
        }
      })
      .catch(() => {
        // Fallback: use BASE_PRICES for offline
        const basePrice = BASE_PRICES[selectedPair] || 67500
        const initialCandles: CandleData[] = []
        let price = basePrice
        for (let i = 60; i >= 0; i--) {
          const volatility = price * 0.003
          const open = price
          const close = open + (Math.random() - 0.45) * volatility
          const high = Math.max(open, close) + Math.random() * volatility * 0.5
          const low = Math.min(open, close) - Math.random() * volatility * 0.5
          initialCandles.push({ time: Date.now() - i * 60000, open, high, low, close })
          price = close
        }
        setCandles(initialCandles)
        setCurrentPrice(price)
      })
  }, [selectedPair])

  // Real-time price updates from Binance
  useEffect(() => {
    const symbol = selectedPair.replace('/', '')

    // Fetch fresh price every 10 seconds
    const fetchPrice = () => {
      fetch(`/api/crypto-price?symbol=${symbol}&interval=1m&limit=1`)
        .then(r => r.json())
        .then(data => {
          if (data.currentPrice) {
            const newPrice = data.currentPrice
            setCurrentPrice(newPrice)
            setCandles(prev => {
              if (prev.length === 0) return prev
              const last = prev[prev.length - 1]
              if (Date.now() - last.time > 60000) {
                // New candle
                return [...prev.slice(-59), { time: Date.now(), open: newPrice, high: newPrice, low: newPrice, close: newPrice }]
              }
              // Update current candle
              return [...prev.slice(0, -1), { ...last, close: newPrice, high: Math.max(last.high, newPrice), low: Math.min(last.low, newPrice) }]
            })
          }
        })
        .catch(() => {})
    }

    // Also do micro-updates between fetches for smooth animation
    const microInterval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev
        const last = prev[prev.length - 1]
        const volatility = last.close * 0.0005
        const change = (Math.random() - 0.48) * volatility
        const newClose = last.close + change
        setCurrentPrice(newClose)
        return [...prev.slice(0, -1), { ...last, close: newClose, high: Math.max(last.high, newClose), low: Math.min(last.low, newClose) }]
      })
    }, 2000)

    const priceInterval = setInterval(fetchPrice, 10000)
    fetchPrice() // Initial fetch

    return () => {
      clearInterval(priceInterval)
      clearInterval(microInterval)
    }
  }, [selectedPair])

  // Signal generation - consumes from pattern API queue
  useEffect(() => {
    if (!sessionLoaded) return

    const fetchMorePatterns = () => {
      fetch(`/api/trading-pattern?count=20&depositId=${deposit.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.pattern) {
            patternQueueRef.current = [...patternQueueRef.current, ...data.pattern]
          }
        })
        .catch(() => {})
    }

    const generateSignal = () => {
      // Get next outcome from pattern queue
      let status: 'won' | 'lost' | 'neutral'
      if (patternQueueRef.current.length > 0 && patternIndexRef.current < patternQueueRef.current.length) {
        const code = patternQueueRef.current[patternIndexRef.current]
        patternIndexRef.current++
        status = code === 'W' ? 'won' : code === 'L' ? 'lost' : 'neutral'

        // Fetch more patterns when running low
        if (patternIndexRef.current >= patternQueueRef.current.length - 5) {
          fetchMorePatterns()
        }
      } else {
        // Fallback if queue is empty
        const r = Math.random()
        status = r < 0.5 ? 'won' : r < 0.75 ? 'lost' : 'neutral'
        fetchMorePatterns()
      }

      const pair = pairs[Math.floor(Math.random() * pairs.length)]
      const basePrice = BASE_PRICES[pair] || 100
      const type: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL'
      const profitPercent = (deposit.plan.dailyEarningPercent / 5) * config.profitMultiplier * (0.8 + Math.random() * 0.4)
      const entry = basePrice * (1 + (Math.random() - 0.5) * 0.01)
      const target = type === 'BUY' ? entry * (1 + profitPercent / 100) : entry * (1 - profitPercent / 100)
      const stopLoss = type === 'BUY' ? entry * (1 - profitPercent / 200) : entry * (1 + profitPercent / 200)

      let profit: number
      if (status === 'won') profit = (deposit.amount * profitPercent) / 100
      else if (status === 'lost') profit = -(deposit.amount * profitPercent) / 200
      else profit = (Math.random() - 0.5) * deposit.amount * 0.001

      const durations = ['12s', '28s', '45s', '1m 12s', '1m 38s', '2m 05s', '32s', '55s']
      const duration = durations[Math.floor(Math.random() * durations.length)]
      const rr = status === 'won' ? `1:${(1.5 + Math.random() * 1.5).toFixed(1)}` : status === 'lost' ? `1:0.${Math.floor(Math.random() * 5 + 3)}` : '1:0.0'

      const signal: TradeSignal = {
        id: Date.now() + Math.random(), pair, type, entry, target, stopLoss, profit, status, duration, riskReward: rr,
        timestamp: new Date().toISOString(),
      }

      setSignals(prev => [signal, ...prev].slice(0, 30))
      setTotalProfit(prev => prev + profit)
      if (status === 'won') setWinCount(prev => prev + 1)
      else if (status === 'lost') setLossCount(prev => prev + 1)
      else setNeutralCount(prev => prev + 1)
    }

    if (signals.length === 0) {
      for (let i = 0; i < 3; i++) setTimeout(generateSignal, i * 300)
    }

    const scheduleNext = () => {
      const delay = (config.signalIntervalMin + Math.random() * (config.signalIntervalMax - config.signalIntervalMin)) * 1000
      signalTimerRef.current = setTimeout(() => { generateSignal(); scheduleNext() }, delay)
    }
    const initialDelay = setTimeout(scheduleNext, 3000)
    return () => { clearTimeout(initialDelay); if (signalTimerRef.current) clearTimeout(signalTimerRef.current) }
  }, [config, deposit, sessionLoaded, pairs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || candles.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    const width = rect.width
    const height = rect.height
    const padding = 10
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 0.5
    for (let i = 0; i < 5; i++) {
      const y = padding + (i * (height - 2 * padding)) / 4
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke()
    }
    const prices = candles.map(c => [c.high, c.low]).flat()
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    const candleWidth = (width - 2 * padding) / candles.length
    const scaleY = (price: number) => height - padding - ((price - minPrice) / priceRange) * (height - 2 * padding)
    candles.forEach((candle, i) => {
      const x = padding + i * candleWidth + candleWidth / 2
      const isGreen = candle.close >= candle.open
      ctx.strokeStyle = isGreen ? '#34d399' : '#fb7185'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, scaleY(candle.high)); ctx.lineTo(x, scaleY(candle.low)); ctx.stroke()
      ctx.fillStyle = isGreen ? '#34d399' : '#fb7185'
      const bodyTop = scaleY(Math.max(candle.open, candle.close))
      const bodyBottom = scaleY(Math.min(candle.open, candle.close))
      ctx.fillRect(x - candleWidth * 0.3, bodyTop, candleWidth * 0.6, Math.max(bodyBottom - bodyTop, 1))
    })
    const lastCandle = candles[candles.length - 1]
    const priceY = scaleY(lastCandle.close)
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(padding, priceY); ctx.lineTo(width - padding, priceY); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#22d3ee'; ctx.font = '10px monospace'
    ctx.fillText(lastCandle.close.toFixed(2), width - 70, priceY - 4)
  }, [candles])

  const totalSignals = winCount + lossCount + neutralCount
  const winRate = totalSignals > 0 ? (winCount / totalSignals) * 100 : 0
  const dailyTarget = planRate ? planRate.dailyAllowedEarning : (deposit.amount * deposit.plan.dailyEarningPercent / 100)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-primary animate-pulse" />
                Live Trading - {deposit.plan.name} Plan
              </CardTitle>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Credited Earnings Banner */}
            <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 border border-emerald-500/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-emerald-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Credited to Balance (Plan Rate: {deposit.plan.dailyEarningPercent}%/day)</p>
                    <p className="text-lg font-bold text-emerald-400">${creditedEarnings.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Daily Target</p>
                  <p className="text-sm font-bold text-cyan-400">${dailyTarget.toFixed(2)}/day</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Session P&L may fluctuate, but your actual earnings are balanced to the plan&apos;s {deposit.plan.dailyEarningPercent}% daily rate.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Investment</p>
                <p className="text-sm font-bold">${deposit.amount.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Session P&L</p>
                <p className={`text-sm font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-sm font-bold text-cyan-400">{winRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">W / L / N</p>
                <p className="text-sm font-bold">
                  <span className="text-emerald-400">{winCount}</span>
                  {' / '}<span className="text-rose-400">{lossCount}</span>
                  {' / '}<span className="text-muted-foreground">{neutralCount}</span>
                </p>
              </div>
              <div className="rounded-lg bg-violet-500/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Signals</p>
                <p className="text-sm font-bold text-violet-400">{totalSignals}</p>
              </div>
            </div>

            {/* Pair Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {pairs.slice(0, 6).map(pair => (
                <button key={pair} onClick={() => setSelectedPair(pair)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedPair === pair ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}>{pair}</button>
              ))}
            </div>

            {/* Chart */}
            <div className="relative rounded-lg bg-background/50 border border-border/30 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{selectedPair}</span>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  ${currentPrice.toFixed(selectedPair.includes('DOGE') || selectedPair.includes('XRP') || selectedPair.includes('ADA') ? 4 : 2)}
                </span>
              </div>
              <canvas ref={canvasRef} className="w-full h-48 md:h-64" style={{ display: 'block' }} />
            </div>
          </CardContent>
        </Card>

        {/* Trade Signals with Hover Tooltips */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="size-4 text-amber-400" />
                Trade Signals
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">Hover for details</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {signals.map(signal => (
                <Tooltip key={signal.id}>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center justify-between p-2.5 rounded-lg border cursor-default transition-colors ${
                      signal.status === 'won' ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' :
                      signal.status === 'lost' ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' :
                      'bg-muted/20 border-border/30 hover:border-border/60'
                    }`}>
                      <div className="flex items-center gap-3">
                        {signal.status === 'won' ? <TrendingUp className="size-4 text-emerald-400" /> :
                         signal.status === 'lost' ? <TrendingDown className="size-4 text-rose-400" /> :
                         <Minus className="size-4 text-muted-foreground" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{signal.pair}</span>
                            <Badge className={`text-[9px] px-1 py-0 ${signal.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{signal.type}</Badge>
                            <Badge className={`text-[9px] px-1 py-0 ${
                              signal.status === 'won' ? 'bg-emerald-500/20 text-emerald-400' :
                              signal.status === 'lost' ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>{signal.status.toUpperCase()}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Entry: {signal.entry.toFixed(2)} → Target: {signal.target.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${signal.profit > 0.01 ? 'text-emerald-400' : signal.profit < -0.01 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                          {signal.profit >= 0 ? '+' : ''}${signal.profit.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{new Date(signal.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Pair</span><span className="font-medium">{signal.pair}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Direction</span><span className={signal.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{signal.type}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Entry</span><span className="font-mono">${signal.entry.toFixed(4)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Target</span><span className="font-mono text-emerald-400">${signal.target.toFixed(4)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Stop Loss</span><span className="font-mono text-rose-400">${signal.stopLoss.toFixed(4)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Duration</span><span>{signal.duration}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Risk:Reward</span><span>{signal.riskReward}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Result</span>
                        <span className={`font-bold ${signal.status === 'won' ? 'text-emerald-400' : signal.status === 'lost' ? 'text-rose-400' : 'text-gray-400'}`}>
                          {signal.status === 'won' ? '✓ WIN' : signal.status === 'lost' ? '✗ LOSS' : '— NEUTRAL'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 pt-1 border-t border-border/50"><span className="text-muted-foreground">P&L</span>
                        <span className={`font-bold ${signal.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{signal.profit >= 0 ? '+' : ''}${signal.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
              {signals.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Waiting for signals...</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
