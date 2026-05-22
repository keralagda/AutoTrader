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
import {
  Layout, Plus, Save, Eye, Trash2, GripVertical, ChevronLeft,
  Settings2, Layers, PanelLeft, Monitor, Smartphone, Loader2,
  Copy, ArrowUp, ArrowDown, FileText, Globe,
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Layout className="h-5 w-5 text-primary" /> Page Builder</h2>
            <p className="text-sm text-muted-foreground">Create and manage pages with visual drag-and-drop editor</p>
          </div>
          <Button onClick={() => {
            const name = prompt('Page name:')
            if (name) createPage(name)
          }} className="gap-2"><Plus className="h-4 w-4" /> New Page</Button>
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

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBlockPicker(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[600px] max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border/50">
              <h3 className="font-semibold">Add Block</h3>
              <p className="text-xs text-muted-foreground">Choose an element to add to your page</p>
            </div>
            <ScrollArea className="max-h-[50vh]">
              <div className="grid grid-cols-3 gap-2 p-4">
                {(Object.entries(BLOCK_DEFINITIONS) as [BlockType, typeof BLOCK_DEFINITIONS[BlockType]][]).map(([type, def]) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-center"
                  >
                    <span className="text-2xl">{def.icon}</span>
                    <span className="text-xs font-medium">{def.label}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}
