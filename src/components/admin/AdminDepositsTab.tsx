'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Payment { id: string; userId: string; amount: number; method: string; status: string; createdAt: string; user?: { name: string; email: string } }

export function AdminDepositsTab() {
  const { toast } = useToast()
  const { user } = useAppStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [requireConfirmation, setRequireConfirmation] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/deposits').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([pays, settings]) => {
      if (Array.isArray(pays)) setPayments(pays)
      const confirmSetting = Array.isArray(settings) ? settings.find((s: any) => s.key === 'require_deposit_confirmation') : null
      setRequireConfirmation(confirmSetting?.value === 'true')
    }).catch(() => {})
  }, [])

  const handleToggleConfirmation = async (enabled: boolean) => {
    setRequireConfirmation(enabled)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'require_deposit_confirmation', value: enabled ? 'true' : 'false' }),
    })
    toast({ title: enabled ? 'Manual confirmation enabled' : 'Auto-confirm enabled' })
  }

  const handleAction = async (paymentId: string, action: 'confirm' | 'reject') => {
    const res = await fetch('/api/admin/deposits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, action, adminId: user?.id }),
    })
    if (res.ok) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: action === 'confirm' ? 'confirmed' : 'failed' } : p))
      toast({ title: `Deposit ${action === 'confirm' ? 'confirmed' : 'rejected'}` })
      window.dispatchEvent(new Event('admin-stats-refresh'))
    }
  }

  const pending = payments.filter(p => p.status === 'pending')
  const confirmed = payments.filter(p => p.status === 'confirmed')
  const rejected = payments.filter(p => p.status === 'failed')

  const statusBadge = (s: string) => s === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : s === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Deposit Confirmation Mode</p>
            <p className="text-xs text-muted-foreground">When enabled, deposits require manual admin approval before crediting the user&apos;s wallet.</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">{requireConfirmation ? 'Manual' : 'Auto'}</Label>
            <Switch checked={requireConfirmation} onCheckedChange={handleToggleConfirmation} />
          </div>
        </CardContent>
      </Card>

      {/* Deposits */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="size-4 text-primary" />Deposit Management</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            </TabsList>
            {['pending', 'confirmed', 'rejected'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {(tab === 'pending' ? pending : tab === 'confirmed' ? confirmed : rejected).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div>
                      <p className="text-sm font-medium">{p.user?.name || 'Unknown'} <span className="text-muted-foreground text-xs">({p.user?.email})</span></p>
                      <p className="text-xs text-muted-foreground">${p.amount.toFixed(2)} via {p.method} • {new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusBadge(p.status)}>{p.status}</Badge>
                      {p.status === 'pending' && (
                        <>
                          <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => handleAction(p.id, 'confirm')}><CheckCircle className="size-3" />Confirm</Button>
                          <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs" onClick={() => handleAction(p.id, 'reject')}><XCircle className="size-3" />Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {(tab === 'pending' ? pending : tab === 'confirmed' ? confirmed : rejected).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">No {tab} deposits</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
