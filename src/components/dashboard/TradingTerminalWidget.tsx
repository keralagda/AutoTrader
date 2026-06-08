'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Terminal, Activity, ArrowUpRight, ArrowDownLeft, Play, Pause, RefreshCw, AlertCircle } from 'lucide-react'

interface TradeLog {
  id: string
  timestamp: string
  type: 'BUY' | 'SELL'
  pair: 'USDC-BSC' | 'USDC-TRC' | 'BTC-USDC' | 'ETH-USDC'
  amount: number
  price: number
  status: 'PENDING' | 'EXECUTED' | 'COMPLETED'
  latency: number // ms
}

const SYMBOLS = ['USDC-BSC', 'USDC-TRC', 'BTC-USDC', 'ETH-USDC'] as const

function generateRandomTrade(index: number): TradeLog {
  const pair = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  const type = Math.random() > 0.4 ? 'BUY' : 'SELL'
  
  let amount = 0
  let price = 1.0000
  
  if (pair.includes('USDC')) {
    if (pair === 'USDC-BSC' || pair === 'USDC-TRC') {
      amount = Math.floor(Math.random() * 45000) + 5000
      price = 0.9985 + Math.random() * 0.003 // Fluctuate around $1
    } else if (pair === 'BTC-USDC') {
      amount = parseFloat((Math.random() * 0.5 + 0.01).toFixed(4))
      price = 68000 + Math.random() * 1200
    } else { // ETH-USDC
      amount = parseFloat((Math.random() * 5 + 0.1).toFixed(3))
      price = 3700 + Math.random() * 90
    }
  }

  const now = new Date()
  const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return {
    id: `tx-${Date.now()}-${index}`,
    timestamp,
    type,
    pair,
    amount,
    price,
    status: 'COMPLETED',
    latency: Math.floor(Math.random() * 180) + 40
  }
}

export function TradingTerminalWidget() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [logs, setLogs] = useState<TradeLog[]>([])
  const [stats, setStats] = useState({
    totalTrades: 142,
    successRate: 99.8,
    avgLatency: 72,
    volume24h: 384020
  })
  
  const logCounter = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initialize logs
  useEffect(() => {
    const initialLogs = Array.from({ length: 6 }).map((_, i) => {
      logCounter.current++
      return generateRandomTrade(logCounter.current)
    }).reverse()
    setLogs(initialLogs)
  }, [])

  // Live updates simulator
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      logCounter.current++
      const newTrade = generateRandomTrade(logCounter.current)
      
      // Update logs list (max 50)
      setLogs(prev => [newTrade, ...prev.slice(0, 49)])
      
      // Update statistics slightly
      setStats(prev => ({
        totalTrades: prev.totalTrades + 1,
        successRate: parseFloat((99.5 + Math.random() * 0.5).toFixed(1)),
        avgLatency: Math.floor((prev.avgLatency * 9 + newTrade.latency) / 10),
        volume24h: prev.volume24h + Math.floor(newTrade.type === 'BUY' ? newTrade.amount * newTrade.price : 0)
      }))

    }, 2500)

    return () => clearInterval(interval)
  }, [isPlaying])

  // Scroll to top of logs list on update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [logs])

  const triggerForceTrade = () => {
    logCounter.current++
    const newTrade = generateRandomTrade(logCounter.current)
    newTrade.latency = 12 // Manual execute latency boost
    setLogs(prev => [newTrade, ...prev])
    setStats(prev => ({
      ...prev,
      totalTrades: prev.totalTrades + 1,
      volume24h: prev.volume24h + Math.floor(newTrade.amount * newTrade.price)
    }))
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b border-border/20 bg-muted/20">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5 font-mono text-primary">
            <Terminal className="size-4 animate-pulse text-emerald-400" />
            AUTOMATED TRADING ENGINE
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Simulated high-frequency order placement matrix
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-[10px] uppercase font-mono tracking-wider font-semibold">
            <span className={`inline-block size-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
            {isPlaying ? 'Live Feed' : 'Paused'}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={triggerForceTrade}
            title="Inject Instant Buy/Sell Transaction"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      
      {/* Ticker Stats Bar */}
      <div className="grid grid-cols-4 border-b border-border/20 bg-muted/10 py-1.5 px-3 text-center divide-x divide-border/20">
        <div>
          <p className="text-[10px] text-muted-foreground font-mono">TOTAL TRANSACTIONS</p>
          <p className="text-xs font-bold font-mono text-foreground">{stats.totalTrades}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-mono">FILL SUCCESS</p>
          <p className="text-xs font-bold font-mono text-emerald-400">{stats.successRate}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-mono">AVG LATENCY</p>
          <p className="text-xs font-bold font-mono text-cyan-400">{stats.avgLatency}ms</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-mono">24H VOL INJECTED</p>
          <p className="text-xs font-bold font-mono text-amber-400">${stats.volume24h.toLocaleString()}</p>
        </div>
      </div>

      <CardContent className="p-0 flex-1 overflow-hidden font-mono text-xs flex flex-col bg-black/90">
        {/* Terminal Header Info */}
        <div className="p-2 border-b border-border/10 text-[10px] text-muted-foreground/70 bg-black/60 flex items-center justify-between">
          <span>SYSTEM CONNECTED // PORT: 5173</span>
          <span>BIP44 WALLET INDICES ACTIVE</span>
        </div>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-3 space-y-2">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                <AlertCircle className="size-6 text-muted-foreground/40" />
                <p className="text-xs">No activity log captured. Click loop triggers.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-border/5 pb-1.5 last:border-0 hover:bg-white/5 p-1 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/60 text-[10px]">{log.timestamp}</span>
                    <Badge 
                      className={`text-[10px] font-mono font-medium border-0 py-0 px-1 ${
                        log.type === 'BUY' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {log.type === 'BUY' ? (
                        <ArrowUpRight className="size-3 inline mr-0.5" />
                      ) : (
                        <ArrowDownLeft className="size-3 inline mr-0.5" />
                      )}
                      {log.type}
                    </Badge>
                    <span className="font-semibold text-foreground">{log.pair}</span>
                    <span className="text-muted-foreground">qty:</span>
                    <span className="text-cyan-400 font-semibold">
                      {log.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">price:</span>
                    <span className="text-amber-400 font-bold">
                      ${log.price.toFixed(log.pair.includes('USDC-') && !log.pair.includes('BTC') && !log.pair.includes('ETH') ? 4 : 2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">{log.latency}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Terminal Input Bar Simulator */}
        <div className="p-2 border-t border-border/10 bg-black flex items-center justify-between text-[10px] text-emerald-400">
          <span className="flex items-center gap-1">
            <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            bot-engine@autotrade:~# listening to node sockets...
          </span>
          <button onClick={clearLogs} className="text-muted-foreground hover:text-foreground hover:underline transition-all">
            [clear log]
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
