'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AdminLandingEditorTab } from '../AdminLandingEditorTab'
import { AdminTemplatesTab } from '../AdminTemplatesTab'
import { HeaderBuilder } from './HeaderBuilder'
import { FooterBuilder } from './FooterBuilder'
import {
  Layout, Plus, Save, Eye, Trash2, GripVertical, ChevronLeft,
  Settings2, Layers, PanelLeft, Monitor, Smartphone, Loader2,
  Copy, ArrowUp, ArrowDown, FileText, Globe, Sparkles, Palette
} from 'lucide-react'
import { type PageBlock, type BlockType, type PageData, BLOCK_DEFINITIONS } from './types'
import { BlockRenderer } from './BlockRenderer'
import { BlockEditor } from './BlockEditor'

function generateId() {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
}

export function PageBuilderTab() {
  const { toast } = useToast()
  const [pages, setPages] = useState<{ id: string; name: string; slug: string; published?: boolean }[]>([])
  const [currentPage, setCurrentPage] = useState<PageData | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [view, setView] = useState<'list' | 'editor'>('list')

  // AI Prompt Page Builder states
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPageName, setAiPageName] = useState('')
  const [aiPageSlug, setAiPageSlug] = useState('')
  const [selectedPromptIdx, setSelectedPromptIdx] = useState<number | 'custom'>('custom')
  const [aiPromptText, setAiPromptText] = useState('')
  const [generatingWithAi, setGeneratingWithAi] = useState(false)

  const PREDEFINED_PROMPTS = [
    {
      name: 'Terms of Service',
      slug: '/terms',
      prompt: 'Write a comprehensive Terms of Service for BNFX, an advanced crypto investment and automated yield allocation platform. Define terms of service, user requirements, payment rules, security policies, and liabilities. Format with clear headings and paragraphs.',
    },
    {
      name: 'Privacy Policy',
      slug: '/privacy',
      prompt: 'Write a detailed Privacy Policy for BNFX, a crypto yield generation platform. Specify how user data (emails, transaction histories, wallet addresses) is collected, stored, and protected. Mention cookie policies and compliance with international regulations.',
    },
    {
      name: 'Risk Disclosure & Disclaimer',
      slug: '/risk-disclosure',
      prompt: 'Write a professional Risk Disclosure statement for BNFX. Explain the inherent risks of crypto assets, volatility, smart contract failures, automated trading systems, and the possibility of capital loss. Emphasize that past performance is not indicative of future results.',
    },
    {
      name: 'About Us',
      slug: '/about',
      prompt: 'Write an inspiring About Us page for BNFX. Explain our mission to bridge quantitative trading algorithms with retail investors. Detail our core pillars: algorithmic transparency, institutional-grade security, and dynamic yields.',
    },
    {
      name: 'Frequently Asked Questions (FAQ)',
      slug: '/faq',
      prompt: 'Write a structured FAQ for BNFX. Include answers to common questions: How do I deposit/withdraw? What are the returns based on? How does the binary MLM referral system work? Is my capital secure?',
    }
  ]

  const handlePromptSelect = (idx: string) => {
    if (idx === 'custom') {
      setSelectedPromptIdx('custom')
      setAiPromptText('')
    } else {
      const parsedIdx = parseInt(idx)
      const selected = PREDEFINED_PROMPTS[parsedIdx]
      if (selected) {
        setSelectedPromptIdx(parsedIdx)
        setAiPageName(selected.name)
        setAiPageSlug(selected.slug)
        setAiPromptText(selected.prompt)
      }
    }
  }

  const handleAiGenerate = async () => {
    if (!aiPageName) {
      toast({ title: 'Please enter a page name', variant: 'destructive' })
      return
    }
    setGeneratingWithAi(true)
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'page',
          prompt: aiPromptText || `Write a content page for ${aiPageName}. Include relevant sections.`,
        }),
      })
      if (!res.ok) throw new Error('AI generation failed')
      const data = await res.json()
      
      // Build block structure from AI content
      const pageBlocks = [
        {
          id: `blk_${Date.now()}_h`,
          type: 'heading' as const,
          content: { text: data.title || aiPageName, level: 'h1' },
          style: { padding: '24px 0px', textAlign: 'center' as const }
        },
        {
          id: `blk_${Date.now()}_t`,
          type: 'text' as const,
          content: { text: data.content || 'Content generation failed' },
          style: { padding: '16px 0px', textAlign: 'left' as const }
        }
      ]

      // Post this to page builder route
      const createRes = await fetch('/api/admin/page-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiPageName,
          slug: aiPageSlug || `/${aiPageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          blocks: pageBlocks,
          published: true,
        }),
      })
      
      if (createRes.ok) {
        toast({ title: 'Page generated and created successfully!' })
        setShowAiModal(false)
        setAiPageName('')
        setAiPageSlug('')
        setAiPromptText('')
        setSelectedPromptIdx('custom')
        loadPages()
      } else {
        toast({ title: 'Failed to save generated page', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'AI generation failed', variant: 'destructive' })
    } finally {
      setGeneratingWithAi(false)
    }
  }

  useEffect(() => { loadPages() }, [])

  const loadPages = async () => {
    try {
      const res = await fetch('/api/admin/page-builder')
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const loadPage = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/page-builder?id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentPage({ id, ...data })
        setView('editor')
      }
    } catch {
      toast({ title: 'Failed to load page', variant: 'destructive' })
    }
  }

  const createPage = async (name: string) => {
    try {
      const res = await fetch('/api/admin/page-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, blocks: [] }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Page created!' })
        loadPages()
        setCurrentPage({ id: data.id, name: data.name, slug: data.slug, blocks: [], published: true })
        setView('editor')
      }
    } catch {
      toast({ title: 'Failed to create page', variant: 'destructive' })
    }
  }

  const savePage = async () => {
    if (!currentPage) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/page-builder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPage),
      })
      if (res.ok) {
        toast({ title: 'Page saved!' })
        loadPages()
      } else {
        toast({ title: 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const deletePage = async (id: string) => {
    if (!confirm('Delete this page?')) return
    await fetch(`/api/admin/page-builder?id=${id}`, { method: 'DELETE' })
    loadPages()
    if (currentPage?.id === id) { setCurrentPage(null); setView('list') }
  }

  const addBlock = (type: BlockType) => {
    if (!currentPage) return
    const def = BLOCK_DEFINITIONS[type]
    const newBlock: PageBlock = {
      id: generateId(),
      type,
      content: { ...def.defaultContent },
      style: { padding: '16px', textAlign: 'left' },
    }
    setCurrentPage({ ...currentPage, blocks: [...currentPage.blocks, newBlock] })
    setSelectedBlockId(newBlock.id)
    setShowBlockPicker(false)
  }

  const updateBlock = (updatedBlock: PageBlock) => {
    if (!currentPage) return
    setCurrentPage({
      ...currentPage,
      blocks: currentPage.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b),
    })
  }

  const deleteBlock = (id: string) => {
    if (!currentPage) return
    setCurrentPage({ ...currentPage, blocks: currentPage.blocks.filter(b => b.id !== id) })
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    if (!currentPage) return
    const blocks = [...currentPage.blocks]
    const index = blocks.findIndex(b => b.id === id)
    if (direction === 'up' && index > 0) {
      [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]]
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]]
    }
    setCurrentPage({ ...currentPage, blocks })
  }

  const duplicateBlock = (id: string) => {
    if (!currentPage) return
    const block = currentPage.blocks.find(b => b.id === id)
    if (!block) return
    const newBlock = { ...block, id: generateId(), content: { ...block.content }, style: { ...block.style } }
    const index = currentPage.blocks.findIndex(b => b.id === id)
    const blocks = [...currentPage.blocks]
    blocks.splice(index + 1, 0, newBlock)
    setCurrentPage({ ...currentPage, blocks })
  }

  const selectedBlock = currentPage?.blocks.find(b => b.id === selectedBlockId)

  // ─── Page List View ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="pages" className="w-full">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><Layout className="h-5 w-5 text-primary" /> Page Workspace</h2>
              <p className="text-sm text-muted-foreground">Manage layout templates, landing page sections, custom pages, and global header/footer</p>
            </div>
            <TabsList className="bg-muted p-1 rounded-lg">
              <TabsTrigger value="pages" className="gap-1.5"><FileText className="size-3.5" />Custom Pages</TabsTrigger>
              <TabsTrigger value="landing" className="gap-1.5"><Layers className="size-3.5" />Landing Sections</TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5"><Palette className="size-3.5" />Layout Templates</TabsTrigger>
              <TabsTrigger value="header-footer" className="gap-1.5"><PanelLeft className="size-3.5" />Header & Footer</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pages" className="mt-4 space-y-4">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAiModal(true)} className="gap-1.5 text-xs h-9 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"><Sparkles className="size-3.5" /> Generate Page with AI</Button>
              <Button onClick={() => {
                const name = prompt('Page name:')
                if (name) createPage(name)
              }} className="gap-2 text-xs h-9"><Plus className="h-4 w-4" /> New Page</Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Default pages */}
                {[
                  { id: 'landing', name: 'Landing Page', slug: '/', icon: '🏠' },
                ].map(page => (
                  <Card key={page.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => loadPage(page.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{page.icon}</span>
                        <div>
                          <p className="font-medium">{page.name}</p>
                          <p className="text-xs text-muted-foreground">{page.slug}</p>
                        </div>
                      </div>
                      <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Default</Badge>
                    </CardContent>
                  </Card>
                ))}

                {/* Custom pages */}
                {pages.map(page => (
                  <Card key={page.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => loadPage(page.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{page.name}</p>
                          <p className="text-xs text-muted-foreground">{page.slug}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={(e) => { e.stopPropagation(); deletePage(page.id) }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Badge className={`mt-2 text-[10px] ${page.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        {page.published ? 'Published' : 'Draft'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="landing" className="mt-4">
            <AdminLandingEditorTab />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <AdminTemplatesTab />
          </TabsContent>

          <TabsContent value="header-footer" className="mt-4 space-y-6">
            <HeaderBuilder />
            <FooterBuilder />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // ─── Editor View ────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('list')} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Pages
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm font-medium">{currentPage?.name}</span>
          <Badge variant="outline" className="text-[10px]">{currentPage?.slug}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
            <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-background shadow-sm' : ''}`}><Monitor className="h-3.5 w-3.5" /></button>
            <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-background shadow-sm' : ''}`}><Smartphone className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Published</Label>
            <Switch checked={currentPage?.published} onCheckedChange={v => currentPage && setCurrentPage({ ...currentPage, published: v })} />
          </div>
          <Button size="sm" onClick={savePage} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block List */}
        <div className="w-56 border-r border-border/50 bg-card/30 shrink-0 flex flex-col">
          <div className="p-3 border-b border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5"><Layers className="h-3 w-3" /> Blocks ({currentPage?.blocks.length || 0})</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {currentPage?.blocks.map((block, i) => (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`flex items-center gap-2 p-2 rounded-md text-xs cursor-pointer transition-colors ${
                    selectedBlockId === block.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
                  <span>{BLOCK_DEFINITIONS[block.type]?.icon}</span>
                  <span className="flex-1 truncate">{BLOCK_DEFINITIONS[block.type]?.label}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }} className="p-0.5 hover:text-primary"><ArrowUp className="h-2.5 w-2.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }} className="p-0.5 hover:text-primary"><ArrowDown className="h-2.5 w-2.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 border-t border-border/30">
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => setShowBlockPicker(true)}>
              <Plus className="h-3 w-3" /> Add Block
            </Button>
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 overflow-y-auto bg-background/50 p-4">
          <div className={`mx-auto transition-all ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-4xl'}`}>
            {currentPage?.blocks.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border/30 rounded-xl">
                <Layout className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No blocks yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Block&quot; to start building</p>
                <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowBlockPicker(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add First Block
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {currentPage?.blocks.map(block => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`relative group rounded-lg transition-all ${
                      selectedBlockId === block.id ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-border'
                    }`}
                  >
                    {/* Block toolbar */}
                    <div className={`absolute -top-3 right-2 flex items-center gap-1 bg-card border border-border rounded-md shadow-sm px-1 py-0.5 z-10 ${selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }} className="p-1 hover:text-primary"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }} className="p-1 hover:text-primary"><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id) }} className="p-1 hover:text-primary"><Copy className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }} className="p-1 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <BlockRenderer block={block} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Properties Panel */}
        <div className="w-72 border-l border-border/50 bg-card/30 shrink-0 flex flex-col">
          <div className="p-3 border-b border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <Settings2 className="h-3 w-3" /> {selectedBlock ? BLOCK_DEFINITIONS[selectedBlock.type]?.label : 'Properties'}
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {selectedBlock ? (
                <BlockEditor block={selectedBlock} onChange={updateBlock} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Select a block to edit its properties</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* AI Page Generation Modal */}
      {showAiModal && (
        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="max-w-lg bg-card border border-border/80 rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5"><Sparkles className="size-5 text-primary" /> Generate Page with AI</DialogTitle>
              <DialogDescription>Use AI to generate professional content (like policies, disclosures, FAQs) and build pages instantly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Template (Predefined Prompt)</Label>
                <select
                  value={selectedPromptIdx}
                  onChange={e => handlePromptSelect(e.target.value)}
                  className="w-full text-xs bg-background border border-border/50 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="custom">Custom Page (Blank / Custom Prompt)</option>
                  {PREDEFINED_PROMPTS.map((p, i) => (
                    <option key={i} value={i}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Page Name</Label>
                  <Input value={aiPageName} onChange={e => setAiPageName(e.target.value)} placeholder="e.g. Terms of Service" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Page Slug</Label>
                  <Input value={aiPageSlug} onChange={e => setAiPageSlug(e.target.value)} placeholder="e.g. /terms" className="h-9 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">AI Prompt Instructions</Label>
                <Textarea
                  value={aiPromptText}
                  onChange={e => setAiPromptText(e.target.value)}
                  placeholder="Describe the content of the page, layout requirements, or key sections you want to generate."
                  rows={4}
                  className="text-xs bg-background"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAiModal(false)} disabled={generatingWithAi}>Cancel</Button>
              <Button size="sm" onClick={handleAiGenerate} disabled={generatingWithAi} className="gap-1.5">
                {generatingWithAi ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {generatingWithAi ? 'Generating...' : 'Generate & Create Page'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Block Picker Modal - WPBakery Style with categories, search, pagination */}
      {showBlockPicker && (
        <BlockPickerModal onSelect={addBlock} onClose={() => setShowBlockPicker(false)} />
      )}
    </div>
  )
}

// ─── Block Picker Modal (WPBakery style) ─────────────────────────────────────
function BlockPickerModal({ onSelect, onClose }: { onSelect: (type: BlockType) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [page, setPage] = useState(0)
  const ITEMS_PER_PAGE = 12

  const allBlocks = Object.entries(BLOCK_DEFINITIONS) as [BlockType, typeof BLOCK_DEFINITIONS[BlockType]][]
  const categories = ['All', ...new Set(allBlocks.map(([, def]) => def.category))]

  const filtered = allBlocks.filter(([type, def]) => {
    const matchesSearch = !search || def.label.toLowerCase().includes(search.toLowerCase()) || def.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || def.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

  // Reset page when filter changes
  const handleCategoryChange = (cat: string) => { setActiveCategory(cat); setPage(0) }
  const handleSearchChange = (val: string) => { setSearch(val); setPage(0) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-[720px] max-w-[95vw] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Add Element</h3>
              <p className="text-xs text-muted-foreground">{filtered.length} widgets available</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              placeholder="Search widgets..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {paginated.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No widgets found</p>
              <p className="text-xs mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {paginated.map(([type, def]) => (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all text-center group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{def.icon}</span>
                  <span className="text-xs font-semibold">{def.label}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-2">{def.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} • Showing {paginated.length} of {filtered.length}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-border/50 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`size-7 rounded-md text-xs font-medium ${page === pageNum ? 'bg-primary text-primary-foreground' : 'border border-border/50 hover:bg-muted'}`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-border/50 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
