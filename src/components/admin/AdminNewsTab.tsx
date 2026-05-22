'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Newspaper, Plus, Trash2, Edit2, Save } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  content: string
  category: string
  isPublished: boolean
  publishedAt: string
  createdAt: string
}

export function AdminNewsTab() {
  const { toast } = useToast()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'general', isPublished: true })

  useEffect(() => {
    fetch('/api/admin/news')
      .then(r => r.json())
      .then(setNews)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.title || !form.content) {
      toast({ title: 'Title and content required', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const item = await res.json()
        setNews(prev => [item, ...prev])
        setForm({ title: '', content: '', category: 'general', isPublished: true })
        toast({ title: 'News article created!' })
      }
    } catch {
      toast({ title: 'Failed to create', variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch('/api/admin/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...form }),
      })
      if (res.ok) {
        const updated = await res.json()
        setNews(prev => prev.map(n => n.id === id ? updated : n))
        setEditingId(null)
        setForm({ title: '', content: '', category: 'general', isPublished: true })
        toast({ title: 'News updated!' })
      }
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' })
      setNews(prev => prev.filter(n => n.id !== id))
      toast({ title: 'News deleted' })
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const startEdit = (item: NewsItem) => {
    setEditingId(item.id)
    setForm({ title: item.title, content: item.content, category: item.category, isPublished: item.isPublished })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            {editingId ? 'Edit News Article' : 'Create News Article'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Article content..." rows={4} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.isPublished} onCheckedChange={v => setForm({ ...form, isPublished: v })} />
              <Label>Published</Label>
            </div>
            <div className="flex-1" />
            {editingId ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditingId(null); setForm({ title: '', content: '', category: 'general', isPublished: true }) }}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdate(editingId)} className="gap-1.5">
                  <Save className="size-4" /> Update
                </Button>
              </div>
            ) : (
              <Button onClick={handleCreate} className="gap-1.5">
                <Plus className="size-4" /> Create
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="size-4" />
            All News ({news.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {news.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <Badge variant="outline" className="text-[9px]">{item.category}</Badge>
                    {!item.isPublished && <Badge className="bg-amber-500/20 text-amber-400 text-[9px]">Draft</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.content.slice(0, 80)}</p>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                    <Edit2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-rose-400" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
