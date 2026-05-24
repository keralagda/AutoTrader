'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Palette, Check, Eye, Loader2, Sparkles, Layout } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  colors: { primary: string; accent: string; background: string; card: string; text: string }
  hero: { headline: string; subtitle: string; ctaText: string; ctaSecondary: string; backgroundStyle: string; stats: any[] }
  sections: string[]
  styles: { borderRadius: string; fontFamily: string; cardStyle: string; animationStyle: string }
}

export function AdminTemplatesTab() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<{ builtIn: Template[]; custom: Template[] }>({ builtIn: [], custom: [] })
  const [activeId, setActiveId] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates({ builtIn: data.builtIn || [], custom: data.custom || [] })
        setActiveId(data.activeId || '')
      }
    } catch {} finally { setLoading(false) }
  }

  const handleApply = async (templateId: string) => {
    setApplying(templateId)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, action: 'apply' }),
      })
      if (res.ok) {
        setActiveId(templateId)
        toast({ title: 'Template applied!', description: 'Landing page updated with new template.' })
      } else {
        toast({ title: 'Failed to apply template', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally { setApplying(null) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const allTemplates = [...templates.builtIn, ...templates.custom]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Landing Page Templates
        </h2>
        <p className="text-sm text-muted-foreground">Choose a template for your landing page. Preview before applying.</p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTemplates.map(template => {
          const isActive = activeId === template.id
          return (
            <Card key={template.id} className={`bg-card/50 border-border/50 overflow-hidden transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-primary' : ''}`}>
              {/* Template Preview */}
              <div
                className="h-48 relative overflow-hidden"
                style={{ backgroundColor: template.colors.background }}
              >
                {/* Mini preview of the template */}
                <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center">
                  {/* Fake navbar */}
                  <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: template.colors.primary }} />
                      <span className="text-[8px] font-bold" style={{ color: template.colors.text }}>BNFX</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-6 h-1.5 rounded" style={{ backgroundColor: template.colors.card }} />
                      <div className="w-6 h-1.5 rounded" style={{ backgroundColor: template.colors.card }} />
                    </div>
                  </div>

                  {/* Hero text */}
                  <div className="mt-4">
                    <p className="text-[10px] font-bold leading-tight" style={{ color: template.colors.text }}>
                      {template.hero.headline.substring(0, 30)}...
                    </p>
                    <p className="text-[7px] mt-1 opacity-60" style={{ color: template.colors.text }}>
                      {template.hero.subtitle.substring(0, 50)}...
                    </p>
                    <div className="mt-2 flex gap-1 justify-center">
                      <div className="px-2 py-0.5 rounded text-[6px] font-bold text-white" style={{ backgroundColor: template.colors.primary }}>
                        {template.hero.ctaText}
                      </div>
                      <div className="px-2 py-0.5 rounded text-[6px] border" style={{ borderColor: template.colors.primary, color: template.colors.primary }}>
                        {template.hero.ctaSecondary}
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="absolute bottom-2 left-3 right-3 flex justify-around">
                    {template.hero.stats.slice(0, 4).map((stat, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[8px] font-bold" style={{ color: template.colors.primary }}>
                          {stat.prefix}{stat.value > 1000 ? `${(stat.value / 1000).toFixed(0)}K` : stat.value}{stat.suffix}
                        </p>
                        <p className="text-[5px] opacity-50" style={{ color: template.colors.text }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active badge */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground text-[9px] gap-0.5">
                      <Check className="h-2.5 w-2.5" /> Active
                    </Badge>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <span className="text-lg">{template.thumbnail}</span>
                      {template.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  </div>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-1 mb-3">
                  {Object.values(template.colors).map((color, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: color }} />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">{template.styles.cardStyle}</span>
                </div>

                {/* Sections */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.sections.slice(0, 5).map(section => (
                    <Badge key={section} variant="outline" className="text-[9px] px-1.5 py-0">
                      {section}
                    </Badge>
                  ))}
                  {template.sections.length > 5 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      +{template.sections.length - 5}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => handleApply(template.id)}
                    disabled={applying === template.id || isActive}
                  >
                    {applying === template.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isActive ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {isActive ? 'Applied' : applying === template.id ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{previewTemplate?.thumbnail}</span>
              {previewTemplate?.name} - Preview
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="overflow-y-auto max-h-[70vh]">
              {/* Full preview of the template */}
              <div style={{ backgroundColor: previewTemplate.colors.background, color: previewTemplate.colors.text }} className="min-h-[600px]">
                {/* Navbar */}
                <div className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: previewTemplate.colors.card }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: previewTemplate.colors.primary + '30' }}>
                      <span className="text-sm font-bold" style={{ color: previewTemplate.colors.primary }}>B</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: previewTemplate.colors.primary }}>BNFX</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs opacity-60">Home</span>
                    <span className="text-xs opacity-60">Plans</span>
                    <span className="text-xs opacity-60">About</span>
                    <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: previewTemplate.colors.primary }}>
                      Get Started
                    </button>
                  </div>
                </div>

                {/* Hero */}
                <div className="px-8 py-20 text-center max-w-3xl mx-auto">
                  <h1 className="text-4xl font-bold mb-4">{previewTemplate.hero.headline}</h1>
                  <p className="text-lg opacity-70 mb-8">{previewTemplate.hero.subtitle}</p>
                  <div className="flex gap-3 justify-center mb-12">
                    <button className="px-8 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: previewTemplate.colors.primary }}>
                      {previewTemplate.hero.ctaText}
                    </button>
                    <button className="px-8 py-3 rounded-lg font-semibold border" style={{ borderColor: previewTemplate.colors.primary, color: previewTemplate.colors.primary }}>
                      {previewTemplate.hero.ctaSecondary}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-6">
                    {previewTemplate.hero.stats.map((stat, i) => (
                      <div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: previewTemplate.colors.card }}>
                        <p className="text-2xl font-bold" style={{ color: previewTemplate.colors.primary }}>
                          {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
                        </p>
                        <p className="text-xs opacity-60 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sections indicator */}
                <div className="px-8 py-8 border-t" style={{ borderColor: previewTemplate.colors.card }}>
                  <p className="text-center text-sm opacity-50 mb-4">Sections included in this template:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {previewTemplate.sections.map(section => (
                      <span key={section} className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: previewTemplate.colors.card }}>
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer preview */}
                <div className="px-8 py-6 border-t text-center" style={{ borderColor: previewTemplate.colors.card }}>
                  <p className="text-xs opacity-40">© 2026 BNFX. All rights reserved.</p>
                </div>
              </div>
            </div>
          )}
          <div className="p-4 border-t border-border/50 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
            <Button onClick={() => { handleApply(previewTemplate!.id); setPreviewTemplate(null) }} className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Apply This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
