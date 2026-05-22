'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { LifeBuoy, Send } from 'lucide-react'

interface Ticket { id: string; userId: string; subject: string; description: string; category: string; priority: string; status: string; createdAt: string; user?: { name: string; email: string }; replies: { id: string; message: string; isAdmin: boolean; createdAt: string }[] }

const statusColors: Record<string, string> = { open: 'bg-amber-500/20 text-amber-400', in_progress: 'bg-cyan-500/20 text-cyan-400', resolved: 'bg-emerald-500/20 text-emerald-400', closed: 'bg-gray-500/20 text-gray-400' }
const priorityColors: Record<string, string> = { low: 'text-gray-400', medium: 'text-amber-400', high: 'text-rose-400', urgent: 'text-rose-500 font-bold' }

export function AdminTicketsTab() {
  const { toast } = useToast()
  const { user } = useAppStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')

  useEffect(() => { fetch('/api/admin/support-tickets').then(r => r.json()).then(data => { if (Array.isArray(data)) setTickets(data) }).catch(() => {}) }, [])

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/admin/support-tickets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status })
  }

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return
    const res = await fetch('/api/support-tickets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: selectedTicket.id, userId: user?.id, message: reply, isAdmin: true }) })
    if (res.ok) {
      const r = await res.json()
      setSelectedTicket({ ...selectedTicket, replies: [...selectedTicket.replies, r] })
      setReply('')
      toast({ title: 'Reply sent' })
    }
  }

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>← Back to Tickets</Button>
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{selectedTicket.subject}</CardTitle>
                <p className="text-xs text-muted-foreground">{selectedTicket.user?.name} • {selectedTicket.category} • {new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <Select value={selectedTicket.status} onValueChange={v => handleStatusChange(selectedTicket.id, v)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-sm">{selectedTicket.description}</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedTicket.replies.map(r => (
                <div key={r.id} className={`p-2.5 rounded-lg text-sm ${r.isAdmin ? 'bg-primary/10 border border-primary/20 ml-8' : 'bg-muted/30 border border-border/30 mr-8'}`}>
                  <p className="text-[10px] text-muted-foreground mb-1">{r.isAdmin ? '👤 Admin' : '🙋 User'} • {new Date(r.createdAt).toLocaleString()}</p>
                  <p>{r.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." rows={2} className="flex-1" />
              <Button onClick={handleReply} className="gap-1.5 self-end"><Send className="size-4" />Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><LifeBuoy className="size-4 text-primary" />Support Tickets ({tickets.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {tickets.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 cursor-pointer hover:border-primary/20" onClick={() => setSelectedTicket(t)}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{t.subject}</p>
                  <Badge className={statusColors[t.status] || ''} variant="outline">{t.status.replace('_', ' ')}</Badge>
                  <span className={`text-[10px] ${priorityColors[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.user?.name} • {t.category} • {t.replies.length} replies</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">No tickets yet</p>}
        </div>
      </CardContent>
    </Card>
  )
}
