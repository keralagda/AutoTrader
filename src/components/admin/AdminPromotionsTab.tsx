'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Megaphone, Plus, Trash2, Edit2, Save, Clock } from 'lucide-react'

interface Promotion { id: string; title: string; description: string; bannerText: string | null; type: string; multiplier: number; startDate: string; endDate: string; isActive: boolean; showOnLanding: boolean; showOnDashboard: boolean }

export function AdminPromotionsTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<Promotion[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', bannerText: '', type: 'general', multiplier: 1, startDate: '', endDate: '', isActive: true, showOnLanding: true, showOnDashboard: true })

  useEffect(() => { fetch('/api/admin/promotions').then(r => r.json()).then(data => { if (Array.isArray(data)) setItems(data) }).catch(() => {}) }, [])

  const handleCreate = async () => {
    if (!form.title || !form.endDate) { toast({ title: 'Title and end date required', variant: 'destructive' }); return }
    const res = await fetch('/api/admin/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { const item = await res.json(); setItems(prev => [item, ...prev]); resetForm(); toast({ title: 'Promotion created!' }) }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    const res = await fetch('/api/admin/promotions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...form }) })
    if (res.ok) { const updated = await res.json(); setItems(prev => prev.map(i => i.id === editingId ? updated : i)); setEditingId(null); resetForm(); toast({ title: 'Updated!' }) }
  }

  const handleDelete = async (id: string) => { await fetch(`/api/admin/promotions?id=${id}`, { method: 'DELETE' }); setItems(prev => prev.filter(i => i.id !== id)); toast({ title: 'Deleted' }) }

  const resetForm = () => setForm({ title: '', description: '', bannerText: '', type: 'general', multiplier: 1, startDate: '', endDate: '', isActive: true, showOnLanding: true, showOnDashboard: true })
  const startEdit = (item: Promotion) => { setEditingId(item.id); setForm({ title: item.title, description: item.description, bannerText: item.bannerText || '', type: item.type, multiplier: item.multiplier, startDate: item.startDate.split('T')[0], endDate: item.endDate.split('T')[0], isActive: item.isActive, showOnLanding: item.showOnLanding, showOnDashboard: item.showOnDashboard }) }

  const isExpired = (endDate: string) => new Date(endDate) < new Date()

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="size-4 text-primary" />{editingId ? 'Edit' : 'Create'} Promotion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Banner Text (short)</Label><Input value={form.bannerText} onChange={e => setForm({ ...form, bannerText: e.target.value })} placeholder="🔥 2x Referral Bonus!" /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1"><Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="referral_bonus">Referral Bonus</SelectItem><SelectItem value="deposit_bonus">Deposit Bonus</SelectItem><SelectItem value="limited_time">Limited Time</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Multiplier</Label><Input type="number" step="0.5" value={form.multiplier} onChange={e => setForm({ ...form, multiplier: parseFloat(e.target.value) || 1 })} /></div>
            <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} /><Label className="text-xs">Active</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.showOnLanding} onCheckedChange={v => setForm({ ...form, showOnLanding: v })} /><Label className="text-xs">Show on Landing</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.showOnDashboard} onCheckedChange={v => setForm({ ...form, showOnDashboard: v })} /><Label className="text-xs">Show on Dashboard</Label></div>
            <div className="flex-1" />
            {editingId ? <><Button variant="outline" onClick={() => { setEditingId(null); resetForm() }}>Cancel</Button><Button onClick={handleUpdate} className="gap-1.5"><Save className="size-4" />Update</Button></> : <Button onClick={handleCreate} className="gap-1.5"><Plus className="size-4" />Create</Button>}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="size-4" />Promotions ({items.length})</CardTitle></CardHeader>
        <CardContent><div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{item.title}</p><Badge variant="outline" className="text-[9px]">{item.type}</Badge>{isExpired(item.endDate) && <Badge className="bg-rose-500/20 text-rose-400 text-[9px]">Expired</Badge>}{!item.isActive && <Badge className="bg-gray-500/20 text-gray-400 text-[9px]">Inactive</Badge>}</div>
                <p className="text-xs text-muted-foreground">{item.bannerText || item.description.slice(0, 50)}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()} • {item.multiplier}x</p>
              </div>
              <div className="flex gap-1 shrink-0"><Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(item)}><Edit2 className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-7 text-rose-400" onClick={() => handleDelete(item.id)}><Trash2 className="size-3.5" /></Button></div>
            </div>
          ))}
        </div></CardContent>
      </Card>
    </div>
  )
}
