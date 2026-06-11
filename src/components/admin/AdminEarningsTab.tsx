'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Loader2, TrendingUp, Clock } from 'lucide-react'

interface PendingDeposit {
  id: string
  amount: number
  riskLevel: string
  createdAt: string
  user: { id: string; name: string; email: string }
  plan: { name: string; dailyEarningPercent: number }
}

export function AdminEarningsTab() {
  const { toast } = useToast()
  const [pending, setPending] = useState<PendingDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/earnings?action=pending-investments')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPending(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (depositId: string, action: 'approve' | 'reject') => {
    setProcessing(depositId)
    try {
      const res = await fetch('/api/admin/earnings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, action }),
      })
      if (res.ok) {
        toast({ title: `Investment ${action}d` })
        setPending(prev => prev.filter(d => d.id !== depositId))
        window.dispatchEvent(new Event('admin-stats-refresh'))
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="size-5 text-primary" />Investment Approvals</h2>
        <p className="text-sm text-muted-foreground mt-1">{pending.length} pending investment(s) awaiting approval</p>
      </div>

      {pending.length === 0 ? (
        <Card className="border-border/50"><CardContent className="p-8 text-center text-muted-foreground">No pending investments</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pending.map(dep => (
            <Card key={dep.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{dep.user.name} <span className="text-muted-foreground">({dep.user.email})</span></p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{dep.plan.name}</Badge>
                      <span className="text-sm font-bold" dir="ltr">${dep.amount.toFixed(2)}</span>
                      <Badge className="text-[9px]" variant="outline">{dep.riskLevel} risk</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="size-3" />{new Date(dep.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-rose-400 border-rose-500/30" onClick={() => handleAction(dep.id, 'reject')} disabled={processing === dep.id}>
                      <XCircle className="size-3.5 mr-1" />Reject
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction(dep.id, 'approve')} disabled={processing === dep.id}>
                      {processing === dep.id ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <CheckCircle className="size-3.5 mr-1" />}Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
