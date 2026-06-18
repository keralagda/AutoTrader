'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  userId: string
  userName: string
  totalEarnings: number
  totalDeposited: number
  totalWithdrawals: number
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
      case 2: return <Medal className="size-5 text-slate-350" />
      case 3: return <Medal className="size-5 text-amber-700" />
      default: return <span className="text-xs font-mono font-bold text-muted-foreground w-5 text-center">#{rank}</span>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-lg">BNFX</span>
          </Link>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
            <Trophy className="size-3.5 mr-1.5 text-amber-400" />
            Public Leaderboard
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/95 to-foreground/80 bg-clip-text">
            🏆 Global Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Live rankings of top earners on the BNFX platform showcasing performance, deposits, and withdrawals.
          </p>
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="w-full space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-muted/40 p-1 border border-border/30 rounded-xl">
            <TabsTrigger value="all_time" className="rounded-lg text-xs font-semibold">Global</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-lg text-xs font-semibold">Regional</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg text-xs font-semibold">Local</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6 outline-none">
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto items-end pt-4 pb-2">
                {/* 2nd Place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar className="size-16 ring-2 ring-slate-400/30 border border-background">
                      <AvatarFallback className="bg-muted text-sm font-bold">
                        {getInitials(entries[1]?.userName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-1 h-6 w-6 rounded-full bg-slate-400/20 border border-slate-400/40 flex items-center justify-center backdrop-blur-sm">
                      <Medal className="size-3 text-slate-350" />
                    </div>
                  </div>
                  <Card className="w-full border-border/50 bg-gradient-to-b from-slate-400/5 to-transparent backdrop-blur-sm">
                    <CardContent className="p-3 text-center space-y-1">
                      <p className="text-xs font-semibold truncate max-w-full text-foreground/90">{entries[1]?.userName}</p>
                      <p className="text-sm font-bold text-foreground">${entries[1]?.totalEarnings.toFixed(2)}</p>
                      <div className="text-[10px] text-muted-foreground space-y-0.5 border-t border-border/30 pt-1 mt-1">
                        <div>Dep: <span className="font-medium text-foreground/80">${entries[1]?.totalDeposited.toFixed(0)}</span></div>
                        <div>Wd: <span className="font-medium text-foreground/80">${entries[1]?.totalWithdrawals.toFixed(0)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center gap-2 sm:scale-105">
                  <div className="relative">
                    <Avatar className="size-20 ring-4 ring-amber-500/20 border border-background">
                      <AvatarFallback className="bg-muted text-base font-bold">
                        {getInitials(entries[0]?.userName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-3 -right-2 h-7 w-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center backdrop-blur-sm">
                      <Crown className="size-4 text-amber-400" />
                    </div>
                  </div>
                  <Card className="w-full border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent backdrop-blur-sm">
                    <CardContent className="p-3.5 text-center space-y-1">
                      <p className="text-sm font-bold truncate max-w-full text-foreground">{entries[0]?.userName}</p>
                      <p className="text-base font-black text-amber-400">${entries[0]?.totalEarnings.toFixed(2)}</p>
                      <div className="text-[10px] text-amber-400/70 space-y-0.5 border-t border-amber-500/20 pt-1 mt-1">
                        <div>Dep: <span className="font-medium text-foreground">${entries[0]?.totalDeposited.toFixed(0)}</span></div>
                        <div>Wd: <span className="font-medium text-foreground">${entries[0]?.totalWithdrawals.toFixed(0)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar className="size-14 ring-2 ring-amber-750/30 border border-background">
                      <AvatarFallback className="bg-muted text-xs font-bold">
                        {getInitials(entries[2]?.userName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-1 h-5 w-5 rounded-full bg-amber-700/20 border border-amber-700/40 flex items-center justify-center backdrop-blur-sm">
                      <Medal className="size-2.5 text-amber-600" />
                    </div>
                  </div>
                  <Card className="w-full border-border/50 bg-gradient-to-b from-amber-700/5 to-transparent backdrop-blur-sm">
                    <CardContent className="p-3 text-center space-y-1">
                      <p className="text-xs font-semibold truncate max-w-full text-foreground/90">{entries[2]?.userName}</p>
                      <p className="text-sm font-bold text-foreground">${entries[2]?.totalEarnings.toFixed(2)}</p>
                      <div className="text-[10px] text-muted-foreground space-y-0.5 border-t border-border/30 pt-1 mt-1">
                        <div>Dep: <span className="font-medium text-foreground/80">${entries[2]?.totalDeposited.toFixed(0)}</span></div>
                        <div>Wd: <span className="font-medium text-foreground/80">${entries[2]?.totalWithdrawals.toFixed(0)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* High-density Table List */}
            <Card className="border-border/40 bg-card/30 backdrop-blur-md overflow-hidden rounded-2xl shadow-xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 bg-muted/10">
                      <TableHead className="w-20 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Rank</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">User / Alias</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Deposited</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Withdrawals</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Total Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow
                        key={entry.userId}
                        className="border-b border-border/40 hover:bg-muted/15 transition-colors"
                      >
                        <TableCell className="text-center font-semibold">
                          <div className="flex justify-center items-center">
                            {getRankIcon(entry.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 ring-1 ring-border/50">
                              <AvatarFallback className="text-xs font-bold bg-muted/70 text-muted-foreground">
                                {getInitials(entry.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm text-foreground/90">
                              {entry.userName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground/80">
                          ${entry.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground/80">
                          ${entry.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-emerald-400">
                          ${entry.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {entries.length === 0 && !loading && (
                <div className="p-16 text-center space-y-2">
                  <Trophy className="size-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-muted-foreground text-sm">No leaderboard data found for this period</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

