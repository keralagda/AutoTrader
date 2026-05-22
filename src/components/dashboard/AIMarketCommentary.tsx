'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp } from 'lucide-react'

export function AIMarketCommentary() {
  const [commentary, setCommentary] = useState('')
  const [generatedAt, setGeneratedAt] = useState('')

  useEffect(() => {
    fetch('/api/ai/market-commentary')
      .then(r => r.json())
      .then(data => {
        setCommentary(data.commentary)
        setGeneratedAt(data.generatedAt)
      })
      .catch(() => {})
  }, [])

  if (!commentary) return null

  return (
    <Card className="bg-gradient-to-br from-violet-500/5 to-card border-violet-500/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400">AI Market Analysis</span>
          <Badge variant="outline" className="text-[9px] ml-auto">
            {generatedAt ? new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{commentary}</p>
      </CardContent>
    </Card>
  )
}
