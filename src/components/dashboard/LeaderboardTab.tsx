'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { LeaderboardEntryType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Crown } from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time'

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function PodiumCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntryType
  rank: 1 | 2 | 3
}) {
  const rankConfig = {
    1: {
      bg: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/30',
      icon: <Crown className="size-6 text-amber-400" />,
      label: '1st',
      ring: 'ring-amber-500/40',
      textColor: 'text-amber-400',
      size: 'order-2 sm:scale-110',
    },
    2: {
      bg: 'bg-gradient-to-br from-gray-400/20 to-gray-400/5 border-gray-400/30',
      icon: <Medal className="size-5 text-gray-300" />,
      label: '2nd',
      ring: 'ring-gray-400/40',
      textColor: 'text-gray-300',
      size: 'order-1 sm:order-1',
    },
    3: {
      bg: 'bg-gradient-to-br from-orange-600/20 to-orange-600/5 border-orange-600/30',
      icon: <Medal className="size-5 text-orange-500" />,
      label: '3rd',
      ring: 'ring-orange-500/40',
      textColor: 'text-orange-500',
      size: 'order-3',
    },
  }

  const config = rankConfig[rank]
  const initials = entry.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`flex flex-col items-center gap-2 ${config.size}`}>
      <div className="relative">
        <Avatar className={`size-16 ring-2 ${config.ring}`}>
          <AvatarFallback className="bg-muted font-semibold text-base">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -top-2 -right-1">{config.icon}</div>
      </div>
      <Card className={`w-full border ${config.bg}`}>
        <CardContent className="p-3 text-center">
          <p className="text-sm font-semibold truncate">{entry.userName}</p>
          <p className={`text-lg font-bold ${config.textColor}`}>
            {formatCurrency(entry.totalEarnings)}
          </p>
          <Badge variant="secondary" className="text-[10px]">
            {config.label}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export function LeaderboardTab() {
  const { user } = useAppStore()
  const [entries, setEntries] = useState<LeaderboardEntryType[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('all_time')

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leaderboard?period=${period}&teamOnly=true&userId=${user?.id || ''}`)
      if (res.ok) {
        const json = await res.json()
        setEntries(json)
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [period, user?.id])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)
  const currentUserId = user?.id

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="size-5 text-amber-400" />
          Team Leaderboard
        </h2>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as Period)}
        >
          <TabsList>
            <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
            <TabsTrigger value="all_time" className="text-xs">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Top 3 Podium */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : top3.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-end justify-center gap-4">
          {/* 2nd place */}
          {top3[1] && <PodiumCard entry={top3[1]} rank={2} />}
          {/* 1st place */}
          {top3[0] && <PodiumCard entry={top3[0]} rank={1} />}
          {/* 3rd place */}
          {top3[2] && <PodiumCard entry={top3[2]} rank={3} />}
        </div>
      ) : (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            No leaderboard data available yet
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Team Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Total Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rest.map((entry) => {
                    const isCurrentUser = entry.userId === currentUserId
                    return (
                      <TableRow
                        key={entry.id}
                        className={isCurrentUser ? 'bg-primary/10 border-primary/20' : ''}
                      >
                        <TableCell className="font-mono text-sm">#{entry.rank}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="text-[10px] bg-muted">
                                {entry.userName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {entry.userName}
                            </span>
                            {isCurrentUser && (
                              <Badge className="text-[10px] px-1.5 py-0 h-5 bg-primary/20 text-primary border-primary/30">
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-400">
                          {formatCurrency(entry.totalEarnings)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Also show top 3 in table for completeness */}
                  {top3.map((entry) => {
                    const isCurrentUser = entry.userId === currentUserId
                    return (
                      <TableRow
                        key={entry.id}
                        className={isCurrentUser ? 'bg-primary/10 border-primary/20' : ''}
                      >
                        <TableCell className="font-mono text-sm">#{entry.rank}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="text-[10px] bg-muted">
                                {entry.userName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{entry.userName}</span>
                            {isCurrentUser && (
                              <Badge className="text-[10px] px-1.5 py-0 h-5 bg-primary/20 text-primary border-primary/30">
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-400">
                          {formatCurrency(entry.totalEarnings)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
