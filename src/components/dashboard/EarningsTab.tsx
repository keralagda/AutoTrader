'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { formatEarningType } from '@/lib/utils'
import type { EarningType, ReferralLevelType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  Users,
  Share2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  GitBranch,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface EarningsSummary {
  total: number
  referral: number
  profitShare: number
  daily: number
  binary: number
  bonus: number
}

interface EarningsResponse {
  earnings: EarningType[]
  summary: EarningsSummary
  referralByLevel: ReferralLevelType[]
  profitShareByLevel: ReferralLevelType[]
}

const earningsChartConfig: ChartConfig = {
  amount: {
    label: 'Earnings',
    color: '#10b981',
  },
}

const referralChartConfig: ChartConfig = {
  earnings: {
    label: 'Referral Earnings',
    color: '#10b981',
  },
}

const profitChartConfig: ChartConfig = {
  earnings: {
    label: 'Profit Share',
    color: '#f59e0b',
  },
}

const BAR_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24', '#22d3ee', '#06b6d4']

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function SummaryCard({
  title,
  amount,
  icon: Icon,
  change,
  color,
}: {
  title: string
  amount: number
  icon: React.ComponentType<{ className?: string }>
  change?: number
  color: string
}) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`rounded-lg p-2 ${color}`}>
            <Icon className="size-4" />
          </div>
          {change !== undefined && (
            <Badge
              variant="secondary"
              className={`text-xs ${
                change >= 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {change >= 0 ? (
                <ArrowUpRight className="size-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="size-3 mr-0.5" />
              )}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className="text-xl font-bold">{formatCurrency(amount)}</p>
      </CardContent>
    </Card>
  )
}

export function EarningsTab() {
  const { user } = useAppStore()
  const [data, setData] = useState<EarningsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEarnings = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/earnings?userId=${user.id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  // Generate chart data from earnings
  const earningsChartData = (() => {
    if (!data?.earnings.length) {
      // Return sample data if no earnings
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      return days.map((day) => ({ date: day, amount: 0 }))
    }
    // Group earnings by date
    const grouped: Record<string, number> = {}
    data.earnings.forEach((e) => {
      const date = new Date(e.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      grouped[date] = (grouped[date] || 0) + e.amount
    })
    return Object.entries(grouped)
      .slice(-14)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
  })()

  const referralChartData =
    data?.referralByLevel.map((r) => ({
      level: `L${r.level}`,
      earnings: r.earnings,
      percent: r.percent,
    })) || []

  const profitChartData =
    data?.profitShareByLevel.map((p) => ({
      level: `L${p.level}`,
      earnings: p.earnings,
      percent: p.percent,
    })) || []

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const summary = data?.summary || {
    total: 0,
    referral: 0,
    profitShare: 0,
    daily: 0,
    binary: 0,
    bonus: 0,
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          title="Total Earnings"
          amount={summary.total}
          icon={TrendingUp}
          change={12.5}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <SummaryCard
          title="Referral Income"
          amount={summary.referral}
          icon={Users}
          change={8.3}
          color="bg-cyan-500/20 text-cyan-400"
        />
        <SummaryCard
          title="Binary Income"
          amount={summary.binary}
          icon={GitBranch}
          change={4.1}
          color="bg-indigo-500/20 text-indigo-400"
        />
        <SummaryCard
          title="Profit Share"
          amount={summary.profitShare}
          icon={Share2}
          change={-2.1}
          color="bg-amber-500/20 text-amber-400"
        />
        <SummaryCard
          title="Daily Earnings"
          amount={summary.daily}
          icon={Zap}
          change={5.7}
          color="bg-primary/20 text-primary"
        />
        <SummaryCard
          title="Bonus Income"
          amount={summary.bonus}
          icon={Zap}
          change={3.2}
          color="bg-violet-500/20 text-violet-400"
        />
      </div>

      {/* Earnings Trend Chart */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Earnings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={earningsChartConfig} className="h-64 w-full">
            <AreaChart data={earningsChartData}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#earningsGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Referral & Profit Share Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Earnings by Level */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Referral Earnings by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={referralChartConfig} className="h-48 w-full">
              <BarChart data={referralChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="level"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                  {referralChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {referralChartData.map((item, i) => (
                <span key={i} className="text-xs text-muted-foreground">
                  L{item.level.replace('L', '')}: {item.percent}%
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profit Share by Level */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Profit Share by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={profitChartConfig} className="h-48 w-full">
              <BarChart data={profitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="level"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                  {profitChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {profitChartData.map((item, i) => (
                <span key={i} className="text-xs text-muted-foreground">
                  L{item.level.replace('L', '')}: {item.percent}%
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            {data?.earnings.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.earnings.slice(0, 20).map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(earning.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            earning.type === 'referral' || ((earning.type === 'platform_fee' || earning.type === 'rewards' || earning.type === 'charity' || earning.type === 'developer_fee' || earning.type === 'liquidity_pool') && !earning.depositId)
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : earning.type === 'profit_share'
                              ? 'bg-amber-500/20 text-amber-400'
                              : earning.type === 'daily' || ((earning.type === 'platform_fee' || earning.type === 'rewards' || earning.type === 'charity' || earning.type === 'developer_fee' || earning.type === 'liquidity_pool') && earning.depositId)
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {formatEarningType(earning.type, !!earning.depositId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {earning.level ? `Level ${earning.level}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-400">
                        +{formatCurrency(earning.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No earnings yet. Start by making a deposit!
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
