'use client'

import { type PageBlock } from './types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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

  const updateNestedArrayItem = (key: string, rowIdx: number, colIdx: number, value: string) => {
    const rows = (block.content[key] || []).map((r: string[]) => [...r])
    rows[rowIdx][colIdx] = value
    updateContent(key, rows)
  }

  return (
    <div className="space-y-4">
      {/* ─── Content Fields ─── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Content</p>

        {/* HEADING */}
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

        {/* TEXT */}
        {block.type === 'text' && (
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Textarea value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={4} />
          </div>
        )}

        {/* IMAGE */}
        {block.type === 'image' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={block.content.src || ''} onChange={e => updateContent('src', e.target.value)} placeholder="https://..." /></div>
            <div className="space-y-1"><Label className="text-xs">Alt Text</Label><Input value={block.content.alt || ''} onChange={e => updateContent('alt', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Caption</Label><Input value={block.content.caption || ''} onChange={e => updateContent('caption', e.target.value)} /></div>
          </>
        )}

        {/* BUTTON */}
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

        {/* SPACER */}
        {block.type === 'spacer' && (
          <div className="space-y-1"><Label className="text-xs">Height</Label><Input value={block.content.height || '40px'} onChange={e => updateContent('height', e.target.value)} placeholder="40px" /></div>
        )}

        {/* DIVIDER */}
        {block.type === 'divider' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Style</Label>
              <Select value={block.content.style || 'solid'} onValueChange={v => updateContent('style', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Color</Label><Input value={block.content.color || '#333'} onChange={e => updateContent('color', e.target.value)} placeholder="#333" /></div>
          </>
        )}

        {/* COLUMNS */}
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

        {/* CARD */}
        {block.type === 'card' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={block.content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Text</Label><Textarea value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={2} /></div>
            <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={block.content.image || ''} onChange={e => updateContent('image', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Link URL</Label><Input value={block.content.link || ''} onChange={e => updateContent('link', e.target.value)} /></div>
          </>
        )}

        {/* HERO */}
        {block.type === 'hero' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Headline</Label><Input value={block.content.headline || ''} onChange={e => updateContent('headline', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Subtitle</Label><Textarea value={block.content.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">CTA Text</Label><Input value={block.content.ctaText || ''} onChange={e => updateContent('ctaText', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">CTA URL</Label><Input value={block.content.ctaUrl || ''} onChange={e => updateContent('ctaUrl', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Background Image URL</Label><Input value={block.content.backgroundImage || ''} onChange={e => updateContent('backgroundImage', e.target.value)} /></div>
          </>
        )}

        {/* FEATURES */}
        {block.type === 'features' && (
          <div className="space-y-2">
            <Label className="text-xs">Features</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="space-y-1 p-2 rounded bg-muted/20">
                <div className="flex gap-2">
                  <Input className="w-12 h-8 text-center" value={item.icon} onChange={e => updateArrayItem('items', i, 'icon', e.target.value)} placeholder="🚀" />
                  <Input className="h-8 flex-1" value={item.title} onChange={e => updateArrayItem('items', i, 'title', e.target.value)} placeholder="Title" />
                </div>
                <div className="flex gap-2">
                  <Input className="h-8 flex-1" value={item.text} onChange={e => updateArrayItem('items', i, 'text', e.target.value)} placeholder="Description" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => removeArrayItem('items', i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { icon: '⭐', title: '', text: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add Feature</Button>
          </div>
        )}

        {/* TESTIMONIAL */}
        {block.type === 'testimonial' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Quote</Label><Textarea value={block.content.quote || ''} onChange={e => updateContent('quote', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Author</Label><Input value={block.content.author || ''} onChange={e => updateContent('author', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Role</Label><Input value={block.content.role || ''} onChange={e => updateContent('role', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Avatar URL</Label><Input value={block.content.avatar || ''} onChange={e => updateContent('avatar', e.target.value)} placeholder="https://..." /></div>
          </>
        )}

        {/* PRICING */}
        {block.type === 'pricing' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Plan Name</Label><Input value={block.content.name || ''} onChange={e => updateContent('name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Price</Label><Input value={block.content.price || ''} onChange={e => updateContent('price', e.target.value)} placeholder="$99" /></div>
              <div className="space-y-1"><Label className="text-xs">Period</Label><Input value={block.content.period || ''} onChange={e => updateContent('period', e.target.value)} placeholder="/month" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">CTA Text</Label><Input value={block.content.ctaText || ''} onChange={e => updateContent('ctaText', e.target.value)} /></div>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={!!block.content.highlighted} onCheckedChange={v => updateContent('highlighted', v)} />
              <Label className="text-xs">Highlighted / Featured</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Features List</Label>
              {(block.content.features || []).map((f: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <Input className="h-8 flex-1" value={f} onChange={e => {
                    const arr = [...(block.content.features || [])]
                    arr[i] = e.target.value
                    updateContent('features', arr)
                  }} placeholder="Feature" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => {
                    const arr = [...(block.content.features || [])]
                    arr.splice(i, 1)
                    updateContent('features', arr)
                  }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => updateContent('features', [...(block.content.features || []), ''])} className="gap-1"><Plus className="h-3 w-3" /> Add Feature</Button>
            </div>
          </>
        )}

        {/* CTA */}
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

        {/* VIDEO */}
        {block.type === 'video' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Video URL (YouTube / Vimeo)</Label><Input value={block.content.url || ''} onChange={e => updateContent('url', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={block.content.type || 'youtube'} onValueChange={v => updateContent('type', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="direct">Direct MP4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* ICON BOX */}
        {block.type === 'icon-box' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Icon (emoji)</Label><Input value={block.content.icon || ''} onChange={e => updateContent('icon', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={block.content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Text</Label><Textarea value={block.content.text || ''} onChange={e => updateContent('text', e.target.value)} rows={2} /></div>
          </>
        )}

        {/* STATS */}
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
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { value: '0', label: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add Stat</Button>
          </div>
        )}

        {/* FAQ */}
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

        {/* HTML */}
        {block.type === 'html' && (
          <div className="space-y-1"><Label className="text-xs">HTML Code</Label><Textarea value={block.content.code || ''} onChange={e => updateContent('code', e.target.value)} rows={6} className="font-mono text-xs" /></div>
        )}

        {/* COUNTDOWN */}
        {block.type === 'countdown' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={block.content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Target Date</Label>
              <Input type="datetime-local" value={block.content.targetDate ? block.content.targetDate.slice(0, 16) : ''} onChange={e => updateContent('targetDate', new Date(e.target.value).toISOString())} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Style</Label>
              <Select value={block.content.style || 'flip'} onValueChange={v => updateContent('style', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flip">Flip</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* PROGRESS BAR */}
        {block.type === 'progress-bar' && (
          <div className="space-y-2">
            <Label className="text-xs">Progress Bars</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="space-y-1 p-2 rounded bg-muted/20">
                <div className="flex gap-2">
                  <Input className="h-8 flex-1" value={item.label} onChange={e => updateArrayItem('items', i, 'label', e.target.value)} placeholder="Label" />
                  <Input className="h-8 w-16" type="number" min={0} max={100} value={item.value} onChange={e => updateArrayItem('items', i, 'value', parseInt(e.target.value))} placeholder="%" />
                </div>
                <div className="flex gap-2">
                  <Select value={item.color || 'emerald'} onValueChange={v => updateArrayItem('items', i, 'color', v)}>
                    <SelectTrigger className="h-7 flex-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['emerald', 'cyan', 'amber', 'rose', 'violet', 'blue'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => removeArrayItem('items', i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { label: '', value: 50, color: 'emerald' })} className="gap-1"><Plus className="h-3 w-3" /> Add Bar</Button>
          </div>
        )}

        {/* TABS */}
        {block.type === 'tabs' && (
          <div className="space-y-2">
            <Label className="text-xs">Tabs</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="space-y-1 p-2 rounded bg-muted/20">
                <Input className="h-8" value={item.title} onChange={e => updateArrayItem('items', i, 'title', e.target.value)} placeholder="Tab Title" />
                <Textarea value={item.content} onChange={e => updateArrayItem('items', i, 'content', e.target.value)} placeholder="Tab Content" rows={2} className="text-xs" />
                <Button size="sm" variant="ghost" className="text-rose-400 h-6 text-xs" onClick={() => removeArrayItem('items', i)}>Remove</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { title: 'New Tab', content: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add Tab</Button>
          </div>
        )}

        {/* ACCORDION */}
        {block.type === 'accordion' && (
          <div className="space-y-2">
            <Label className="text-xs">Accordion Sections</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="space-y-1 p-2 rounded bg-muted/20">
                <Input className="h-8" value={item.title} onChange={e => updateArrayItem('items', i, 'title', e.target.value)} placeholder="Section Title" />
                <Textarea value={item.content} onChange={e => updateArrayItem('items', i, 'content', e.target.value)} placeholder="Section Content" rows={2} className="text-xs" />
                <Button size="sm" variant="ghost" className="text-rose-400 h-6 text-xs" onClick={() => removeArrayItem('items', i)}>Remove</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { title: '', content: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add Section</Button>
          </div>
        )}

        {/* GALLERY */}
        {block.type === 'gallery' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Layout</Label>
              <Select value={block.content.layout || 'grid'} onValueChange={v => updateContent('layout', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Columns</Label>
              <Select value={String(block.content.columns || 3)} onValueChange={v => updateContent('columns', parseInt(v))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} Columns</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Images</Label>
              {(block.content.images || []).map((img: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <Input className="h-8 flex-1 text-xs" value={img} onChange={e => {
                    const arr = [...(block.content.images || [])]
                    arr[i] = e.target.value
                    updateContent('images', arr)
                  }} placeholder="https://..." />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => {
                    const arr = [...(block.content.images || [])]
                    arr.splice(i, 1)
                    updateContent('images', arr)
                  }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => updateContent('images', [...(block.content.images || []), ''])} className="gap-1"><Plus className="h-3 w-3" /> Add Image URL</Button>
            </div>
          </>
        )}

        {/* SOCIAL LINKS */}
        {block.type === 'social-links' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Display Style</Label>
              <Select value={block.content.style || 'icons'} onValueChange={v => updateContent('style', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="icons">Icons Only</SelectItem>
                  <SelectItem value="buttons">Buttons</SelectItem>
                  <SelectItem value="text">Text Links</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Links</Label>
              {(block.content.links || []).map((link: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <Select value={link.platform} onValueChange={v => updateArrayItem('links', i, 'platform', v)}>
                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['twitter', 'telegram', 'discord', 'facebook', 'instagram', 'youtube', 'linkedin', 'tiktok'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input className="h-8 flex-1 text-xs" value={link.url} onChange={e => updateArrayItem('links', i, 'url', e.target.value)} placeholder="URL" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => removeArrayItem('links', i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => addArrayItem('links', { platform: 'twitter', url: '#' })} className="gap-1"><Plus className="h-3 w-3" /> Add Link</Button>
            </div>
          </>
        )}

        {/* MAP */}
        {block.type === 'map' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Google Maps Embed URL</Label><Textarea value={block.content.embedUrl || ''} onChange={e => updateContent('embedUrl', e.target.value)} rows={3} placeholder="https://maps.google.com/maps?..." className="text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs">Height</Label><Input value={block.content.height || '300px'} onChange={e => updateContent('height', e.target.value)} placeholder="300px" /></div>
          </>
        )}

        {/* FORM */}
        {block.type === 'form' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Submit Button Text</Label><Input value={block.content.submitText || 'Send'} onChange={e => updateContent('submitText', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Success Message</Label><Input value={block.content.successMessage || ''} onChange={e => updateContent('successMessage', e.target.value)} /></div>
            <div className="space-y-2">
              <Label className="text-xs">Form Fields</Label>
              {(block.content.fields || []).map((field: any, i: number) => (
                <div key={i} className="space-y-1 p-2 rounded bg-muted/20">
                  <div className="flex gap-2">
                    <Select value={field.type || 'text'} onValueChange={v => updateArrayItem('fields', i, 'type', v)}>
                      <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['text', 'email', 'tel', 'number', 'textarea', 'select'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="h-7 flex-1 text-xs" value={field.label} onChange={e => updateArrayItem('fields', i, 'label', e.target.value)} placeholder="Label" />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => removeArrayItem('fields', i)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!field.required} onCheckedChange={v => updateArrayItem('fields', i, 'required', v)} />
                    <Label className="text-xs">Required</Label>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => addArrayItem('fields', { type: 'text', label: '', required: false })} className="gap-1"><Plus className="h-3 w-3" /> Add Field</Button>
            </div>
          </>
        )}

        {/* ALERT */}
        {block.type === 'alert' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={block.content.type || 'info'} onValueChange={v => updateContent('type', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={block.content.title || ''} onChange={e => updateContent('title', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Message</Label><Textarea value={block.content.message || ''} onChange={e => updateContent('message', e.target.value)} rows={2} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={!!block.content.dismissible} onCheckedChange={v => updateContent('dismissible', v)} />
              <Label className="text-xs">Dismissible</Label>
            </div>
          </>
        )}

        {/* BADGE ROW */}
        {block.type === 'badge-row' && (
          <div className="space-y-2">
            <Label className="text-xs">Badges</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input className="h-8 flex-1 text-xs" value={item.text} onChange={e => updateArrayItem('items', i, 'text', e.target.value)} placeholder="Badge text" />
                <Select value={item.color || 'emerald'} onValueChange={v => updateArrayItem('items', i, 'color', v)}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['emerald', 'cyan', 'amber', 'rose', 'violet', 'blue', 'slate'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => removeArrayItem('items', i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { text: '', color: 'emerald' })} className="gap-1"><Plus className="h-3 w-3" /> Add Badge</Button>
          </div>
        )}

        {/* LOGO CAROUSEL */}
        {block.type === 'logo-carousel' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Section Title</Label><Input value={block.content.title || ''} onChange={e => updateContent('title', e.target.value)} placeholder="Trusted By" /></div>
            <div className="space-y-1">
              <Label className="text-xs">Scroll Speed</Label>
              <Select value={block.content.speed || 'normal'} onValueChange={v => updateContent('speed', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Logo Image URLs</Label>
              {(block.content.logos || []).map((logo: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <Input className="h-8 flex-1 text-xs" value={logo} onChange={e => {
                    const arr = [...(block.content.logos || [])]
                    arr[i] = e.target.value
                    updateContent('logos', arr)
                  }} placeholder="https://..." />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => {
                    const arr = [...(block.content.logos || [])]
                    arr.splice(i, 1)
                    updateContent('logos', arr)
                  }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => updateContent('logos', [...(block.content.logos || []), ''])} className="gap-1"><Plus className="h-3 w-3" /> Add Logo</Button>
            </div>
          </>
        )}

        {/* TEAM MEMBER */}
        {block.type === 'team-member' && (
          <>
            <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={block.content.name || ''} onChange={e => updateContent('name', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Role / Title</Label><Input value={block.content.role || ''} onChange={e => updateContent('role', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Avatar URL</Label><Input value={block.content.avatar || ''} onChange={e => updateContent('avatar', e.target.value)} placeholder="https://..." /></div>
            <div className="space-y-1"><Label className="text-xs">Bio</Label><Textarea value={block.content.bio || ''} onChange={e => updateContent('bio', e.target.value)} rows={2} /></div>
          </>
        )}

        {/* TIMELINE */}
        {block.type === 'timeline' && (
          <div className="space-y-2">
            <Label className="text-xs">Timeline Events</Label>
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="space-y-1 p-2 rounded bg-muted/20">
                <div className="flex gap-2">
                  <Input className="h-8 w-20 text-xs" value={item.date} onChange={e => updateArrayItem('items', i, 'date', e.target.value)} placeholder="2024" />
                  <Input className="h-8 flex-1 text-xs" value={item.title} onChange={e => updateArrayItem('items', i, 'title', e.target.value)} placeholder="Event Title" />
                </div>
                <div className="flex gap-2">
                  <Input className="h-8 flex-1 text-xs" value={item.description} onChange={e => updateArrayItem('items', i, 'description', e.target.value)} placeholder="Description" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => removeArrayItem('items', i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addArrayItem('items', { date: '', title: '', description: '' })} className="gap-1"><Plus className="h-3 w-3" /> Add Event</Button>
          </div>
        )}

        {/* COMPARISON TABLE */}
        {block.type === 'comparison-table' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Column Headers</Label>
              <div className="flex gap-2 flex-wrap">
                {(block.content.headers || []).map((h: string, i: number) => (
                  <div key={i} className="flex gap-1">
                    <Input className="h-7 w-24 text-xs" value={h} onChange={e => {
                      const arr = [...(block.content.headers || [])]
                      arr[i] = e.target.value
                      updateContent('headers', arr)
                    }} />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => {
                      const headers = [...(block.content.headers || [])]
                      headers.splice(i, 1)
                      const rows = (block.content.rows || []).map((r: string[]) => {
                        const nr = [...r]; nr.splice(i, 1); return nr
                      })
                      onChange({ ...block, content: { ...block.content, headers, rows } })
                    }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => {
                  const headers = [...(block.content.headers || []), 'Column']
                  const rows = (block.content.rows || []).map((r: string[]) => [...r, ''])
                  onChange({ ...block, content: { ...block.content, headers, rows } })
                }}><Plus className="h-3 w-3" /> Col</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Rows</Label>
              {(block.content.rows || []).map((row: string[], ri: number) => (
                <div key={ri} className="flex gap-1 items-center">
                  {row.map((cell: string, ci: number) => (
                    <Input key={ci} className="h-7 flex-1 text-xs" value={cell} onChange={e => updateNestedArrayItem('rows', ri, ci, e.target.value)} />
                  ))}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => {
                    const rows = [...(block.content.rows || [])]
                    rows.splice(ri, 1)
                    updateContent('rows', rows)
                  }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => {
                const cols = (block.content.headers || []).length
                updateContent('rows', [...(block.content.rows || []), Array(cols).fill('')])
              }}><Plus className="h-3 w-3" /> Add Row</Button>
            </div>
          </>
        )}
      </div>

      {/* ─── Style Fields ─── */}
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
