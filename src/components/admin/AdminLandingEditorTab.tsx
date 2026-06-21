'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Layout, Save, Upload, Image, Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react'

interface SectionData {
  sectionKey: string
  title: string
  subtitle: string
  content: any
  isVisible: boolean
  sortOrder: number
}

interface MediaItem {
  id: string
  fileName: string
  fileType: string
  url: string
  alt: string | null
  createdAt: string
}

const SECTION_LABELS: Record<string, { label: string; description: string }> = {
  hero: { label: 'Hero Section', description: 'Main banner with headline, subtitle, CTA buttons and stats' },
  navbar: { label: 'Navigation Bar', description: 'Logo, navigation links and auth buttons' },
  stats: { label: 'Statistics Section', description: 'Platform stats with animated counters' },
  testimonials: { label: 'Testimonials', description: 'User testimonials with ratings and earnings' },
  plans: { label: 'Plans Section', description: 'Investment plans display settings' },
  referral: { label: 'Referral Section', description: 'Referral levels and earnings example' },
  distribution: { label: 'Distribution Section', description: 'Profit distribution breakdown' },
  footer: { label: 'Footer', description: 'Company info, links and social media' },
}

export function AdminLandingEditorTab() {
  const { toast } = useToast()
  const [sections, setSections] = useState<Record<string, any>>({})
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<any[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string>('')
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/landing-content').then(r => r.json()),
      fetch('/api/admin/media').then(r => r.json()),
      fetch('/api/admin/templates').then(r => r.json()),
    ]).then(([content, mediaData, templatesData]) => {
      setSections(content || {})
      setMedia(Array.isArray(mediaData) ? mediaData : [])
      if (templatesData) {
        const list = [...(templatesData.builtIn || []), ...(templatesData.custom || [])]
        setTemplates(list)
        setActiveTemplateId(templatesData.activeId || 'crypto-dark')
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleApplyTemplate = async (templateId: string) => {
    setApplyingTemplate(templateId)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, action: 'apply' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActiveTemplateId(templateId)
        toast({ title: 'Template applied successfully!', description: 'Reload the landing page to see the new layout.' })
        const contentRes = await fetch('/api/landing-content')
        const contentData = await contentRes.json()
        setSections(contentData || {})
      } else {
        toast({ title: 'Failed to apply template', description: data.error || '', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setApplyingTemplate(null)
    }
  }

  const handleSaveSection = async (sectionKey: string) => {
    setSaving(sectionKey)
    const data = sections[sectionKey]
    try {
      const res = await fetch('/api/admin/landing-editor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey,
          title: data.title || null,
          subtitle: data.subtitle || null,
          content: data,
          isVisible: data.isVisible !== false,
          sortOrder: data.sortOrder || 0,
        }),
      })
      if (res.ok) toast({ title: `${SECTION_LABELS[sectionKey]?.label || sectionKey} saved!` })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSaving(null) }
  }

  const updateSection = (key: string, field: string, value: any) => {
    setSections(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const updateNestedSection = (key: string, path: string, value: any) => {
    setSections(prev => {
      const section = { ...prev[key] }
      const parts = path.split('.')
      let obj: any = section
      for (let i = 0; i < parts.length - 1; i++) {
        if (Array.isArray(obj[parts[i]])) obj[parts[i]] = [...obj[parts[i]]]
        else obj[parts[i]] = { ...obj[parts[i]] }
        obj = obj[parts[i]]
      }
      obj[parts[parts.length - 1]] = value
      return { ...prev, [key]: section }
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'File too large (max 5MB)', variant: 'destructive' }); return }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt', file.name)

    try {
      const res = await fetch('/api/admin/landing-editor', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setMedia(prev => [{ id: data.id, fileName: data.fileName, fileType: 'image', url: data.url, alt: data.fileName, createdAt: new Date().toISOString() }, ...prev])
        toast({ title: 'File uploaded!' })
      }
    } catch { toast({ title: 'Upload failed', variant: 'destructive' }) }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleDeleteMedia = async (id: string) => {
    await fetch(`/api/admin/media?id=${id}`, { method: 'DELETE' })
    setMedia(prev => prev.filter(m => m.id !== id))
  }

  const activeTemplate = templates.find(t => t.id === activeTemplateId)

  return (
    <div className="space-y-6">
      {activeTemplate && (
        <Card className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-lg bg-background/50 border border-border/30">
                {activeTemplate.thumbnail || '✨'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">Active Layout Template: {activeTemplate.name}</h4>
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono bg-amber-500/20 text-amber-400 border-none">
                    {activeTemplate.styles?.layout === 'awwwards' ? 'Awwwards Engine' : 'Default Engine'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{activeTemplate.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Applied Theme
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections" className="gap-1.5"><Layout className="size-3.5" />Sections</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><Layout className="size-3.5" />Layout Templates</TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5"><Image className="size-3.5" />Media Library</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-4 space-y-4">
          {/* Hero Section Editor */}
          <SectionEditor
            sectionKey="hero"
            data={sections.hero || {}}
            saving={saving === 'hero'}
            onSave={() => handleSaveSection('hero')}
            onToggleVisibility={(v) => updateSection('hero', 'isVisible', v)}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Headline</Label>
                <Textarea value={sections.hero?.title || ''} onChange={e => updateSection('hero', 'title', e.target.value)} rows={2} placeholder="Main headline text" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Subtitle</Label>
                <Input value={sections.hero?.subtitle || ''} onChange={e => updateSection('hero', 'subtitle', e.target.value)} placeholder="Subtitle text" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea value={sections.hero?.description || ''} onChange={e => updateSection('hero', 'description', e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Primary CTA Text</Label>
                  <Input value={sections.hero?.ctaPrimary || ''} onChange={e => updateSection('hero', 'ctaPrimary', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Secondary CTA Text</Label>
                  <Input value={sections.hero?.ctaSecondary || ''} onChange={e => updateSection('hero', 'ctaSecondary', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Background Image URL</Label>
                <Input value={sections.hero?.backgroundImage || ''} onChange={e => updateSection('hero', 'backgroundImage', e.target.value)} placeholder="Paste URL or upload in Media tab" />
              </div>
              {/* Stats */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Hero Stats</Label>
                {(sections.hero?.stats || []).map((stat: any, i: number) => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <Input value={stat.label} onChange={e => { const stats = [...(sections.hero?.stats || [])]; stats[i] = { ...stats[i], label: e.target.value }; updateSection('hero', 'stats', stats) }} placeholder="Label" />
                    <Input type="number" value={stat.value} onChange={e => { const stats = [...(sections.hero?.stats || [])]; stats[i] = { ...stats[i], value: parseInt(e.target.value) || 0 }; updateSection('hero', 'stats', stats) }} />
                    <Input value={stat.prefix} onChange={e => { const stats = [...(sections.hero?.stats || [])]; stats[i] = { ...stats[i], prefix: e.target.value }; updateSection('hero', 'stats', stats) }} placeholder="Prefix" />
                    <Input value={stat.suffix} onChange={e => { const stats = [...(sections.hero?.stats || [])]; stats[i] = { ...stats[i], suffix: e.target.value }; updateSection('hero', 'stats', stats) }} placeholder="Suffix" />
                  </div>
                ))}
              </div>
            </div>
          </SectionEditor>

          {/* Stats Section Editor */}
          <SectionEditor
            sectionKey="stats"
            data={sections.stats || {}}
            saving={saving === 'stats'}
            onSave={() => handleSaveSection('stats')}
            onToggleVisibility={(v) => updateSection('stats', 'isVisible', v)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-xs">Section Title</Label><Input value={sections.stats?.title || ''} onChange={e => updateSection('stats', 'title', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Subtitle</Label><Input value={sections.stats?.subtitle || ''} onChange={e => updateSection('stats', 'subtitle', e.target.value)} /></div>
              </div>
              <Label className="text-xs font-medium">Stat Items</Label>
              {(sections.stats?.items || []).map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-5 gap-2">
                  <Input value={item.label} onChange={e => { const items = [...(sections.stats?.items || [])]; items[i] = { ...items[i], label: e.target.value }; updateSection('stats', 'items', items) }} placeholder="Label" />
                  <Input type="number" value={item.value} onChange={e => { const items = [...(sections.stats?.items || [])]; items[i] = { ...items[i], value: parseInt(e.target.value) || 0 }; updateSection('stats', 'items', items) }} />
                  <Input value={item.prefix} onChange={e => { const items = [...(sections.stats?.items || [])]; items[i] = { ...items[i], prefix: e.target.value }; updateSection('stats', 'items', items) }} placeholder="$" />
                  <Input value={item.suffix} onChange={e => { const items = [...(sections.stats?.items || [])]; items[i] = { ...items[i], suffix: e.target.value }; updateSection('stats', 'items', items) }} placeholder="+" />
                  <Input value={item.color} onChange={e => { const items = [...(sections.stats?.items || [])]; items[i] = { ...items[i], color: e.target.value }; updateSection('stats', 'items', items) }} placeholder="emerald" />
                </div>
              ))}
            </div>
          </SectionEditor>

          {/* Navbar Editor */}
          <SectionEditor
            sectionKey="navbar"
            data={sections.navbar || {}}
            saving={saving === 'navbar'}
            onSave={() => handleSaveSection('navbar')}
            onToggleVisibility={(v) => updateSection('navbar', 'isVisible', v)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-xs">Logo Text</Label><Input value={sections.navbar?.logoText || ''} onChange={e => updateSection('navbar', 'logoText', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Logo Image URL</Label><Input value={sections.navbar?.logoImage || ''} onChange={e => updateSection('navbar', 'logoImage', e.target.value)} placeholder="Upload in Media tab" /></div>
              </div>
              <Label className="text-xs font-medium">Navigation Links</Label>
              {(sections.navbar?.links || []).map((link: any, i: number) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input value={link.label} onChange={e => { const links = [...(sections.navbar?.links || [])]; links[i] = { ...links[i], label: e.target.value }; updateSection('navbar', 'links', links) }} placeholder="Label" />
                  <Input value={link.href} onChange={e => { const links = [...(sections.navbar?.links || [])]; links[i] = { ...links[i], href: e.target.value }; updateSection('navbar', 'links', links) }} placeholder="URL" />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateSection('navbar', 'links', [...(sections.navbar?.links || []), { label: '', href: '' }])}>+ Add Link</Button>
            </div>
          </SectionEditor>

          {/* Testimonials Section Editor */}
          <SectionEditor
            sectionKey="testimonials"
            data={sections.testimonials || {}}
            saving={saving === 'testimonials'}
            onSave={() => handleSaveSection('testimonials')}
            onToggleVisibility={(v) => updateSection('testimonials', 'isVisible', v)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-xs">Section Title</Label><Input value={sections.testimonials?.title || 'What Our Traders Say'} onChange={e => updateSection('testimonials', 'title', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Subtitle</Label><Input value={sections.testimonials?.subtitle || ''} onChange={e => updateSection('testimonials', 'subtitle', e.target.value)} /></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Testimonial Items</Label>
                  <Button variant="outline" size="sm" onClick={() => {
                    const items = sections.testimonials?.items || []
                    updateSection('testimonials', 'items', [...items, { name: '', role: 'Trader', content: '', rating: 5, earnings: '', avatar: '👤' }])
                  }}>+ Add Testimonial</Button>
                </div>
                {(sections.testimonials?.items || []).map((item: any, i: number) => (
                  <Card key={i} className="border-border/30 bg-muted/10">
                    <CardContent className="p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1"><Label className="text-[10px]">Name</Label><Input value={item.name} onChange={e => { const items = [...(sections.testimonials?.items || [])]; items[i] = { ...items[i], name: e.target.value }; updateSection('testimonials', 'items', items) }} className="h-8 text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[10px]">Role</Label><Input value={item.role} onChange={e => { const items = [...(sections.testimonials?.items || [])]; items[i] = { ...items[i], role: e.target.value }; updateSection('testimonials', 'items', items) }} className="h-8 text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[10px]">Earnings</Label><Input value={item.earnings} onChange={e => { const items = [...(sections.testimonials?.items || [])]; items[i] = { ...items[i], earnings: e.target.value }; updateSection('testimonials', 'items', items) }} className="h-8 text-xs" placeholder="$5,000 earned" /></div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-3 space-y-1"><Label className="text-[10px]">Content</Label><Input value={item.content} onChange={e => { const items = [...(sections.testimonials?.items || [])]; items[i] = { ...items[i], content: e.target.value }; updateSection('testimonials', 'items', items) }} className="h-8 text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[10px]">Rating (1-5)</Label><Input type="number" min={1} max={5} value={item.rating} onChange={e => { const items = [...(sections.testimonials?.items || [])]; items[i] = { ...items[i], rating: parseInt(e.target.value) || 5 }; updateSection('testimonials', 'items', items) }} className="h-8 text-xs" /></div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-rose-400" onClick={() => { const items = [...(sections.testimonials?.items || [])]; items.splice(i, 1); updateSection('testimonials', 'items', items) }}>
                          <Trash2 className="size-3 mr-1" />Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Note: Testimonials also pull from the Testimonials tab (Content → Testimonials). Items added here are additional overrides saved to the landing section.</p>
            </div>
          </SectionEditor>

          {/* Plans Section Editor */}
          <SectionEditor
            sectionKey="plans"
            data={sections.plans || {}}
            saving={saving === 'plans'}
            onSave={() => handleSaveSection('plans')}
            onToggleVisibility={(v) => updateSection('plans', 'isVisible', v)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-xs">Section Title</Label><Input value={sections.plans?.title || 'Investment Plans'} onChange={e => updateSection('plans', 'title', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Subtitle</Label><Input value={sections.plans?.subtitle || ''} onChange={e => updateSection('plans', 'subtitle', e.target.value)} /></div>
              </div>
              <p className="text-[10px] text-muted-foreground">Plans are managed in Trading → Plan Builder. This section controls the display title and visibility only.</p>
            </div>
          </SectionEditor>

          {/* Referral Section Editor */}
          <SectionEditor
            sectionKey="referral"
            data={sections.referral || {}}
            saving={saving === 'referral'}
            onSave={() => handleSaveSection('referral')}
            onToggleVisibility={(v) => updateSection('referral', 'isVisible', v)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-xs">Section Title</Label><Input value={sections.referral?.title || '7-Level Referral & Trade Profit Share'} onChange={e => updateSection('referral', 'title', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Subtitle</Label><Input value={sections.referral?.subtitle || ''} onChange={e => updateSection('referral', 'subtitle', e.target.value)} /></div>
              </div>
              <p className="text-[10px] text-muted-foreground">Referral levels and percentages are managed in Trading → Referral System.</p>
            </div>
          </SectionEditor>

          {/* Footer Editor */}
          <SectionEditor
            sectionKey="footer"
            data={sections.footer || {}}
            saving={saving === 'footer'}
            onSave={() => handleSaveSection('footer')}
            onToggleVisibility={(v) => updateSection('footer', 'isVisible', v)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label className="text-xs">Company Name</Label><Input value={sections.footer?.companyName || ''} onChange={e => updateSection('footer', 'companyName', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Tagline</Label><Input value={sections.footer?.tagline || ''} onChange={e => updateSection('footer', 'tagline', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Copyright</Label><Input value={sections.footer?.copyright || ''} onChange={e => updateSection('footer', 'copyright', e.target.value)} /></div>
              </div>
              <Label className="text-xs font-medium">Footer Links</Label>
              {(sections.footer?.links || []).map((link: any, i: number) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input value={link.label} onChange={e => { const links = [...(sections.footer?.links || [])]; links[i] = { ...links[i], label: e.target.value }; updateSection('footer', 'links', links) }} />
                  <Input value={link.url} onChange={e => { const links = [...(sections.footer?.links || [])]; links[i] = { ...links[i], url: e.target.value }; updateSection('footer', 'links', links) }} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateSection('footer', 'links', [...(sections.footer?.links || []), { label: '', url: '' }])}>+ Add Link</Button>
            </div>
          </SectionEditor>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layout className="size-4 text-primary" /> Select & Apply Templates
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Choose a pre-designed layout template. Applying a template will update the active landing page layout, theme colors, and load its default section configurations.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const isActive = template.id === activeTemplateId
                  return (
                    <Card
                      key={template.id}
                      className={`relative overflow-hidden border-border/50 transition-all duration-300 ${
                        isActive
                          ? 'ring-2 ring-amber-500 border-transparent bg-amber-500/5'
                          : 'hover:border-border/80 bg-muted/10'
                      }`}
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-3xl p-2 rounded-lg bg-background/50 border border-border/30">
                              {template.thumbnail || '✨'}
                            </span>
                            <div className="flex flex-col items-end gap-1.5">
                              <Badge className="text-[9px] uppercase font-mono tracking-wider">
                                {template.category || 'general'}
                              </Badge>
                              {template.styles?.layout === 'awwwards' && (
                                <Badge variant="outline" className="text-[9px] uppercase font-mono border-amber-500/30 text-amber-500">
                                  Awwwards
                                </Badge>
                              )}
                            </div>
                          </div>

                          <h3 className="font-bold text-base mt-3 text-foreground">{template.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {template.description}
                          </p>

                          {/* Color Palette Preview */}
                          {template.colors && (
                            <div className="flex items-center gap-1.5 mt-4">
                              <span className="text-[10px] font-mono text-muted-foreground mr-1.5">Colors:</span>
                              <div
                                className="size-3.5 rounded-full border border-border/20"
                                style={{ backgroundColor: template.colors.background }}
                                title={`Background: ${template.colors.background}`}
                              />
                              <div
                                className="size-3.5 rounded-full border border-border/20"
                                style={{ backgroundColor: template.colors.card }}
                                title={`Card: ${template.colors.card}`}
                              />
                              <div
                                className="size-3.5 rounded-full border border-border/20"
                                style={{ backgroundColor: template.colors.primary }}
                                title={`Primary: ${template.colors.primary}`}
                              />
                              <div
                                className="size-3.5 rounded-full border border-border/20"
                                style={{ backgroundColor: template.colors.accent }}
                                title={`Accent: ${template.colors.accent}`}
                              />
                              <div
                                className="size-3.5 rounded-full border border-border/20"
                                style={{ backgroundColor: template.colors.text }}
                                title={`Text: ${template.colors.text}`}
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          {isActive ? (
                            <Button className="w-full bg-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium text-xs h-9 cursor-default gap-1.5">
                              ✓ Currently Active
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleApplyTemplate(template.id)}
                              disabled={applyingTemplate !== null}
                              className="w-full text-xs h-9 bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all"
                            >
                              {applyingTemplate === template.id ? 'Applying...' : 'Apply Template'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Library Tab */}
        <TabsContent value="media" className="mt-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Image className="size-4 text-primary" />Media Library ({media.length})</CardTitle>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5">
                    <Upload className="size-3.5" />{uploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Upload images and media for use in landing page sections. Max 5MB per file.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {media.map(item => (
                  <div key={item.id} className="group relative rounded-lg border border-border/50 overflow-hidden bg-muted/30">
                    {item.fileType === 'image' ? (
                      <img src={item.url} alt={item.alt || ''} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center text-2xl">📄</div>
                    )}
                    <div className="p-1.5">
                      <p className="text-[10px] text-muted-foreground truncate">{item.fileName}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="ghost" className="size-7 text-white" onClick={() => { navigator.clipboard.writeText(item.url); toast({ title: 'URL copied!' }) }}>
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7 text-rose-400" onClick={() => handleDeleteMedia(item.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {media.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Image className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No media uploaded yet</p>
                    <p className="text-xs">Upload images to use in your landing page</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Reusable Section Editor wrapper
function SectionEditor({ sectionKey, data, saving, onSave, onToggleVisibility, children }: {
  sectionKey: string; data: any; saving: boolean; onSave: () => void; onToggleVisibility: (v: boolean) => void; children: React.ReactNode
}) {
  const info = SECTION_LABELS[sectionKey] || { label: sectionKey, description: '' }
  const isVisible = data.isVisible !== false

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="size-4 text-muted-foreground cursor-grab" />
            <div>
              <CardTitle className="text-sm">{info.label}</CardTitle>
              <p className="text-[11px] text-muted-foreground">{info.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isVisible ? <Eye className="size-3.5 text-emerald-400" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
              <Switch checked={isVisible} onCheckedChange={onToggleVisibility} />
            </div>
            <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5">
              <Save className="size-3.5" />{saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
