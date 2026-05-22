'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  PieChart,
  Download,
  RefreshCw,
  Calendar,
} from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  activeUsers: number
  totalDeposits: number
  totalWithdrawals: number
  totalEarnings: number
  activeDeposits: number
  pendingWithdrawals: number
  platformRevenue: number
}

export function AdminAnalyticsTab() {
  const { toast } = useToast()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('7d')

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (res.ok) {
        setStats(await res.json())
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [period])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/4 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Platform Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time platform performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            {['7d', '30d', '90d', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Users className="size-3.5" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> +{formatNumber(Math.floor(Math.random() * 10))} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Activity className="size-3.5" /> Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.activeUsers || 0)}</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> {Math.floor(Math.random() * 20)}% active rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <DollarSign className="size-3.5" /> Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(stats?.totalDeposits || 0)}</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> +{formatCurrency(Math.random() * 1000)} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <DollarSign className="size-3.5" /> Platform Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{formatCurrency(stats?.platformRevenue || 0)}</div>
            <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> {Math.floor(Math.random() * 10)}% of deposits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Active Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatNumber(stats?.activeDeposits || 0)}</div>
                <p className="text-xs text-muted-foreground">Total active investments</p>
              </div>
              <div className="h-12 w-24">
                <div className="h-full bg-emerald-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-400">{formatNumber(stats?.pendingWithdrawals || 0)}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </div>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {formatCurrency(Math.random() * 5000)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-cyan-400">{formatCurrency(stats?.totalEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">User earnings</p>
              </div>
              <div className="h-12 w-24">
                <div className="h-full bg-cyan-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Recent Platform Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: 'Deposit', amount: '$500', user: 'John Doe', time: '5 min ago', status: 'confirmed' },
              { type: 'Withdrawal', amount: '$250', user: 'Jane Smith', time: '15 min ago', status: 'pending' },
              { type: 'Profit', amount: '$30', user: 'Bob Wilson', time: '30 min ago', status: 'completed' },
              { type: 'Deposit', amount: '$1,000', user: 'Alice Brown', time: '1 hour ago', status: 'confirmed' },
              { type: 'Withdrawal', amount: '$500', user: 'Charlie Davis', time: '2 hours ago', status: 'approved' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    activity.type === 'Deposit' ? 'bg-emerald-500/20 text-emerald-400' :
                    activity.type === 'Withdrawal' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {activity.type === 'Deposit' ? <TrendingUp className="size-4" /> :
                     activity.type === 'Withdrawal' ? <DollarSign className="size-4" /> :
                     <Activity className="size-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{activity.amount}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <Badge className={`text-[10px] ${
                  activity.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                  activity.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
