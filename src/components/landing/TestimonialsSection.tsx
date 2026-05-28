'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface Testimonial { id: string; name: string; avatar: string | null; role: string | null; content: string; rating: number; earnings: string | null }

// Assign flags based on index for guaranteed multinational display
const COUNTRIES = [
  { flag: '🇺🇸', country: 'United States' },
  { flag: '🇬🇧', country: 'United Kingdom' },
  { flag: '🇦🇪', country: 'UAE' },
  { flag: '🇩🇪', country: 'Germany' },
  { flag: '🇸🇬', country: 'Singapore' },
  { flag: '🇯🇵', country: 'Japan' },
  { flag: '🇦🇺', country: 'Australia' },
  { flag: '🇨🇦', country: 'Canada' },
  { flag: '🇫🇷', country: 'France' },
  { flag: '🇰🇷', country: 'South Korea' },
  { flag: '🇮🇳', country: 'India' },
  { flag: '🇧🇷', country: 'Brazil' },
  { flag: '🇳🇱', country: 'Netherlands' },
  { flag: '🇪🇸', country: 'Spain' },
  { flag: '🇸🇦', country: 'Saudi Arabia' },
  { flag: '🇹🇷', country: 'Turkey' },
  { flag: '🇮🇩', country: 'Indonesia' },
  { flag: '🇳🇬', country: 'Nigeria' },
  { flag: '🇿🇦', country: 'South Africa' },
  { flag: '🇲🇽', country: 'Mexico' },
  { flag: '🇵🇭', country: 'Philippines' },
  { flag: '🇹🇭', country: 'Thailand' },
  { flag: '🇵🇰', country: 'Pakistan' },
  { flag: '🇰🇪', country: 'Kenya' },
]

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
          <p className="text-muted-foreground max-w-xl mx-auto">Join thousands of satisfied investors earning daily returns worldwide</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => {
            const loc = COUNTRIES[idx % COUNTRIES.length]
            return (
              <Card key={item.id} className="bg-card/50 border-border/50 hover:border-primary/20 transition-colors relative overflow-hidden">
                {/* Country flag badge - top right */}
                <div className="absolute top-3 right-3">
                  <span className="text-xl" title={loc.country}>{loc.flag}</span>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">{item.avatar || '👤'}</div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {item.role}
                        <span className="text-[10px] opacity-60">• {loc.country}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">&ldquo;{item.content}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="size-3.5 text-amber-400 fill-amber-400" />)}</div>
                    {item.earnings && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">{item.earnings}</Badge>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
