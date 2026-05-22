'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, TrendingDown, Minus, RefreshCw, Brain } from 'lucide-react'

interface Signal {
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
  entry: string
  target: string
  stopLoss: string
}

export function AITradingSignal() {
  const [signal, setSignal] = useState<Signal | null>(null)
  const [loading, setLoading] = useState(true)
  const [pair] = useState('BTC/USDT')

  useEffect(() => { loadSignal() }, [])

  const loadSignal = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ai/trading-signal?pair=${pair}`)
      if (res.ok) setSignal(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const getSignalColor = (s: string) => {
    if (s === 'BUY') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    if (s === 'SELL') return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }

  const getSignalIcon = (s: string) => {
    if (s === 'BUY') return <TrendingUp className="h-4 w-4" />
    if (s === 'SELL') return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-400" />
            AI Trading Signal
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadSignal} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : signal ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">{pair}</span>
              <Badge className={`gap-1 ${getSignalColor(signal.signal)}`}>
                {getSignalIcon(signal.signal)}
                {signal.signal}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${signal.signal === 'BUY' ? 'bg-emerald-400' : signal.signal === 'SELL' ? 'bg-rose-400' : 'bg-amber-400'}`}
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{signal.confidence}%</span>
            </div>

            <p className="text-xs text-muted-foreground">{signal.reasoning}</p>

            {signal.entry !== '0' && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-muted/20 p-1.5">
                  <p className="text-[9px] text-muted-foreground">Entry</p>
                  <p className="text-[11px] font-mono font-bold">${signal.entry}</p>
                </div>
                <div className="rounded bg-emerald-500/10 p-1.5">
                  <p className="text-[9px] text-muted-foreground">Target</p>
                  <p className="text-[11px] font-mono font-bold text-emerald-400">${signal.target}</p>
                </div>
                <div className="rounded bg-rose-500/10 p-1.5">
                  <p className="text-[9px] text-muted-foreground">Stop Loss</p>
                  <p className="text-[11px] font-mono font-bold text-rose-400">${signal.stopLoss}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">Signal unavailable</p>
        )}
      </CardContent>
    </Card>
  )
}
