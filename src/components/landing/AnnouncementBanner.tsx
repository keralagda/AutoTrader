'use client'

import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  category: string
}

export function AnnouncementBanner() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/news?limit=5')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (news.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [news.length])

  if (dismissed || news.length === 0) return null

  const current = news[currentIndex]

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-cyan-500/10 border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs text-foreground truncate">
            <span className="font-medium text-primary">{current.category === 'alert' ? '🚨' : '📢'}</span>
            {' '}{current.title}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
