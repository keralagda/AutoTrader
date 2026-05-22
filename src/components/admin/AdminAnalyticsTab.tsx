'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  activeUsers: number
  totalDeposits: number
  platformRevenue: number
  netRevenue: number
  pendingWithdrawals: number
  completedWithdrawals: number
  totalEarningsDistributed: number
  newUsersInPeriod: number
  recentActivity: { id: string; action: string; details: any; createdAt: string }[]
}

export function AdminAnalyticsTab() {
  const { toast } = useToast()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (res.ok) {
        setStats(await res.json())
      } else {
        toast({ title: 'Failed to load analytics', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [period])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num)

  const handleExport = () => {
    window.open('/api/admin/export?type=transactions', '_blank')
  }

  const getActivityLabel = (action: string) => {
    const labels: Record<string, string> = {
      cron_profit_distribution: 'Profit Distribution',
      withdrawal_completed: 'Withdrawal Completed',
      withdrawal_rejected: 'Withdrawal Rejected',
      password_changed: 'Password Changed',
      password_reset: 'Password Reset',
      account_deleted: 'Account Deleted',
      bank_transfer_submitted: 'Bank Transfer',
      bulk_add_balance: 'Bulk Add Balance',
      bulk_send_notification: 'Bulk Notification',
    }
    return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Platform Analytics</h2>
          <p className="text-sm text-muted-foreground">Real-time performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {(['7d', '30d', '90d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'all' ? 'ALL' : p.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats}><RefreshCw className="size-3.5" /></Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5"><Download className="size-3.5" /> Export</Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</p>
            <p className="text-xs text-emerald-400 mt-1">+{stats?.newUsersInPeriod || 0} this period</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="size-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Active Investors</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(stats?.activeUsers || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="size-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total Deposits</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats?.totalDeposits || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="size-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Net Revenue</span>
            </div>
            <p className={`text-2xl font-bold ${(stats?.netRevenue || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(stats?.netRevenue || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Deposits - Payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="size-4 text-rose-400" />
              <span className="text-sm font-medium">Withdrawals Completed</span>
            </div>
            <p className="text-xl font-bold text-rose-400">{formatCurrency(stats?.completedWithdrawals || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-amber-400" />
              <span className="text-sm font-medium">Pending Withdrawals</span>
            </div>
            <p className="text-xl font-bold text-amber-400">{formatCurrency(stats?.pendingWithdrawals || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-cyan-400" />
              <span className="text-sm font-medium">Earnings Distributed</span>
            </div>
            <p className="text-xl font-bold text-cyan-400">{formatCurrency(stats?.totalEarningsDistributed || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (Real Data) */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Recent Platform Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{getActivityLabel(activity.action)}</p>
                      {activity.details && (
                        <p className="text-xs text-muted-foreground">
                          {activity.details.credited ? `$${activity.details.credited} credited` : ''}
                          {activity.details.processed ? ` • ${activity.details.processed} processed` : ''}
                          {activity.details.amount ? `$${activity.details.amount}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
