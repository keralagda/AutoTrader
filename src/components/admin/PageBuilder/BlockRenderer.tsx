'use client'

import { type PageBlock } from './types'

// Renders a block in preview mode
export function BlockRenderer({ block }: { block: PageBlock }) {
  const style: React.CSSProperties = {
    backgroundColor: block.style.backgroundColor || undefined,
    color: block.style.textColor || undefined,
    padding: block.style.padding || '16px',
    margin: block.style.margin || '0',
    borderRadius: block.style.borderRadius || undefined,
    textAlign: block.style.textAlign || undefined,
    maxWidth: block.style.maxWidth || undefined,
  }

  switch (block.type) {
    case 'heading': {
      const Tag = (block.content.level || 'h2') as any
      const sizes: Record<string, string> = { h1: 'text-4xl', h2: 'text-3xl', h3: 'text-2xl', h4: 'text-xl', h5: 'text-lg', h6: 'text-base' }
      return <div style={style}><Tag className={`font-bold ${sizes[block.content.level] || 'text-2xl'}`}>{block.content.text}</Tag></div>
    }

    case 'text':
      return <div style={style}><p className="text-sm leading-relaxed">{block.content.text}</p></div>

    case 'image':
      return (
        <div style={style} className="text-center">
          {block.content.src ? (
            <img src={block.content.src} alt={block.content.alt || ''} className="max-w-full h-auto rounded-lg mx-auto" style={{ maxHeight: '300px' }} />
          ) : (
            <div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground">No image set</div>
          )}
          {block.content.caption && <p className="text-xs text-muted-foreground mt-2">{block.content.caption}</p>}
        </div>
      )

    case 'button':
      return (
        <div style={style} className="text-center">
          <button className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            block.content.variant === 'primary' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
            block.content.variant === 'secondary' ? 'bg-muted text-foreground hover:bg-muted/80' :
            'border border-border text-foreground hover:bg-muted'
          } ${block.content.size === 'lg' ? 'text-lg px-8 py-4' : block.content.size === 'sm' ? 'text-xs px-4 py-2' : ''}`}>
            {block.content.text}
          </button>
        </div>
      )

    case 'spacer':
      return <div style={{ height: block.content.height || '40px' }} />

    case 'divider':
      return <div style={style}><hr className="border-border/50" style={{ borderStyle: block.content.style || 'solid', borderColor: block.content.color }} /></div>

    case 'columns':
      return (
        <div style={style} className={`grid gap-4 ${block.content.count === 3 ? 'grid-cols-3' : block.content.count === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {(block.children || []).map(child => (
            <div key={child.id} className="border border-dashed border-border/30 rounded-lg p-2 min-h-[60px]">
              <BlockRenderer block={child} />
            </div>
          ))}
          {(!block.children || block.children.length === 0) && Array.from({ length: block.content.count || 2 }).map((_, i) => (
            <div key={i} className="border border-dashed border-border/30 rounded-lg p-4 min-h-[60px] flex items-center justify-center text-xs text-muted-foreground">
              Column {i + 1}
            </div>
          ))}
        </div>
      )

    case 'card':
      return (
        <div style={style} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden max-w-sm mx-auto">
          {block.content.image && <img src={block.content.image} alt="" className="w-full h-40 object-cover" />}
          <div className="p-4">
            <h3 className="font-semibold text-lg">{block.content.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{block.content.text}</p>
          </div>
        </div>
      )

    case 'hero':
      return (
        <div style={{ ...style, backgroundImage: block.content.backgroundImage ? `url(${block.content.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} className="py-16 text-center rounded-xl">
          <h1 className="text-4xl font-bold mb-4">{block.content.headline}</h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">{block.content.subtitle}</p>
          <button className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600">{block.content.ctaText}</button>
        </div>
      )

    case 'features':
      return (
        <div style={style} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(block.content.items || []).map((item: any, i: number) => (
            <div key={i} className="text-center p-4 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-3xl">{item.icon}</span>
              <h4 className="font-semibold mt-2">{item.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{item.text}</p>
            </div>
          ))}
        </div>
      )

    case 'testimonial':
      return (
        <div style={style} className="text-center max-w-lg mx-auto p-6 rounded-xl bg-muted/20 border border-border/30">
          <p className="text-sm italic">&ldquo;{block.content.quote}&rdquo;</p>
          <div className="mt-3">
            <p className="text-sm font-semibold">{block.content.author}</p>
            <p className="text-xs text-muted-foreground">{block.content.role}</p>
          </div>
        </div>
      )

    case 'pricing':
      return (
        <div style={style} className={`rounded-xl border p-6 max-w-xs mx-auto ${block.content.highlighted ? 'border-emerald-500 bg-emerald-500/5' : 'border-border/50 bg-card/50'}`}>
          <h3 className="font-semibold text-lg">{block.content.name}</h3>
          <div className="mt-2"><span className="text-3xl font-bold">{block.content.price}</span><span className="text-muted-foreground">{block.content.period}</span></div>
          <ul className="mt-4 space-y-2">
            {(block.content.features || []).map((f: string, i: number) => (
              <li key={i} className="text-sm flex items-center gap-2"><span className="text-emerald-400">✓</span>{f}</li>
            ))}
          </ul>
          <button className="w-full mt-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold">{block.content.ctaText}</button>
        </div>
      )

    case 'cta':
      return (
        <div style={style} className="text-center py-12 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <h2 className="text-2xl font-bold">{block.content.headline}</h2>
          <p className="text-muted-foreground mt-2">{block.content.text}</p>
          <button className="mt-4 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold">{block.content.buttonText}</button>
        </div>
      )

    case 'video':
      return (
        <div style={style} className="aspect-video rounded-xl overflow-hidden bg-muted/30">
          {block.content.url ? (
            <iframe src={block.content.url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No video URL set</div>
          )}
        </div>
      )

    case 'icon-box':
      return (
        <div style={style} className="text-center p-6">
          <span className="text-4xl">{block.content.icon}</span>
          <h4 className="font-semibold mt-3">{block.content.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{block.content.text}</p>
        </div>
      )

    case 'stats':
      return (
        <div style={style} className="flex items-center justify-around py-8">
          {(block.content.items || []).map((item: any, i: number) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-emerald-400">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )

    case 'faq':
      return (
        <div style={style} className="space-y-3 max-w-2xl mx-auto">
          {(block.content.items || []).map((item: any, i: number) => (
            <div key={i} className="rounded-lg border border-border/50 p-4">
              <p className="font-semibold text-sm">{item.question}</p>
              <p className="text-xs text-muted-foreground mt-2">{item.answer}</p>
            </div>
          ))}
        </div>
      )

    case 'gifts-perks':
      return (
        <div style={style} className="rounded-xl border border-border/50 bg-card/45 p-6 space-y-4 max-w-4xl mx-auto shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              🏆 {block.content.title || 'Leadership Ranks, Gifts & Perks'}
            </h2>
            {block.content.description && <p className="text-xs text-muted-foreground max-w-2xl mx-auto">{block.content.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {(block.content.items || []).map((item: any, i: number) => {
              const borderColors: Record<string, string> = {
                emerald: 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40',
                cyan: 'border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40',
                purple: 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40',
                amber: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
              }
              const badgeColors: Record<string, string> = {
                emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }

              const borderClass = borderColors[item.badgeColor || 'emerald'] || borderColors.emerald
              const badgeClass = badgeColors[item.badgeColor || 'emerald'] || badgeColors.emerald

              return (
                <div key={i} className={`p-4 rounded-xl border transition-all duration-300 ${borderClass} flex flex-col justify-between space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      {item.rank || 'Rank'}
                    </span>
                    <span className="text-xs font-mono font-bold text-muted-foreground">Vol: {item.reqVolume || '0'}</span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <span>🎁</span> 
                      <span className="text-slate-200">Gift: {item.gift || 'No gift'}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span>⚡</span> 
                      <span>Perk: {item.perk || 'No perk'}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )

    case 'html':
      return <div style={style} dangerouslySetInnerHTML={{ __html: block.content.code || '' }} />

    default:
      return <div style={style} className="p-4 bg-muted/20 rounded text-xs text-muted-foreground">Unknown block: {block.type}</div>
  }
}
