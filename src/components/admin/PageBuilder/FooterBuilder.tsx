'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

export function FooterBuilder() {
  const { toast } = useToast()
  const [footer, setFooter] = useState<any>({ companyName: 'BNFX', tagline: '', copyright: '', links: [], socials: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/landing-content')
      .then(r => r.json())
      .then(data => {
        if (data.footer) setFooter(data.footer)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveFooter = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/landing-editor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'footer',
          title: footer.title || null,
          subtitle: footer.subtitle || null,
          content: footer,
          isVisible: footer.isVisible !== false,
          sortOrder: 0,
        }),
      })
      if (res.ok) toast({ title: 'Footer configuration saved!' })
      else toast({ title: 'Failed to save Footer', variant: 'destructive' })
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddLink = () => {
    setFooter((prev: any) => ({ ...prev, links: [...(prev.links || []), { label: 'New Link', url: '#' }] }))
  }

  const handleRemoveLink = (index: number) => {
    setFooter((prev: any) => ({ ...prev, links: prev.links.filter((_: any, i: number) => i !== index) }))
  }

  const handleUpdateLink = (index: number, field: string, val: string) => {
    setFooter((prev: any) => {
      const links = [...prev.links]
      links[index] = { ...links[index], [field]: val }
      return { ...prev, links }
    })
  }

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    setFooter((prev: any) => {
      const links = [...prev.links]
      if (direction === 'up' && index > 0) {
        [links[index - 1], links[index]] = [links[index], links[index - 1]]
      } else if (direction === 'down' && index < links.length - 1) {
        [links[index], links[index + 1]] = [links[index + 1], links[index]]
      }
      return { ...prev, links }
    })
  }

  const handleAddSocial = () => {
    setFooter((prev: any) => ({ ...prev, socials: [...(prev.socials || []), { platform: 'twitter', url: '#' }] }))
  }

  const handleRemoveSocial = (index: number) => {
    setFooter((prev: any) => ({ ...prev, socials: prev.socials.filter((_: any, i: number) => i !== index) }))
  }

  const handleUpdateSocial = (index: number, field: string, val: string) => {
    setFooter((prev: any) => {
      const socials = [...prev.socials]
      socials[index] = { ...socials[index], [field]: val }
      return { ...prev, socials }
    })
  }

  if (loading) return <div className="text-center py-6 text-xs text-muted-foreground">Loading footer configuration...</div>

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">Global Footer Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Company Name</Label>
            <Input value={footer.companyName || ''} onChange={e => setFooter((prev: any) => ({ ...prev, companyName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Tagline</Label>
            <Input value={footer.tagline || ''} onChange={e => setFooter((prev: any) => ({ ...prev, tagline: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Copyright Text</Label>
            <Input value={footer.copyright || ''} onChange={e => setFooter((prev: any) => ({ ...prev, copyright: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Footer Links</Label>
              <Button size="sm" variant="outline" onClick={handleAddLink} className="gap-1 h-8"><Plus className="size-3" /> Add Link</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(footer.links || []).map((link: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border/20">
                  <Input value={link.label} onChange={e => handleUpdateLink(idx, 'label', e.target.value)} placeholder="Label" className="w-1/3 h-8 text-xs" />
                  <Input value={link.url} onChange={e => handleUpdateLink(idx, 'url', e.target.value)} placeholder="URL" className="flex-1 h-8 text-xs" />
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => handleMoveLink(idx, 'up')} disabled={idx === 0}><ArrowUp className="size-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => handleMoveLink(idx, 'down')} disabled={idx === footer.links.length - 1}><ArrowDown className="size-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="size-7 text-rose-400" onClick={() => handleRemoveLink(idx)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Social Platforms</Label>
              <Button size="sm" variant="outline" onClick={handleAddSocial} className="gap-1 h-8"><Plus className="size-3" /> Add Social</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(footer.socials || []).map((soc: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border/20">
                  <select value={soc.platform} onChange={e => handleUpdateSocial(idx, 'platform', e.target.value)} className="w-1/3 text-xs bg-background border border-border rounded px-2 py-1.5 h-8">
                    <option value="twitter">Twitter / X</option>
                    <option value="telegram">Telegram</option>
                    <option value="discord">Discord</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                  </select>
                  <Input value={soc.url} onChange={e => handleUpdateSocial(idx, 'url', e.target.value)} placeholder="URL" className="flex-1 h-8 text-xs" />
                  <Button size="icon" variant="ghost" className="size-7 text-rose-400" onClick={() => handleRemoveSocial(idx)}><Trash2 className="size-3.5" /></Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="sm" onClick={saveFooter} disabled={saving} className="gap-1">
            <Save className="size-3.5" />{saving ? 'Saving...' : 'Save Footer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
