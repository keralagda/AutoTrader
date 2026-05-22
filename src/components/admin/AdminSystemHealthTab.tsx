'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  Database,
  Server,
  CreditCard,
  Bell,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Clock,
  DollarSign,
  Shield,
  LifeBuoy,
  Loader2,
  Download,
} from 'lucide-react'

interface SystemHealth {
  status: string
  uptime: number
  timestamp: string
  metrics: {
    totalUsers: number
    activeUsers24h: number
    totalActiveDeposits: number
    pendingWithdrawals: number
    pendingKYC: number
    openTickets: number
    recentTransactionsPerHour: number
    totalEarningsDistributed: number
    platformLiability: number
  }
  services: {
    database: string
    api: string
    payments: string
    notifications: string
  }
}

export function AdminSystemHealthTab() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadHealth()
    const interval = setInterval(loadHealth, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const loadHealth = async () => {
    try {
      const res = await fetch('/api/admin/system-health')
      if (res.ok) {
        const data = await res.json()
        setHealth(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadHealth()
  }

  const handleExport = (type: string) => {
    window.open(`/api/admin/export?type=${type}`, '_blank')
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${mins}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-amber-400" />
      case 'down': return <XCircle className="h-4 w-4 text-rose-400" />
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'degraded': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'down': return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!health) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load system health</p>
        <Button onClick={handleRefresh} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Health
          </h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(health.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(health.status === 'healthy' ? 'operational' : health.status)}>
            {health.status === 'healthy' ? 'All Systems Operational' : 'Degraded'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Services Status */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(health.services).map(([service, status]) => (
              <div key={service} className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border/30">
                {getStatusIcon(status)}
                <div>
                  <p className="text-sm font-medium capitalize">{service}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{health.metrics.totalUsers}</p>
            <p className="text-xs text-emerald-400">{health.metrics.activeUsers24h} active today</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Active Deposits</span>
            </div>
            <p className="text-2xl font-bold">${health.metrics.totalActiveDeposits.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total invested</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold">{health.metrics.pendingWithdrawals}</p>
            <p className="text-xs text-amber-400">Withdrawals awaiting</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-muted-foreground">Transactions/hr</span>
            </div>
            <p className="text-2xl font-bold">{health.metrics.recentTransactionsPerHour}</p>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Financials */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Platform Financials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium">Total Earnings Distributed</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                ${health.metrics.totalEarningsDistributed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-xs text-cyan-400 font-medium">Platform Liability</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">
                ${health.metrics.platformLiability.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-xs text-violet-400 font-medium">Server Uptime</p>
              <p className="text-xl font-bold text-violet-400 mt-1">
                {formatUptime(health.uptime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Action Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {health.metrics.pendingWithdrawals > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-sm">{health.metrics.pendingWithdrawals} pending withdrawal(s)</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Action Required</Badge>
            </div>
          )}
          {health.metrics.pendingKYC > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-sm">{health.metrics.pendingKYC} KYC verification(s) pending</span>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Review</Badge>
            </div>
          )}
          {health.metrics.openTickets > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-violet-400" />
                <span className="text-sm">{health.metrics.openTickets} open support ticket(s)</span>
              </div>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Respond</Badge>
            </div>
          )}
          {health.metrics.pendingWithdrawals === 0 && health.metrics.pendingKYC === 0 && health.metrics.openTickets === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">All caught up! No pending actions.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" onClick={() => handleExport('users')} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Users CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('deposits')} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Deposits CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('withdrawals')} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Withdrawals CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('transactions')} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Transactions CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
