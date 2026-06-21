'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

export function HeaderBuilder() {
  const { toast } = useToast()
  const [navbar, setNavbar] = useState<any>({ logoText: 'BNFX', logoImage: '', links: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/landing-content')
      .then(r => r.json())
      .then(data => {
        if (data.navbar) setNavbar(data.navbar)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveHeader = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/landing-editor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'navbar',
          title: navbar.title || null,
          subtitle: navbar.subtitle || null,
          content: navbar,
          isVisible: navbar.isVisible !== false,
          sortOrder: 0,
        }),
      })
      if (res.ok) toast({ title: 'Header configuration saved!' })
      else toast({ title: 'Failed to save Header', variant: 'destructive' })
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddLink = () => {
    setNavbar((prev: any) => ({ ...prev, links: [...(prev.links || []), { label: 'New Link', href: '#' }] }))
  }

  const handleRemoveLink = (index: number) => {
    setNavbar((prev: any) => ({ ...prev, links: prev.links.filter((_: any, i: number) => i !== index) }))
  }

  const handleUpdateLink = (index: number, field: string, val: string) => {
    setNavbar((prev: any) => {
      const links = [...prev.links]
      links[index] = { ...links[index], [field]: val }
      return { ...prev, links }
    })
  }

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    setNavbar((prev: any) => {
      const links = [...prev.links]
      if (direction === 'up' && index > 0) {
        [links[index - 1], links[index]] = [links[index], links[index - 1]]
      } else if (direction === 'down' && index < links.length - 1) {
        [links[index], links[index + 1]] = [links[index + 1], links[index]]
      }
      return { ...prev, links }
    })
  }

  if (loading) return <div className="text-center py-6 text-xs text-muted-foreground">Loading header configuration...</div>

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">Global Header Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Logo Text</Label>
            <Input value={navbar.logoText || ''} onChange={e => setNavbar((prev: any) => ({ ...prev, logoText: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Logo Image URL</Label>
            <Input value={navbar.logoImage || ''} onChange={e => setNavbar((prev: any) => ({ ...prev, logoImage: e.target.value }))} placeholder="/bnfx-logo.svg" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Navigation Links</Label>
            <Button size="sm" variant="outline" onClick={handleAddLink} className="gap-1 h-8"><Plus className="size-3" /> Add Link</Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(navbar.links || []).map((link: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border/20">
                <Input value={link.label} onChange={e => handleUpdateLink(idx, 'label', e.target.value)} placeholder="Label" className="w-1/3 h-8 text-xs" />
                <Input value={link.href} onChange={e => handleUpdateLink(idx, 'href', e.target.value)} placeholder="URL/Anchor" className="flex-1 h-8 text-xs" />
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => handleMoveLink(idx, 'up')} disabled={idx === 0}><ArrowUp className="size-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => handleMoveLink(idx, 'down')} disabled={idx === navbar.links.length - 1}><ArrowDown className="size-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="size-7 text-rose-400" onClick={() => handleRemoveLink(idx)}><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="sm" onClick={saveHeader} disabled={saving} className="gap-1">
            <Save className="size-3.5" />{saving ? 'Saving...' : 'Save Header'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
