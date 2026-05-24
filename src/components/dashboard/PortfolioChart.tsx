'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, PieChart, Wallet, ArrowUpRight } from 'lucide-react'

interface PortfolioData {
  summary: {
    portfolioValue: number
    tradingBalance: number
    withdrawalBalance: number
    totalInvested: number
    totalEarnings: number
    totalWithdrawn: number
    totalEarnedFromDeposits: number
    roi: string
  }
  activeDeposits: {
    id: string
    planName: string
    amount: number
    earnedSoFar: number
    dailyPercent: number
    returnType: string
    createdAt: string
  }[]
  earningsByType: Record<string, number>
  chartData: { date: string; earnings: number }[]
}

export function PortfolioChart() {
  const { user } = useAppStore()
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    loadPortfolio()
  }, [user?.id])

  const loadPortfolio = async () => {
    try {
      const res = await fetch(`/api/portfolio?userId=${user?.id}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const maxEarning = Math.max(...data.chartData.map(d => d.earnings), 1)

  return (
    <div className="space-y-4">
      {/* Portfolio Value */}
      <Card className="bg-gradient-to-br from-primary/10 via-card to-cyan-500/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                ${data.summary.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {data.summary.roi}% ROI
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Total earned: ${(data.summary.totalEarnings || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <PieChart className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Earnings Chart */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Earnings (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Simple bar chart */}
          <div className="flex items-end gap-[2px] h-20 mt-2">
            {data.chartData.map((day, i) => {
              const height = maxEarning > 0 ? (day.earnings / maxEarning) * 100 : 0
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/40 hover:bg-primary/70 transition-colors min-h-[2px]"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${day.date}: $${day.earnings.toFixed(2)}`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">30 days ago</span>
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Investments */}
      {data.activeDeposits.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Active Investments ({data.activeDeposits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.activeDeposits.slice(0, 5).map(deposit => {
              const progress = deposit.amount > 0
                ? Math.min((deposit.earnedSoFar / deposit.amount) * 100, 100)
                : 0
              return (
                <div key={deposit.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium truncate">{deposit.planName}</p>
                      <span className="text-xs text-emerald-400">+{deposit.dailyPercent}%/day</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        ${(deposit.amount || 0).toFixed(2)} invested
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        ${(deposit.earnedSoFar || 0).toFixed(2)} earned
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-muted/30 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Earnings Breakdown */}
      {Object.keys(data.earningsByType).length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Earnings Breakdown (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.earningsByType).map(([type, amount]) => {
                const colors: Record<string, string> = {
                  daily: 'bg-emerald-400',
                  profit_share: 'bg-cyan-400',
                  referral: 'bg-violet-400',
                  bonus: 'bg-amber-400',
                  stacking_bonus: 'bg-rose-400',
                }
                const total = Object.values(data.earningsByType).reduce((s, v) => s + v, 0)
                const percent = total > 0 ? (amount / total) * 100 : 0
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${colors[type] || 'bg-muted-foreground'}`} />
                    <span className="text-xs text-muted-foreground capitalize flex-1">
                      {type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-medium">${amount.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground w-10 text-right">
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
