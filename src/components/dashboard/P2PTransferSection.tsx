'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Send, ArrowUpRight, ArrowDownLeft, Loader2, Users } from 'lucide-react'

interface Transfer {
  id: string
  amount: number
  note: string | null
  createdAt: string
  sender: { name: string; email: string }
  receiver: { name: string; email: string }
}

export function P2PTransferSection() {
  const { user, updateUserWallets } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [transfers, setTransfers] = useState<{ sent: Transfer[]; received: Transfer[] }>({ sent: [], received: [] })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ email: '', amount: '', note: '' })

  useEffect(() => {
    if (!user?.id) return
    loadTransfers()
  }, [user?.id])

  const loadTransfers = async () => {
    try {
      const res = await fetch(`/api/p2p-transfer?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setTransfers(data)
      }
    } catch {} finally { setLoading(false) }
  }

  const handleSend = async () => {
    if (!form.email || !form.amount) {
      toast({ title: 'Email and amount are required', variant: 'destructive' })
      return
    }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' })
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/p2p-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          receiverEmail: form.email,
          amount,
          note: form.note || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Transfer sent!', description: `$${amount.toFixed(2)} sent successfully` })
        setForm({ email: '', amount: '', note: '' })
        setOpen(false)
        loadTransfers()
        // Refresh balances
        const meRes = await fetch(`/api/auth/me?userId=${user?.id}`)
        if (meRes.ok) {
          const meData = await meRes.json()
          updateUserWallets(meData.tradingBalance, meData.withdrawalBalance)
        }
      } else {
        toast({ title: data.error || 'Transfer failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const allTransfers = [
    ...transfers.sent.map(t => ({ ...t, direction: 'sent' as const })),
    ...transfers.received.map(t => ({ ...t, direction: 'received' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              P2P Transfers
            </CardTitle>
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allTransfers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transfers yet</p>
          ) : (
            <div className="space-y-2">
              {allTransfers.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2">
                    {t.direction === 'sent' ? (
                      <ArrowUpRight className="h-4 w-4 text-rose-400" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                    )}
                    <div>
                      <p className="text-xs font-medium">
                        {t.direction === 'sent' ? `To ${t.receiver.name}` : `From ${t.sender.name}`}
                      </p>
                      {t.note && <p className="text-[10px] text-muted-foreground">{t.note}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${t.direction === 'sent' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {t.direction === 'sent' ? '-' : '+'}${(t.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Funds (P2P)
            </DialogTitle>
            <DialogDescription>Transfer from your trading wallet to another user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                type="number"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="What's this for?"
              />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : 'Send Transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
