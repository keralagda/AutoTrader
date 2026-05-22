'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Star, Plus, Trash2, Edit2, Save } from 'lucide-react'

interface Testimonial { id: string; name: string; avatar: string | null; role: string | null; content: string; rating: number; earnings: string | null; isActive: boolean; sortOrder: number }

export function AdminTestimonialsTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<Testimonial[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', avatar: '👤', role: 'Trader', content: '', rating: 5, earnings: '', isActive: true, sortOrder: 0 })

  useEffect(() => { fetch('/api/admin/testimonials').then(r => r.json()).then(data => { if (Array.isArray(data)) setItems(data) }).catch(() => {}) }, [])

  const handleCreate = async () => {
    if (!form.name || !form.content) { toast({ title: 'Name and content required', variant: 'destructive' }); return }
    const res = await fetch('/api/admin/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { const item = await res.json(); setItems(prev => [...prev, item]); setForm({ name: '', avatar: '👤', role: 'Trader', content: '', rating: 5, earnings: '', isActive: true, sortOrder: 0 }); toast({ title: 'Testimonial created!' }) }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    const res = await fetch('/api/admin/testimonials', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...form }) })
    if (res.ok) { const updated = await res.json(); setItems(prev => prev.map(i => i.id === editingId ? updated : i)); setEditingId(null); setForm({ name: '', avatar: '👤', role: 'Trader', content: '', rating: 5, earnings: '', isActive: true, sortOrder: 0 }); toast({ title: 'Updated!' }) }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id)); toast({ title: 'Deleted' })
  }

  const startEdit = (item: Testimonial) => { setEditingId(item.id); setForm({ name: item.name, avatar: item.avatar || '👤', role: item.role || '', content: item.content, rating: item.rating, earnings: item.earnings || '', isActive: item.isActive, sortOrder: item.sortOrder }) }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="size-4 text-primary" />{editingId ? 'Edit' : 'Add'} Testimonial</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Avatar (emoji)</Label><Input value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Role</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Trader" /></div>
            <div className="space-y-1"><Label className="text-xs">Earnings text</Label><Input value={form.earnings} onChange={e => setForm({ ...form, earnings: e.target.value })} placeholder="$5,000 earned" /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Content</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={2} /></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Label className="text-xs">Rating:</Label><Input type="number" min={1} max={5} value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) || 5 })} className="w-16" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} /><Label className="text-xs">Active</Label></div>
            <div className="flex-1" />
            {editingId ? <><Button variant="outline" onClick={() => { setEditingId(null); setForm({ name: '', avatar: '👤', role: 'Trader', content: '', rating: 5, earnings: '', isActive: true, sortOrder: 0 }) }}>Cancel</Button><Button onClick={handleUpdate} className="gap-1.5"><Save className="size-4" />Update</Button></> : <Button onClick={handleCreate} className="gap-1.5"><Plus className="size-4" />Add</Button>}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="size-4" />Testimonials ({items.length})</CardTitle></CardHeader>
        <CardContent><div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3 min-w-0"><span className="text-xl">{item.avatar}</span><div className="min-w-0"><p className="text-sm font-medium truncate">{item.name} <span className="text-muted-foreground text-xs">• {item.role}</span></p><p className="text-xs text-muted-foreground truncate">{item.content.slice(0, 60)}...</p><p className="text-[10px] text-amber-400">{'⭐'.repeat(item.rating)} {item.earnings && `• ${item.earnings}`}</p></div></div>
              <div className="flex gap-1 shrink-0"><Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(item)}><Edit2 className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-7 text-rose-400" onClick={() => handleDelete(item.id)}><Trash2 className="size-3.5" /></Button></div>
            </div>
          ))}
        </div></CardContent>
      </Card>
    </div>
  )
}
