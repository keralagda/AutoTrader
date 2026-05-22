'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  Clock,
  Play,
  RefreshCw,
  CheckCircle,
  Globe,
  Zap,
  Pause,
  Trash2,
  Plus,
  ExternalLink,
  Loader2,
  AlertTriangle,
  History,
} from 'lucide-react'

interface CronStatus {
  lastRun: any
  lastRunAt: string | null
  activeDeposits: number
  dueDeposits: number
}

interface CronJob {
  jobId: number
  title: string
  url: string
  enabled: boolean
  schedule: any
  lastExecution?: number
  nextExecution?: number
}

interface JobHistory {
  jobHistoryId: number
  date: number
  duration: number
  status: number
  httpStatus: number
}

export function AdminCronTab() {
  const { toast } = useToast()
  const [status, setStatus] = useState<CronStatus | null>(null)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [creating, setCreating] = useState(false)
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([])
  const [showHistory, setShowHistory] = useState<number | null>(null)

  // New job form
  const [newJobUrl, setNewJobUrl] = useState('')
  const [newJobTitle, setNewJobTitle] = useState('Auto Trade - Profit Distribution')
  const [newJobSchedule, setNewJobSchedule] = useState('hourly')

  const fetchStatus = () => {
    fetch('/api/cron/distribute-profits')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})
  }

  const fetchCronJobs = async () => {
    setLoadingJobs(true)
    try {
      const res = await fetch('/api/admin/cronjob-org')
      if (res.ok) {
        const data = await res.json()
        setCronJobs(data.jobs || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchCronJobs()
  }, [])

  const handleRunCron = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/cron/distribute-profits', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLastResult(data)
        toast({ title: `Profits distributed! ${data.processed} deposits processed, $${data.totalCredited} credited.` })
        fetchStatus()
      } else {
        const data = await res.json()
        toast({ title: 'Cron failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  const handleCreateJob = async () => {
    if (!newJobUrl && !newJobTitle) {
      toast({ title: 'Please provide a URL or use default', variant: 'destructive' })
      return
    }

    setCreating(true)

    // Build schedule based on selection
    let schedule: any
    switch (newJobSchedule) {
      case 'every5min':
        schedule = { timezone: 'Asia/Kolkata', hours: [-1], mdays: [-1], minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], months: [-1], wdays: [-1] }
        break
      case 'every15min':
        schedule = { timezone: 'Asia/Kolkata', hours: [-1], mdays: [-1], minutes: [0, 15, 30, 45], months: [-1], wdays: [-1] }
        break
      case 'every30min':
        schedule = { timezone: 'Asia/Kolkata', hours: [-1], mdays: [-1], minutes: [0, 30], months: [-1], wdays: [-1] }
        break
      case 'hourly':
        schedule = { timezone: 'Asia/Kolkata', hours: [-1], mdays: [-1], minutes: [0], months: [-1], wdays: [-1] }
        break
      case 'every6h':
        schedule = { timezone: 'Asia/Kolkata', hours: [0, 6, 12, 18], mdays: [-1], minutes: [0], months: [-1], wdays: [-1] }
        break
      case 'daily':
        schedule = { timezone: 'Asia/Kolkata', hours: [0], mdays: [-1], minutes: [0], months: [-1], wdays: [-1] }
        break
      default:
        schedule = { timezone: 'Asia/Kolkata', hours: [-1], mdays: [-1], minutes: [0], months: [-1], wdays: [-1] }
    }

    try {
      const res = await fetch('/api/admin/cronjob-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: newJobTitle,
          url: newJobUrl || undefined,
          schedule,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Cron job created on cron-job.org!' })
        fetchCronJobs()
        setNewJobUrl('')
      } else {
        toast({ title: 'Failed to create job', description: data.error || data.details, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleJob = async (jobId: number, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/cronjob-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', jobId, enabled }),
      })
      if (res.ok) {
        toast({ title: enabled ? 'Job enabled' : 'Job paused' })
        fetchCronJobs()
      }
    } catch {
      toast({ title: 'Failed to update job', variant: 'destructive' })
    }
  }

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this cron job?')) return
    try {
      const res = await fetch('/api/admin/cronjob-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', jobId }),
      })
      if (res.ok) {
        toast({ title: 'Job deleted' })
        fetchCronJobs()
      }
    } catch {
      toast({ title: 'Failed to delete job', variant: 'destructive' })
    }
  }

  const handleViewHistory = async (jobId: number) => {
    if (showHistory === jobId) {
      setShowHistory(null)
      return
    }
    setShowHistory(jobId)
    try {
      const res = await fetch('/api/admin/cronjob-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'history', jobId }),
      })
      if (res.ok) {
        const data = await res.json()
        setJobHistory(data.history || [])
      }
    } catch {
      setJobHistory([])
    }
  }

  const getScheduleLabel = (schedule: any) => {
    if (!schedule) return 'Unknown'
    const { hours, minutes } = schedule
    if (Array.isArray(hours) && hours[0] === -1 && Array.isArray(minutes)) {
      if (minutes.length === 12) return 'Every 5 minutes'
      if (minutes.length === 4) return 'Every 15 minutes'
      if (minutes.length === 2) return 'Every 30 minutes'
      if (minutes.length === 1) return 'Every hour'
    }
    if (Array.isArray(hours) && hours.length === 4) return 'Every 6 hours'
    if (Array.isArray(hours) && hours.length === 1 && hours[0] !== -1) return 'Daily'
    return 'Custom'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Cron Job Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Managed via <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">cron-job.org <ExternalLink className="h-3 w-3" /></a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchStatus(); fetchCronJobs() }} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={handleRunCron} disabled={running} className="gap-1.5">
            <Play className="size-3.5" /> {running ? 'Running...' : 'Run Manually'}
          </Button>
        </div>
      </div>

      {/* Local Status */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Profit Distribution Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Active Deposits</p>
              <p className="text-xl font-bold">{status?.activeDeposits || 0}</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
              <p className="text-xs text-muted-foreground">Due for Profit</p>
              <p className="text-xl font-bold text-amber-400">{status?.dueDeposits || 0}</p>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Last Run</p>
              <p className="text-xs font-medium">{status?.lastRunAt ? new Date(status.lastRunAt).toLocaleString() : 'Never'}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <p className="text-xs text-muted-foreground">Last Credited</p>
              <p className="text-sm font-bold text-emerald-400">${status?.lastRun?.credited || '0.00'}</p>
            </div>
          </div>

          {lastResult && (
            <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="size-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Manual Run Result</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground">Processed:</span> <span className="font-bold">{lastResult.processed}</span></div>
                <div><span className="text-muted-foreground">Credited:</span> <span className="font-bold text-emerald-400">${lastResult.totalCredited}</span></div>
                <div><span className="text-muted-foreground">Completed:</span> <span className="font-bold">{lastResult.completed}</span></div>
                <div><span className="text-muted-foreground">Capital Returned:</span> <span className="font-bold">{lastResult.capitalReturned}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* cron-job.org Jobs */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            cron-job.org Scheduled Jobs
          </CardTitle>
          <CardDescription>
            External cron jobs that call your profit distribution endpoint automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingJobs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cronJobs.length === 0 ? (
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No cron jobs configured yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create one below to automate profit distribution</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cronJobs.map(job => (
                <div key={job.jobId} className="rounded-lg border border-border/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={job.enabled}
                        onCheckedChange={(checked) => handleToggleJob(job.jobId, checked)}
                      />
                      <div>
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">{job.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={job.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
                        {job.enabled ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getScheduleLabel(job.schedule)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewHistory(job.jobId)} className="gap-1.5 text-xs">
                      <History className="h-3 w-3" /> History
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteJob(job.jobId)} className="gap-1.5 text-xs text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>

                  {/* Job History */}
                  {showHistory === job.jobId && jobHistory.length > 0 && (
                    <div className="mt-2 rounded-lg bg-muted/20 p-3 space-y-1">
                      <p className="text-xs font-medium mb-2">Recent Executions</p>
                      {jobHistory.slice(0, 10).map(h => (
                        <div key={h.jobHistoryId} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(h.date * 1000).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{h.duration}ms</span>
                            <Badge className={h.httpStatus === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}>
                              {h.httpStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Create New Job */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Cron Job
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="Auto Trade - Profit Distribution"
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={newJobSchedule} onValueChange={setNewJobSchedule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every5min">Every 5 minutes</SelectItem>
                    <SelectItem value="every15min">Every 15 minutes</SelectItem>
                    <SelectItem value="every30min">Every 30 minutes</SelectItem>
                    <SelectItem value="hourly">Every hour</SelectItem>
                    <SelectItem value="every6h">Every 6 hours</SelectItem>
                    <SelectItem value="daily">Daily (midnight)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endpoint URL (leave empty for default)</Label>
              <Input
                value={newJobUrl}
                onChange={(e) => setNewJobUrl(e.target.value)}
                placeholder="https://your-domain.com/api/cron/distribute-profits"
              />
              <p className="text-[10px] text-muted-foreground">
                Default: Your app&apos;s <code>/api/cron/distribute-profits</code> endpoint. Set your production URL here when deployed.
              </p>
            </div>

            <Button onClick={handleCreateJob} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? 'Creating...' : 'Create Cron Job on cron-job.org'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">How it works</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>cron-job.org calls your <code className="bg-muted px-1 rounded">/api/cron/distribute-profits</code> endpoint on schedule</li>
                <li>The endpoint processes all active deposits and credits profits based on plan schedules</li>
                <li>Referral commissions are distributed to upline (7 levels)</li>
                <li>Completed plans return capital and mark deposits as ended</li>
              </ol>
              <p className="mt-2">
                <strong>Security:</strong> The endpoint is protected with <code className="bg-muted px-1 rounded">x-cron-secret</code> header.
                cron-job.org sends this header automatically with each request.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
