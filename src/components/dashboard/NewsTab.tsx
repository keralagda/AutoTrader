'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Newspaper, Calendar } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  content: string
  category: string
  publishedAt: string
}

const categoryColors: Record<string, string> = {
  general: 'bg-gray-500/20 text-gray-300',
  update: 'bg-cyan-500/20 text-cyan-400',
  promotion: 'bg-amber-500/20 text-amber-400',
  alert: 'bg-rose-500/20 text-rose-400',
}

export function NewsTab() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(setNews)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">News & Updates</h2>
        <p className="text-sm text-muted-foreground">Stay informed about platform updates</p>
      </div>

      {news.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-8 text-center">
            <Newspaper className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No news articles yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {news.map(item => (
            <Card key={item.id} className="bg-card/50 border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <Badge className={`text-[10px] shrink-0 ${categoryColors[item.category] || categoryColors.general}`}>
                    {item.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
                  <Calendar className="size-3" />
                  {new Date(item.publishedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
