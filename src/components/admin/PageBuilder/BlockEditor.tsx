'use client'

import { type PageBlock, type BlockType, BLOCK_DEFINITIONS } from './types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface BlockEditorProps {
  block: PageBlock
  onChange: (block: PageBlock) => void
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  const updateContent = (key: string, value: any) => {
    onChange({ ...block, content: { ...block.content, [key]: value } })
  }

  const updateStyle = (key: string, value: any) => {
    onChange({ ...block, style: { ...block.style, [key]: value } })
  }

  const updateArrayItem = (key: string, index: number, field: string, value: any) => {
    const items = [...(block.content[key] || [])]
    items[index] = { ...items[index], [field]: value }
    updateContent(key, items)
  }

  const addArrayItem = (key: string, template: any) => {
    updateContent(key, [...(block.content[key] || []), template])
  }

  const removeArrayItem = (key: string, index: number) => {
    const items = [...(block.content[key] || [])]
    items.splice(index, 1)
    updateContent(key, items)
  }

  return (
    <div className="space-y-4">
      {/* Content Fields */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Content</p>

        {block.type === 'heading' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Text</Label>
              <Input value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <Select value={block.content.level || 'h2'} onValueChange={v => updateContent('level', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(h => <SelectItem key={h} value={h}>{h.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {block.type === 'text' && (
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Textarea value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={4} />
          </div>
        )}

        {block.type === 'image' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={block.content.src || ''} onChange={e => updateContent('src', e.target.value)} placeholder="https://..." /></div>
            <div className="space-y-1"><Label className="text-xs">Alt Text</Label><Input value={block.content.alt || ''} onChange={e => updateContent('alt', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Caption</Label><Input value={block.content.caption || ''} onChange={e => updateContent('caption', e.target.value)} /></div>
          </>
        )}

        {block.type === 'button' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Button Text</Label><Input value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">URL</Label><Input value={block.content.url || ''} onChange={e => updateContent('url', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Variant</Label>
                <Select value={block.content.variant || 'primary'} onValueChange={v => updateContent('variant', v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Select value={block.content.size || 'md'} onValueChange={v => updateContent('size', v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {block.type === 'spacer' && (
          <div className="space-y-1"><Label className="text-xs">Height</Label><Input value={block.content.height || '40px'} onChange={e => updateContent('height', e.target.value)} placeholder="40px" /></div>
        )}

        {block.type === 'hero' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Headline</Label><Input value={block.content.headline || ''} onChange={e => updateContent('headline', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Subtitle</Label><Textarea value={block.content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">CTA Text</Label><Input value={block.content.ctaText || ''} onChange={e => updateContent('ctaText', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">CTA URL</Label><Input value={block.content.ctaUrl || ''} onChange={e => updateContent('ctaUrl', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Background Image</Label><Input value={block.content.backgroundImage || ''} onChange={e => updateContent('backgroundImage', e.target.value)} /></div>
          </>
        )}

        {block.type === 'card' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={block.content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Text</Label><Textarea value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={2} /></div>
            <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={block.content.image || ''} onChange={e => updateContent('image', e.target.value)} /></div>
          </>
        )}

        {block.type === 'testimonial' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Quote</Label><Textarea value={block.content.quote || ''} onChange={e => updateContent('quote', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Author</Label><Input value={block.content.author || ''} onChange={e => updateContent('author', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Role</Label><Input value={block.content.role || ''} onChange={e => updateContent('role', e.target.value)} /></div>
            </div>
          </>
        )}

        {block.type === 'cta' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Headline</Label><Input value={block.content.headline || ''} onChange={e => updateContent('headline', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Text</Label><Input value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Button Text</Label><Input value={block.content.buttonText || ''} onChange={e => updateContent('buttonText', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Button URL</Label><Input value={block.content.buttonUrl || ''} onChange={e => updateContent('buttonUrl', e.target.value)} /></div>
            </div>
          </>
        )}

        {block.type === 'video' && (
          <div className="space-y-1"><Label className="text-xs">Video URL (YouTube)</Label><Input value={block.content.url || ''} onChange={e => updateContent('url', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
        )}

        {block.type === 'icon-box' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Icon (emoji)</Label><Input value={block.content.icon || ''} onChange={e => updateContent('icon', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={block.content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Text</Label><Textarea value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={2} /></div>
          </>
        )}

        {block.type === 'html' && (
          <div className="space-y-1"><Label className="text-xs">HTML Code</Label><Textarea value={block.content.code || ''} onChange={e => updateContent('code', e.target.value)} rows={6} className="font-mono text-xs" /></div>
        )}

        {block.type === 'columns' && (
          <div className="space-y-1">
            <Label className="text-xs">Number of Columns</Label>
            <Select value={String(block.content.count || 2)} onValueChange={v => updateContent('count', parseInt(v))}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Array-based content (features, stats, faq) */}
        {block.type === 'features' && (
          <div className="space-y-2">
            <Label className="text-xs">Features</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="flex gap-2 items-start">
                <Input className="w-12 h-8 text-center" value={item.icon} onChange={e => updateArrayItem('items', i, 'icon', e.target.value)} />
                <Input className="h-8 flex-1" value={item.title} onChange={e => updateArrayItem('items', i, 'title', e.target.value)} placeholder="Title" />
                <Input className="h-8 flex-1" value={item.text} onChange={e => updateArrayItem('items', i, 'text', e.target.value)} placeholder="Text" />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => removeArrayItem('items', i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { icon: '⭐', title: '', text: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
          </div>
        )}

        {block.type === 'stats' && (
          <div className="space-y-2">
            <Label className="text-xs">Stats</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input className="h-8 flex-1" value={item.value} onChange={e => updateArrayItem('items', i, 'value', e.target.value)} placeholder="10K+" />
                <Input className="h-8 flex-1" value={item.label} onChange={e => updateArrayItem('items', i, 'label', e.target.value)} placeholder="Label" />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => removeArrayItem('items', i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { value: '0', label: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
          </div>
        )}

        {block.type === 'faq' && (
          <div className="space-y-2">
            <Label className="text-xs">FAQ Items</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="space-y-1 p-2 rounded bg-muted/20">
                <Input className="h-8" value={item.question} onChange={e => updateArrayItem('items', i, 'question', e.target.value)} placeholder="Question" />
                <Textarea value={item.answer} onChange={e => updateArrayItem('items', i, 'answer', e.target.value)} placeholder="Answer" rows={2} className="text-xs" />
                <Button size="sm" variant="ghost" className="text-rose-400 h-6 text-xs" onClick={() => removeArrayItem('items', i)}>Remove</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { question: '', answer: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add FAQ</Button>
          </div>
        )}
      </div>

      {/* Style Fields */}
      <div className="space-y-3 pt-3 border-t border-border/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Style</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label className="text-[10px]">Background</Label><Input className="h-7 text-xs" value={block.style.backgroundColor || ''} onChange={e => updateStyle('backgroundColor', e.target.value)} placeholder="#000 or transparent" /></div>
          <div className="space-y-1"><Label className="text-[10px]">Text Color</Label><Input className="h-7 text-xs" value={block.style.textColor || ''} onChange={e => updateStyle('textColor', e.target.value)} placeholder="#fff" /></div>
          <div className="space-y-1"><Label className="text-[10px]">Padding</Label><Input className="h-7 text-xs" value={block.style.padding || ''} onChange={e => updateStyle('padding', e.target.value)} placeholder="16px" /></div>
          <div className="space-y-1"><Label className="text-[10px]">Margin</Label><Input className="h-7 text-xs" value={block.style.margin || ''} onChange={e => updateStyle('margin', e.target.value)} placeholder="0" /></div>
          <div className="space-y-1"><Label className="text-[10px]">Border Radius</Label><Input className="h-7 text-xs" value={block.style.borderRadius || ''} onChange={e => updateStyle('borderRadius', e.target.value)} placeholder="8px" /></div>
          <div className="space-y-1">
            <Label className="text-[10px]">Text Align</Label>
            <Select value={block.style.textAlign || 'left'} onValueChange={v => updateStyle('textAlign', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
