'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface Testimonial { id: string; name: string; avatar: string | null; role: string | null; content: string; rating: number; earnings: string | null }

// Country flags mapped by common roles/regions
const COUNTRY_FLAGS: Record<string, string> = {
  'Trader': '🇺🇸',
  'Investor': '🇬🇧',
  'Crypto Enthusiast': '🇩🇪',
  'Day Trader': '🇯🇵',
  'Portfolio Manager': '🇸🇬',
  'DeFi Investor': '🇦🇪',
  'Swing Trader': '🇦🇺',
  'HODLer': '🇨🇦',
  'Yield Farmer': '🇫🇷',
  'Analyst': '🇰🇷',
  'Entrepreneur': '🇮🇳',
  'Student': '🇧🇷',
  'Engineer': '🇳🇱',
  'Freelancer': '🇪🇸',
  'Business Owner': '🇸🇦',
}

const FLAG_LIST = ['🇺🇸', '🇬🇧', '🇩🇪', '🇯🇵', '🇸🇬', '🇦🇪', '🇦🇺', '🇨🇦', '🇫🇷', '🇰🇷', '🇮🇳', '🇧🇷', '🇳🇱', '🇪🇸', '🇸🇦', '🇹🇷', '🇮🇩', '🇳🇬', '🇿🇦', '🇲🇽']

function getFlag(role: string | null, index: number): string {
  if (role && COUNTRY_FLAGS[role]) return COUNTRY_FLAGS[role]
  return FLAG_LIST[index % FLAG_LIST.length]
}

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([])

  useEffect(() => { fetch('/api/testimonials').then(r => r.json()).then(data => { if (Array.isArray(data)) setItems(data) }).catch(() => {}) }, [])

  if (items.length === 0) return null

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4"><Star className="size-3 mr-1" />Testimonials</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">What Our Traders Say</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Join thousands of satisfied investors earning daily returns</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <Card key={item.id} className="bg-card/50 border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">{item.avatar || '👤'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <span className="text-base shrink-0">{getFlag(item.role, idx)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">&ldquo;{item.content}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="size-3.5 text-amber-400 fill-amber-400" />)}</div>
                  {item.earnings && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">{item.earnings}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
