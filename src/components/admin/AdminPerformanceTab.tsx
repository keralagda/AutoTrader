'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  Database,
  Server,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Trash2,
  AlertCircle,
  Cpu,
  FileText,
  Terminal,
  Settings,
  Mail,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'

interface DiagnosticData {
  systemChecker: {
    database: { status: string; latency: number; userCount: number }
    env: Record<string, string>
    ai: { status: string; latency: number; error: string | null }
    filesystem: { status: string; error: string | null }
  }
  logicAnalyzer: {
    issues: Array<{
      planId: string
      planName: string
      category: string
      severity: 'error' | 'warning' | 'info'
      message: string
      recommendation: string
    }>
    status: string
  }
}

const ENTITY_OPTIONS = [
  { id: 'users', label: 'Users & Profile Stats', desc: 'Wipes non-admin users, user stats, KYC, streaks, and check-ins' },
  { id: 'plans', label: 'Plans & Referral Level Rules', desc: 'Wipes investment plans, rules, logics, and PnL configurations' },
  { id: 'deposits', label: 'Deposits / Active Investments', desc: 'Wipes deposit logs, stack positions, and active investments' },
  { id: 'withdrawals', label: 'Withdrawal History', desc: 'Wipes all pending, approved, and completed withdrawal transactions' },
  { id: 'payments', label: 'Payment Records', desc: 'Wipes gateway transaction receipts and pending approvals' },
  { id: 'earnings', label: 'Earnings & Distributions', desc: 'Wipes daily payouts, referral commissions, and bonus records' },
  { id: 'challenges', label: 'Challenges & Badges', desc: 'Wipes challenge configs, badges, and user completions' },
  { id: 'tickets', label: 'Support Tickets', desc: 'Wipes all customer helpdesk tickets and reply logs' },
  { id: 'messages', label: 'Internal Messages', desc: 'Wipes chat system message logs' },
  { id: 'news', label: 'News Feed Articles', desc: 'Wipes published articles and news announcements' },
  { id: 'notifications', label: 'Notifications Logs', desc: 'Wipes system alerts, logs, and fake notification settings' },
  { id: 'testimonials', label: 'User Testimonials', desc: 'Wipes landing page testimonials' },
  { id: 'promotions', label: 'Promotions / Campaigns', desc: 'Wipes active marketing promotions and banners' },
  { id: 'transactions', label: '5W1H Ledger & Transaction Logs', desc: 'Wipes transaction history logs' },
]

export function AdminPerformanceTab() {
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [flushing, setFlushing] = useState(false)
  const [healing, setHealing] = useState(false)
  const [healLogs, setHealLogs] = useState<string[]>([])
  
  // Full Reset State
  const [fullConfirmCode, setFullConfirmCode] = useState('')
  const [fullResetting, setFullResetting] = useState(false)

  // Partial Reset State
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [partialConfirmCode, setPartialConfirmCode] = useState('')
  const [partialResetting, setPartialResetting] = useState(false)

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  const fetchDiagnostics = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/performance')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        toast({ title: 'Diagnostics Failed', description: 'Could not fetch system diagnostic reports.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network Error', description: 'Failed to connect to diagnostics API.', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleFlushCache = async () => {
    setFlushing(true)
    try {
      const res = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flush-cache' })
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast({ title: 'Cache Flushed', description: result.message })
      } else {
        toast({ title: 'Flush Failed', description: result.error || 'Failed to flush cache.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network Error', description: 'Failed to execute cache flush.', variant: 'destructive' })
    } finally {
      setFlushing(false)
    }
  }

  const handleAutoHeal = async () => {
    setHealing(true)
    setHealLogs([])
    try {
      const res = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-heal' })
      })
      const result = await res.json()
      if (res.ok && result.success) {
        setHealLogs(result.logs || [])
        toast({ title: 'Heal Completed', description: result.message })
        fetchDiagnostics()
      } else {
        toast({ title: 'Heal Failed', description: result.error || 'Failed to auto heal issues.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network Error', description: 'Failed to execute auto heal process.', variant: 'destructive' })
    } finally {
      setHealing(false)
    }
  }

  const handleFullReset = async () => {
    if (fullConfirmCode !== 'RESET-BNFX-CONFIRM') {
      toast({ title: 'Validation Error', description: 'Incorrect confirmation code.', variant: 'destructive' })
      return
    }

    if (!confirm('CRITICAL WARNING: This will permanently delete ALL user transactions and accounts (except Admins). Are you absolutely sure you want to proceed?')) {
      return
    }

    setFullResetting(true)
    try {
      const res = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-data',
          type: 'full',
          confirmCode: fullConfirmCode
        })
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast({ title: 'Full Reset Succeeded', description: 'Database cleared to zero state.' })
        setFullConfirmCode('')
        fetchDiagnostics()
      } else {
        toast({ title: 'Reset Failed', description: result.error || 'Full reset failed.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network Error', description: 'Connection failed during reset.', variant: 'destructive' })
    } finally {
      setFullResetting(false)
    }
  }

  const handlePartialReset = async () => {
    if (partialConfirmCode !== 'RESET-PARTIAL-CONFIRM') {
      toast({ title: 'Validation Error', description: 'Incorrect confirmation code.', variant: 'destructive' })
      return
    }

    if (selectedEntities.length === 0) {
      toast({ title: 'Validation Error', description: 'Please select at least one entity to reset.', variant: 'destructive' })
      return
    }

    if (!confirm(`WARNING: You are resetting: ${selectedEntities.join(', ')}. This cannot be undone. Proceed?`)) {
      return
    }

    setPartialResetting(true)
    try {
      const res = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-data',
          type: 'partial',
          confirmCode: partialConfirmCode,
          entities: selectedEntities
        })
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast({ title: 'Partial Reset Succeeded', description: result.message })
        setPartialConfirmCode('')
        setSelectedEntities([])
        fetchDiagnostics()
      } else {
        toast({ title: 'Reset Failed', description: result.error || 'Partial reset failed.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network Error', description: 'Connection failed during partial reset.', variant: 'destructive' })
    } finally {
      setPartialResetting(false)
    }
  }

  const toggleEntitySelection = (id: string) => {
    setSelectedEntities(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedEntities.length === ENTITY_OPTIONS.length) {
      setSelectedEntities([])
    } else {
      setSelectedEntities(ENTITY_OPTIONS.map(o => o.id))
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'healthy': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'degraded': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'warning': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'down': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'error': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Running System diagnostics & logical audits...</p>
      </div>
    )
  }

  const db = data?.systemChecker.database
  const ai = data?.systemChecker.ai
  const fsInfo = data?.systemChecker.filesystem
  const env = data?.systemChecker.env
  const issues = data?.logicAnalyzer.issues || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Performance & Maintenance
          </h2>
          <p className="text-sm text-muted-foreground">
            Audit system code sanity, flush application cache, repair databases, and wipe transactional registries.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDiagnostics} disabled={refreshing} className="gap-2 border-border/50 bg-card/45">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Run Diagnostics
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics & System Checker */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Checker diagnostics */}
          <Card className="bg-card/30 border-border/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                System Checker
              </CardTitle>
              <CardDescription>Direct server integration tests & network trace logs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Component status grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Database */}
                <div className="p-3 rounded-lg border border-border/30 bg-muted/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Database className="h-3.5 w-3.5 text-cyan-400" />
                      Database Connection
                    </span>
                    <Badge variant="outline" className={getStatusBadgeColor(db?.status || 'down')}>
                      {db?.status === 'operational' ? 'Active' : 'Offline'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{db?.latency} ms</p>
                    <p className="text-[10px] text-muted-foreground">Queries resolved. {db?.userCount} Users registered.</p>
                  </div>
                </div>

                {/* AI Gateway */}
                <div className="p-3 rounded-lg border border-border/30 bg-muted/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Cpu className="h-3.5 w-3.5 text-amber-400" />
                      AI Chat Client
                    </span>
                    <Badge variant="outline" className={getStatusBadgeColor(ai?.status || 'not_configured')}>
                      {ai?.status === 'operational' ? 'Connected' : ai?.status === 'not_configured' ? 'Unconfigured' : 'Degraded'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{ai?.status === 'operational' ? `${ai?.latency} ms` : 'N/A'}</p>
                    {ai?.error ? (
                      <p className="text-[10px] text-rose-400 font-mono truncate">{ai.error}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">Groq endpoints responsive.</p>
                    )}
                  </div>
                </div>

                {/* Filesystem */}
                <div className="p-3 rounded-lg border border-border/30 bg-muted/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      Upload Directory
                    </span>
                    <Badge variant="outline" className={getStatusBadgeColor(fsInfo?.status || 'down')}>
                      {fsInfo?.status === 'operational' ? 'Writable' : 'Locked'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-lg font-semibold capitalize">{fsInfo?.status}</p>
                    {fsInfo?.error ? (
                      <p className="text-[10px] text-rose-400 font-mono truncate">{fsInfo.error}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">Permissions validated.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Env Contracts */}
              <div className="mt-4">
                <span className="text-xs font-semibold text-muted-foreground block">Environment Variables Contract</span>
                <div className="mt-2 rounded-lg border border-border/30 bg-muted/5 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/30 bg-card/40 text-muted-foreground font-medium">
                        <th className="p-2">Environment Variable Key</th>
                        <th className="p-2 text-right">Mapping Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {env && Object.entries(env).map(([key, val]) => (
                        <tr key={key}>
                          <td className="p-2 font-mono text-[11px] text-foreground">{key}</td>
                          <td className="p-2 text-right">
                            <span className={`inline-flex items-center gap-1 ${val === 'Configured' ? 'text-emerald-400' : 'text-rose-400 font-medium'}`}>
                              {val === 'Configured' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                              )}
                              {val}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logic Analyzer section */}
          <Card className="bg-card/30 border-border/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    Logic Analyzer
                  </CardTitle>
                  <CardDescription>Audits database records to detect illogical plan splits or commission percentages.</CardDescription>
                </div>
                <Badge variant="outline" className={getStatusBadgeColor(data?.logicAnalyzer.status || 'healthy')}>
                  {data?.logicAnalyzer.status === 'healthy' ? 'Configuration Healthy' : data?.logicAnalyzer.status === 'warning' ? 'Suggestions Available' : 'Logic Errors Found'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {issues.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div>
                    <span className="font-semibold block">All plan configurations are valid!</span>
                    No allocation overlaps, commission excesses, or limits bounds violations detected.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {issues.map((issue, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-xs flex flex-col gap-2 ${
                      issue.severity === 'error' 
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' 
                        : issue.severity === 'warning'
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                        : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                          Plan: {issue.planName}
                        </span>
                        <Badge className={`${
                          issue.severity === 'error' 
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                            : issue.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        } text-[9px] uppercase font-bold`}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-foreground/90">{issue.message}</p>
                      <div className="mt-1 p-2 rounded bg-black/20 border border-white/[0.03]">
                        <span className="font-semibold block text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Recommendation</span>
                        {issue.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Maintenance Operations Control */}
        <div className="space-y-6">
          <Card className="bg-card/30 border-border/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-400" />
                Operations Control
              </CardTitle>
              <CardDescription>Flush temporary caches and trigger self-healing modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cache Flush */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Flush System Cache</h4>
                    <p className="text-[10px] text-muted-foreground">Invalidates Next.js ISR pages & drops cached settings.</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleFlushCache} 
                    disabled={flushing}
                    className="border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {flushing ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : <Flame className="h-3 w-3 mr-1.5" />}
                    Flush Cache
                  </Button>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Auto Heal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Auto Heal Database</h4>
                    <p className="text-[10px] text-muted-foreground">Scans and corrects missing stats, default settings, or orphans.</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAutoHeal} 
                    disabled={healing}
                    className="border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/10"
                  >
                    {healing ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : <Zap className="h-3 w-3 mr-1.5" />}
                    Heal Issues
                  </Button>
                </div>

                {/* Auto Heal Logs */}
                {healLogs.length > 0 && (
                  <div className="p-2 rounded bg-black/40 border border-border/30 space-y-1 max-h-[120px] overflow-y-auto pr-1">
                    <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-wider mb-1">
                      <Terminal className="h-3 w-3" />
                      Execution log:
                    </div>
                    {healLogs.map((log, lidx) => (
                      <p key={lidx} className="font-mono text-[9px] text-foreground/80 leading-relaxed border-l border-indigo-500/20 pl-2">
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick info panel */}
          <Card className="bg-card/30 border-border/50 backdrop-blur-md p-4 space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              SMTP Mail Diagnostics
            </h4>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Ensure platform email notification delivery is functioning. To send templates or diagnostic messages, use the main 
              <span className="text-emerald-400 font-medium"> Email Diagnostics</span> tab under Settings.
            </p>
          </Card>
        </div>
      </div>

      {/* Database Reset Console (Full Width / Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Database Reset Card */}
        <Card className="bg-card/30 border-rose-500/20 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-rose-400">
              <ShieldAlert className="h-4 w-4" />
              Full Database Reset
            </CardTitle>
            <CardDescription className="text-rose-400/70">Wipe all transactions, stats, and non-admin profiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300 space-y-1">
              <p className="font-semibold">⚠️ CRITICAL DESTRUCTIVE WARNING:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Permanently deletes all Deposits, Withdrawals, Earnings, and Payments records.</li>
                <li>Deletes all user accounts (excluding admin roles).</li>
                <li>Resets all Admin user wallet balances to zero USD.</li>
                <li>Preserves system configurations, plans, and settings tables.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confirm Code Verification</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type: RESET-BNFX-CONFIRM"
                  value={fullConfirmCode}
                  onChange={(e) => setFullConfirmCode(e.target.value)}
                  className="bg-black/25 border-rose-500/20 text-xs font-mono"
                />
                <Button
                  variant="destructive"
                  onClick={handleFullReset}
                  disabled={fullResetting || fullConfirmCode !== 'RESET-BNFX-CONFIRM'}
                  className="bg-rose-600 hover:bg-rose-500 text-xs font-semibold gap-1.5 px-4"
                >
                  {fullResetting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Execute Full Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partial Database Reset Card */}
        <Card className="bg-card/30 border-amber-500/20 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-400">
              <Trash2 className="h-4 w-4" />
              Partial Entity Reset
            </CardTitle>
            <CardDescription className="text-amber-400/70">Wipe selected database tables individually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                Select Database Registries ({selectedEntities.length} chosen)
              </span>
              <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-[10px] text-primary h-6 px-2 hover:bg-white/5">
                {selectedEntities.length === ENTITY_OPTIONS.length ? 'Clear Selection' : 'Select All'}
              </Button>
            </div>

            {/* Checkboxes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto border border-border/30 rounded-lg p-3 bg-black/20 pr-1">
              {ENTITY_OPTIONS.map((entity) => (
                <div key={entity.id} className="flex items-start gap-2.5 space-y-0">
                  <Checkbox
                    id={`checkbox-${entity.id}`}
                    checked={selectedEntities.includes(entity.id)}
                    onCheckedChange={() => toggleEntitySelection(entity.id)}
                    className="mt-0.5 border-border/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-600 data-[state=checked]:text-black"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <label htmlFor={`checkbox-${entity.id}`} className="text-xs font-semibold text-foreground cursor-pointer select-none">
                      {entity.label}
                    </label>
                    <p className="text-[9px] text-muted-foreground">{entity.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confirm Code Verification</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type: RESET-PARTIAL-CONFIRM"
                  value={partialConfirmCode}
                  onChange={(e) => setPartialConfirmCode(e.target.value)}
                  className="bg-black/25 border-amber-500/20 text-xs font-mono"
                />
                <Button
                  onClick={handlePartialReset}
                  disabled={partialResetting || partialConfirmCode !== 'RESET-PARTIAL-CONFIRM' || selectedEntities.length === 0}
                  className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold gap-1.5 px-4"
                >
                  {partialResetting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Reset Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
