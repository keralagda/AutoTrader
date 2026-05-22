'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  userId: string
  userName: string
  totalEarnings: number
  rank: number
}

export default function PublicLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState('all_time')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="size-5 text-amber-400" />
      case 2: return <Medal className="size-5 text-slate-300" />
      case 3: return <Medal className="size-5 text-amber-600" />
      default: return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-amber-500/10 border-amber-500/30'
      case 2: return 'bg-slate-400/10 border-slate-400/30'
      case 3: return 'bg-amber-700/10 border-amber-700/30'
      default: return 'bg-card/50 border-border/50'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <span className="font-bold">Auto Trade</span>
          </Link>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Trophy className="size-3 mr-1" />
            Public Leaderboard
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🏆 Leaderboard</h1>
          <p className="text-muted-foreground">Top earners on Auto Trade platform</p>
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="all_time">Global</TabsTrigger>
            <TabsTrigger value="monthly">Regional</TabsTrigger>
            <TabsTrigger value="weekly">Local</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-6">
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* 2nd Place */}
                <div className="flex flex-col items-center pt-8">
                  <div className="h-12 w-12 rounded-full bg-slate-400/20 border-2 border-slate-400/50 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-slate-300">2</span>
                  </div>
                  <p className="text-xs font-medium truncate max-w-full">{entries[1]?.userName}</p>
                  <p className="text-xs text-slate-300 font-bold">${entries[1]?.totalEarnings.toFixed(2)}</p>
                </div>
                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <Crown className="size-6 text-amber-400 mb-1" />
                  <div className="h-14 w-14 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-amber-400">1</span>
                  </div>
                  <p className="text-sm font-bold truncate max-w-full">{entries[0]?.userName}</p>
                  <p className="text-sm text-amber-400 font-bold">${entries[0]?.totalEarnings.toFixed(2)}</p>
                </div>
                {/* 3rd Place */}
                <div className="flex flex-col items-center pt-12">
                  <div className="h-10 w-10 rounded-full bg-amber-700/20 border-2 border-amber-700/50 flex items-center justify-center mb-2">
                    <span className="text-base font-bold text-amber-600">3</span>
                  </div>
                  <p className="text-xs font-medium truncate max-w-full">{entries[2]?.userName}</p>
                  <p className="text-xs text-amber-600 font-bold">${entries[2]?.totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Full List */}
            <div className="space-y-2">
              {entries.map(entry => (
                <Card key={entry.userId} className={`${getRankBg(entry.rank)} transition-colors`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.userName}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">
                      ${entry.totalEarnings.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {entries.length === 0 && !loading && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-8 text-center">
                    <Trophy className="size-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No leaderboard data yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
