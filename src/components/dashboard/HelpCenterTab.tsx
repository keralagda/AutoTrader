'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Search, Download, ChevronRight, BookOpen, Sparkles, Wallet, TrendingUp, Shield, Gift, Users } from 'lucide-react'
import { USER_HELP_GUIDES } from '@/lib/help-center-data'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Getting Started': BookOpen,
  'Deposits': Wallet,
  'Investing': TrendingUp,
  'Withdrawals': Wallet,
  'Nova Points': Sparkles,
  'Referrals': Users,
  'Security': Shield,
  'Resources': Gift,
}

export function HelpCenterTab() {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = ['all', ...new Set(USER_HELP_GUIDES.map(g => g.category))]

  const filtered = USER_HELP_GUIDES.filter(g => {
    const matchesSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.content.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCategory === 'all' || g.category === activeCategory
    return matchesSearch && matchesCat
  })

  const handleExportPDF = () => {
    const content = USER_HELP_GUIDES.map(g => `## ${g.title}\n**Category:** ${g.category}\n\n${g.content}\n\n---\n`).join('\n')
    const header = `# Black Nova FX - User Guide\n## How to Deposit, Invest, Earn & Withdraw\nGenerated: ${new Date().toLocaleDateString()}\n\n---\n\n`
    const blob = new Blob([header + content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'BNFX-User-Guide.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <HelpCircle className="size-4 text-primary" />
          <span className="text-sm font-medium text-primary">Help Center</span>
        </div>
        <h2 className="text-2xl font-bold">How can we help you?</h2>
        <p className="text-sm text-muted-foreground">Step-by-step guides on deposits, investing, earning, and withdrawals</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for help..." className="pl-9 h-10" />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map(cat => (
          <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat)} className="gap-1.5 capitalize">
            {cat !== 'all' && CATEGORY_ICONS[cat] && (() => { const Icon = CATEGORY_ICONS[cat]; return <Icon className="size-3.5" /> })()}
            {cat === 'all' ? `All (${USER_HELP_GUIDES.length})` : cat}
          </Button>
        ))}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
          <Download className="size-3.5" />Export Guide as PDF
        </Button>
      </div>

      {/* Guides */}
      <div className="space-y-2">
        {filtered.map(guide => {
          const isExpanded = expandedId === guide.id
          return (
            <Card key={guide.id} className={`border-border/50 transition-all cursor-pointer ${isExpanded ? 'border-primary/30 bg-primary/5' : 'hover:border-border'}`} onClick={() => setExpandedId(isExpanded ? null : guide.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[9px] shrink-0">{guide.category}</Badge>
                    <h4 className="text-sm font-medium">{guide.title}</h4>
                  </div>
                  <ChevronRight className={`size-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    {guide.content.split('\n').map((line, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">{line}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="size-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No guides found for your search</p>
          </div>
        )}
      </div>
    </div>
  )
}
