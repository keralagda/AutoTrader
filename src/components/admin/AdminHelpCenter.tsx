'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HelpCircle, Search, BookOpen, Download, ChevronRight, FileText } from 'lucide-react'
import { ADMIN_HELP_GUIDES } from '@/lib/help-center-data'

export function AdminHelpCenter() {
  const [search, setSearch] = useState('')
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = ['all', ...new Set(ADMIN_HELP_GUIDES.map(g => g.category))]

  const filtered = ADMIN_HELP_GUIDES.filter(g => {
    const matchesSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.content.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCategory === 'all' || g.category === activeCategory
    return matchesSearch && matchesCat
  })

  const selected = ADMIN_HELP_GUIDES.find(g => g.id === selectedGuide)

  const handleExportPDF = () => {
    const content = ADMIN_HELP_GUIDES.map(g => `## ${g.title}\n**Category:** ${g.category}\n\n${g.content}\n\n---\n`).join('\n')
    const header = `# BNFX Admin Help Center\n## Complete Platform Guide\nGenerated: ${new Date().toLocaleDateString()}\n\n---\n\n`
    const blob = new Blob([header + content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'BNFX-Admin-Help-Center.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><HelpCircle className="size-5 text-primary" />Admin Help Center</h2>
          <p className="text-sm text-muted-foreground">{ADMIN_HELP_GUIDES.length} guides covering all platform features</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
          <Download className="size-3.5" />Export as PDF
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-280px)]">
        {/* Sidebar */}
        <div className="w-80 shrink-0 flex flex-col border border-border/50 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guides..." className="pl-8 h-8 text-xs" />
            </div>
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {filtered.map(guide => (
                <button key={guide.id} onClick={() => setSelectedGuide(guide.id)} className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${selectedGuide === guide.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'}`}>
                  <div className="flex items-center gap-2">
                    <FileText className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{guide.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] mt-1 ml-5">{guide.category}</Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Content */}
        <div className="flex-1 border border-border/50 rounded-xl overflow-hidden">
          {selected ? (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div>
                  <Badge className="mb-2">{selected.category}</Badge>
                  <h3 className="text-lg font-bold">{selected.title}</h3>
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  {selected.content.split('\n').map((line, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div>
                <BookOpen className="size-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Select a guide from the left to read</p>
                <p className="text-[10px] text-muted-foreground mt-1">{ADMIN_HELP_GUIDES.length} guides available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
