'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { ShieldCheck, CheckCircle, XCircle, Clock } from 'lucide-react'

interface KycEntry { id: string; userId: string; documentType: string; documentNumber: string | null; status: string; rejectionReason: string | null; submittedAt: string; user?: { name: string; email: string } }

export function AdminKycTab() {
  const { toast } = useToast()
  const { user } = useAppStore()
  const [entries, setEntries] = useState<KycEntry[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  useEffect(() => { fetch('/api/admin/kyc').then(r => r.json()).then(data => { if (Array.isArray(data)) setEntries(data) }).catch(() => {}) }, [])

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch('/api/admin/kyc', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, rejectionReason: status === 'rejected' ? rejectReason : null, reviewedBy: user?.id }) })
    if (res.ok) { setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e)); toast({ title: `KYC ${status}` }); setRejectingId(null); setRejectReason('') }
  }

  const statusBadge = (s: string) => s === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : s === 'rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />KYC Verifications ({entries.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {entries.map(e => (
              <div key={e.id} className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.user?.name} <span className="text-muted-foreground text-xs">({e.user?.email})</span></p>
                    <p className="text-xs text-muted-foreground">Document: {e.documentType} {e.documentNumber && `• ${e.documentNumber}`}</p>
                    <p className="text-[10px] text-muted-foreground">Submitted: {new Date(e.submittedAt).toLocaleString()}</p>
                  </div>
                  <Badge className={`${statusBadge(e.status)}`}>{e.status}</Badge>
                </div>
                {e.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(e.id, 'approved')}><CheckCircle className="size-3.5" />Approve</Button>
                    {rejectingId === e.id ? (
                      <div className="flex gap-2 flex-1">
                        <Input placeholder="Rejection reason" value={rejectReason} onChange={ev => setRejectReason(ev.target.value)} className="text-xs" />
                        <Button size="sm" variant="destructive" onClick={() => handleAction(e.id, 'rejected')}>Reject</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => setRejectingId(e.id)}><XCircle className="size-3.5" />Reject</Button>
                    )}
                  </div>
                )}
                {e.rejectionReason && <p className="text-xs text-rose-400">Reason: {e.rejectionReason}</p>}
              </div>
            ))}
            {entries.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">No KYC submissions yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
