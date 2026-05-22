'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Clock, Play, RefreshCw, CheckCircle } from 'lucide-react'

interface CronStatus {
  lastRun: any
  lastRunAt: string | null
  activeDeposits: number
  dueDeposits: number
}

export function AdminCronTab() {
  const { toast } = useToast()
  const [status, setStatus] = useState<CronStatus | null>(null)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const fetchStatus = () => {
    fetch('/api/cron/distribute-profits')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})
  }

  useEffect(() => { fetchStatus() }, [])

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

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Scheduled Profit Distribution (Cron)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchStatus} className="gap-1.5">
                <RefreshCw className="size-3.5" /> Refresh
              </Button>
              <Button size="sm" onClick={handleRunCron} disabled={running} className="gap-1.5">
                <Play className="size-3.5" /> {running ? 'Running...' : 'Run Now'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            This processes all active deposits and credits profits based on each plan&apos;s return schedule (hourly/daily/weekly/monthly).
            In production, set up a cron job to call <code className="bg-muted px-1 rounded">POST /api/cron/distribute-profits</code> at your desired interval.
          </p>

          {/* Status Cards */}
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
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Last Credited</p>
              <p className="text-sm font-bold text-emerald-400">${status?.lastRun?.credited || '0.00'}</p>
            </div>
          </div>

          {/* Last Run Result */}
          {lastResult && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="size-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Last Execution Result</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground">Processed:</span> <span className="font-bold">{lastResult.processed}</span></div>
                <div><span className="text-muted-foreground">Credited:</span> <span className="font-bold text-emerald-400">${lastResult.totalCredited}</span></div>
                <div><span className="text-muted-foreground">Completed:</span> <span className="font-bold">{lastResult.completed}</span></div>
                <div><span className="text-muted-foreground">Capital Returned:</span> <span className="font-bold">{lastResult.capitalReturned}</span></div>
              </div>
            </div>
          )}

          {/* Plan Return Types Info */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
            <h4 className="text-xs font-medium mb-2">Supported Return Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
              <Badge variant="outline">Hourly (1h)</Badge>
              <Badge variant="outline">Daily (24h)</Badge>
              <Badge variant="outline">Weekly (168h)</Badge>
              <Badge variant="outline">Monthly (720h)</Badge>
              <Badge variant="outline">After End</Badge>
            </div>
            <h4 className="text-xs font-medium mt-3 mb-2">Capital Return Options</h4>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded bg-background/50"><span className="font-medium">Included</span> — Principal is part of total profit</div>
              <div className="p-2 rounded bg-background/50"><span className="font-medium">End</span> — Return principal when plan ends</div>
              <div className="p-2 rounded bg-background/50"><span className="font-medium">None</span> — Principal is not returned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
