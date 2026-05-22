'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollText } from 'lucide-react'

interface LogEntry { id: string; userId: string | null; action: string; details: string | null; ipAddress: string | null; createdAt: string }

export function AdminActivityLogTab() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch(`/api/admin/activity-log?page=${page}&limit=50`).then(r => r.json()).then(data => { setLogs(Array.isArray(data.logs) ? data.logs : []); setTotal(data.total || 0) }).catch(() => {})
  }, [page])

  const actionColor = (action: string) => {
    if (action.includes('approved')) return 'bg-emerald-500/20 text-emerald-400'
    if (action.includes('rejected') || action.includes('banned')) return 'bg-rose-500/20 text-rose-400'
    if (action.includes('added') || action.includes('created')) return 'bg-cyan-500/20 text-cyan-400'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><ScrollText className="size-4 text-primary" />Activity Log ({total})</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={actionColor(log.action)} variant="outline">{log.action}</Badge>
                  {log.userId && <span className="text-[10px] text-muted-foreground">by {log.userId.slice(0, 8)}...</span>}
                </div>
                {log.details && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.details}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">No activity logged yet</p>}
        </div>
        {total > 50 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border/30">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground self-center">Page {page} of {Math.ceil(total / 50)}</span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
