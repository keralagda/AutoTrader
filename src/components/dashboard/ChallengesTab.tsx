'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import {
  CHALLENGE_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  BADGE_RARITY_LABELS,
  XP_PER_LEVEL,
  type ChallengeCategory,
  type ChallengeDifficulty,
  type BadgeRarity,
} from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Flame,
  Trophy,
  Target,
  Gift,
  Star,
  CheckCircle2,
  Lock,
  Zap,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  CircleDot,
  Timer,
  RefreshCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EnrichedChallenge {
  id: string
  title: string
  description: string
  category: string
  challengeType: string
  targetValue: number
  reward: number
  xpReward: number
  badgeIcon: string
  difficulty: string
  colorTheme: string
  streakBased: boolean
  requireStreakDays: number
  bonusMultiplier: number
  isRecurring: boolean
  recurrencePeriod: string
  startDate: string
  endDate?: string | null
  isActive: boolean
  sortOrder: number
  userProgress: number
  userCompleted: boolean
  userClaimed: boolean
  userStreakCount: number
  userStartedAt: string | null
  userCompletedAt: string | null
  userChallengeId: string | null
}

interface GamificationData {
  stats: {
    xp: number
    level: number
    xpInLevel: number
    xpNeeded: number
    xpPercent: number
    currentStreak: number
    longestStreak: number
    totalCheckIns: number
    challengesCompleted: number
    totalXpEarned: number
    totalUsdcRewards: number
    streakMultiplier: number
  }
  checkIn: {
    canCheckIn: boolean
    todayXp: number
    todayBonus: number
    streakDay: number
  }
  challenges: {
    completed: number
    active: number
    unclaimedRewards: number
  }
  badges: {
    earned: any[]
    locked: any[]
    totalBadges: number
    earnedCount: number
    rarityCounts: Record<string, number>
  }
}

const COLOR_THEMES: Record<string, { bg: string; border: string; text: string; glow: string; gradient: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
    gradient: 'from-rose-500/20 to-rose-500/5',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20',
    gradient: 'from-violet-500/20 to-violet-500/5',
  },
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function ChallengesTab() {
  const { user } = useAppStore()
  const [challenges, setChallenges] = useState<EnrichedChallenge[]>([])
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<any>(null)
  const [showClaimSuccess, setShowClaimSuccess] = useState<{ reward: number; xp: number } | null>(null)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const [challengesRes, gamRes] = await Promise.all([
        fetch(`/api/challenges?userId=${user.id}`),
        fetch(`/api/gamification?userId=${user.id}`),
      ])
      if (challengesRes.ok) setChallenges(await challengesRes.json())
      if (gamRes.ok) setGamification(await gamRes.json())
    } catch (err) {
      console.error('Failed to fetch gamification data:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCheckIn = async () => {
    if (!user?.id || checkInLoading) return
    setCheckInLoading(true)
    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'checkin' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.bonusEarned > 0) {
          setShowClaimSuccess({ reward: data.bonusEarned, xp: data.xpEarned })
        }
        fetchData()
      }
    } catch (err) {
      console.error('Check-in failed:', err)
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleClaim = async (challengeId: string) => {
    if (!user?.id || claimingId) return
    setClaimingId(challengeId)
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          challengeId,
          action: 'claim',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setShowClaimSuccess({ reward: data.rewardAmount || 0, xp: 0 })
        fetchData()
      }
    } catch (err) {
      console.error('Claim failed:', err)
    } finally {
      setClaimingId(null)
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, challengeId, action: 'join' }),
      })
      if (res.ok) fetchData()
    } catch (err) {
      console.error('Join failed:', err)
    }
  }

  // Filter challenges
  const filteredChallenges = activeCategory === 'all'
    ? challenges
    : challenges.filter((c) => c.category === activeCategory)

  const categories = ['all', 'daily', 'weekly', 'milestone', 'streak', 'referral', 'deposit', 'special']

  const stats = gamification?.stats
  const checkIn = gamification?.checkIn
  const badges = gamification?.badges

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Claim Success Toast */}
      <AnimatePresence>
        {showClaimSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-white px-6 py-4 rounded-xl shadow-lg shadow-amber-500/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="size-5" />
              <div>
                <p className="font-bold text-sm">Reward Claimed!</p>
                {showClaimSuccess.reward > 0 && (
                  <p className="text-xs opacity-90">+{formatCurrency(showClaimSuccess.reward)} USDC</p>
                )}
                {showClaimSuccess.xp > 0 && (
                  <p className="text-xs opacity-90">+{showClaimSuccess.xp} XP</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showClaimSuccess && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 3, duration: 0.5 }}
            onAnimationComplete={() => setShowClaimSuccess(null)}
            className="fixed inset-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ─── XP Level Header ─── */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Level Badge */}
            <div className="flex items-center gap-4">
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <div className="size-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <span className="text-3xl font-black text-white">
                    {stats?.level || 1}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-amber-400 flex items-center justify-center">
                  <Star className="size-3.5 text-amber-900" fill="currentColor" />
                </div>
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-xl font-bold">{stats?.level || 1}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats?.totalXpEarned || 0)} Total XP
                </p>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">XP Progress</span>
                <span className="font-medium">
                  {stats?.xpInLevel || 0} / {stats?.xpNeeded || XP_PER_LEVEL} XP
                </span>
              </div>
              <div className="relative">
                <Progress value={stats?.xpPercent || 0} className="h-4" />
                <motion.div
                  className="absolute top-0 h-4 rounded-full bg-gradient-to-r from-amber-400/30 to-amber-400/0"
                  style={{ width: `${stats?.xpPercent || 0}%` }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Level {stats?.level || 1}</span>
                <span>Level {(stats?.level || 1) + 1}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-center">
                <Flame className="size-5 text-violet-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-violet-400">{stats?.currentStreak || 0}</p>
                <p className="text-[10px] text-muted-foreground">Day Streak</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <Trophy className="size-5 text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-400">{badges?.earnedCount || 0}</p>
                <p className="text-[10px] text-muted-foreground">Badges</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <Target className="size-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-400">{gamification?.challenges.completed || 0}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
                <Gift className="size-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-cyan-400">
                  {gamification?.challenges.unclaimedRewards || 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Unclaimed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Daily Check-In Card ─── */}
      <Card className={`border-2 ${checkIn?.canCheckIn ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5' : 'border-border/30 bg-card/50'}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="size-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
                animate={checkIn?.canCheckIn ? { rotate: [0, 5, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Calendar className="size-7 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">Daily Check-In</h3>
                  {stats?.currentStreak && stats.currentStreak > 0 && (
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 gap-1">
                      <Flame className="size-3" />
                      {stats.currentStreak} day streak
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {checkIn?.canCheckIn
                    ? `Check in now to earn ${checkIn.todayXp} XP!`
                    : 'Already checked in today. Come back tomorrow!'}
                  {checkIn?.todayBonus ? ` + ${formatCurrency(checkIn.todayBonus)} USDC bonus!` : ''}
                </p>
                {/* Streak Progress Dots */}
                {stats && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const dayInStreak = (stats.currentStreak % 7) + (checkIn?.canCheckIn ? 0 : 0)
                      const isCompleted = i < (checkIn?.canCheckIn ? stats.currentStreak % 7 : (stats.currentStreak % 7 || 7))
                      const isCurrent = checkIn?.canCheckIn && i === stats.currentStreak % 7
                      return (
                        <motion.div
                          key={i}
                          className={`size-3 rounded-full ${
                            isCompleted
                              ? 'bg-amber-400'
                              : isCurrent
                                ? 'bg-amber-400/50 ring-2 ring-amber-400/30'
                                : 'bg-muted-foreground/20'
                          }`}
                          animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      )
                    })}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {checkIn?.canCheckIn ? `Day ${(stats.currentStreak % 7) + 1} of 7` : `Cycle complete!`}
                      {stats.currentStreak >= 7 && stats.currentStreak % 7 === 0 && ' 🔥 Bonus!'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={!checkIn?.canCheckIn || checkInLoading}
              className={`gap-2 px-6 ${checkIn?.canCheckIn ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30' : ''}`}
              size="lg"
            >
              {checkInLoading ? (
                <RefreshCcw className="size-5 animate-spin" />
              ) : checkIn?.canCheckIn ? (
                <>
                  <Zap className="size-5" />
                  Check In Now
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5" />
                  Checked In ✓
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Main Content Tabs ─── */}
      <Tabs defaultValue="challenges" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="challenges" className="gap-1.5">
            <Target className="size-4" />
            Challenges
            {gamification?.challenges.unclaimedRewards ? (
              <Badge className="ml-1 size-5 p-0 text-[10px] bg-amber-500 text-white rounded-full">
                {gamification.challenges.unclaimedRewards}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-1.5">
            <Award className="size-4" />
            Badges
            <span className="text-xs text-muted-foreground">({badges?.earnedCount || 0}/{badges?.totalBadges || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5">
            <Trophy className="size-4" />
            Rankings
          </TabsTrigger>
        </TabsList>

        {/* ─── Challenges Tab ─── */}
        <TabsContent value="challenges" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => {
              const catInfo = cat === 'all'
                ? { label: 'All', icon: '🎯', color: 'primary' }
                : CHALLENGE_CATEGORY_LABELS[cat as ChallengeCategory]
              const count = cat === 'all'
                ? challenges.length
                : challenges.filter((c) => c.category === cat).length
              if (!catInfo) return null
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setActiveCategory(cat)}
                >
                  <span>{catInfo.icon}</span>
                  <span>{catInfo.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </Button>
              )
            })}
          </div>

          {/* Challenge Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border/30 bg-card/40 animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-2 bg-muted rounded w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredChallenges.length === 0 ? (
            <Card className="border-border/30 bg-card/40">
              <CardContent className="p-8 text-center">
                <Target className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No challenges available in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredChallenges.map((challenge) => {
                const theme = COLOR_THEMES[challenge.colorTheme] || COLOR_THEMES.emerald
                const diffInfo = DIFFICULTY_LABELS[challenge.difficulty as ChallengeDifficulty]
                const progressPercent = challenge.targetValue > 0
                  ? Math.min((challenge.userProgress / challenge.targetValue) * 100, 100)
                  : 0
                const isJoined = !!challenge.userChallengeId
                const isCompleted = challenge.userCompleted
                const isClaimed = challenge.userClaimed
                const canClaim = isCompleted && !isClaimed

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`border ${isClaimed ? 'border-border/20 opacity-70' : canClaim ? `border-amber-500/40 ${theme.glow} shadow-lg` : theme.border} bg-gradient-to-br ${theme.gradient} to-card backdrop-blur-sm overflow-hidden`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`rounded-xl ${theme.bg} p-2.5 shrink-0`}>
                            <span className="text-2xl">{challenge.badgeIcon}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Title Row */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold truncate">{challenge.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{challenge.description}</p>
                              </div>
                              {/* Status Badge */}
                              {isClaimed ? (
                                <Badge className="shrink-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                                  <CheckCircle2 className="size-3" /> Claimed
                                </Badge>
                              ) : isCompleted ? (
                                <Badge className="shrink-0 bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse gap-1">
                                  <Gift className="size-3" /> Ready!
                                </Badge>
                              ) : null}
                            </div>

                            {/* Progress Bar */}
                            {isJoined && !isClaimed && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-muted-foreground">
                                    {challenge.challengeType === 'target'
                                      ? `${challenge.userProgress.toFixed(0)} / ${challenge.targetValue.toFixed(0)}`
                                      : `${Math.round(progressPercent)}%`}
                                  </span>
                                  <span className={theme.text}>
                                    {Math.round(progressPercent)}%
                                  </span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                              </div>
                            )}

                            {/* Tags Row */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="secondary" className={`text-[10px] ${theme.bg} ${theme.text} ${theme.border} border`}>
                                {CHALLENGE_CATEGORY_LABELS[challenge.category as ChallengeCategory]?.label || challenge.category}
                              </Badge>
                              {diffInfo && (
                                <Badge variant="secondary" className="text-[10px] gap-0.5">
                                  {'⭐'.repeat(diffInfo.stars)}
                                </Badge>
                              )}
                              {challenge.bonusMultiplier > 1 && (
                                <Badge className="text-[10px] bg-rose-500/20 text-rose-400 border-rose-500/30">
                                  {challenge.bonusMultiplier}x Bonus
                                </Badge>
                              )}
                              {challenge.isRecurring && (
                                <Badge className="text-[10px] bg-cyan-500/20 text-cyan-400 border-cyan-500/30 gap-0.5">
                                  <RefreshCcw className="size-2.5" />
                                  {challenge.recurrencePeriod}
                                </Badge>
                              )}
                            </div>

                            {/* Rewards Row */}
                            <div className="flex items-center gap-3 text-xs">
                              {challenge.reward > 0 && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Gift className="size-3" />
                                  {formatCurrency(challenge.reward * challenge.bonusMultiplier)} USDC
                                </span>
                              )}
                              {challenge.xpReward > 0 && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Zap className="size-3" />
                                  {challenge.xpReward} XP
                                </span>
                              )}
                            </div>

                            {/* Action Button */}
                            {!isJoined && !isCompleted && (
                              <Button
                                size="sm"
                                className="w-full gap-1.5 mt-1"
                                variant="outline"
                                onClick={() => handleJoinChallenge(challenge.id)}
                              >
                                <CircleDot className="size-3.5" />
                                Start Challenge
                              </Button>
                            )}
                            {canClaim && (
                              <Button
                                size="sm"
                                className="w-full gap-1.5 mt-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20"
                                onClick={() => handleClaim(challenge.id)}
                                disabled={claimingId === challenge.id}
                              >
                                {claimingId === challenge.id ? (
                                  <RefreshCcw className="size-3.5 animate-spin" />
                                ) : (
                                  <Gift className="size-3.5" />
                                )}
                                Claim Reward
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Badges Tab ─── */}
        <TabsContent value="badges" className="space-y-6">
          {/* Badge Rarity Summary */}
          <div className="grid grid-cols-5 gap-2">
            {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as BadgeRarity[]).map((rarity) => {
              const info = BADGE_RARITY_LABELS[rarity]
              const count = badges?.rarityCounts[rarity] || 0
              return (
                <div key={rarity} className={`rounded-lg ${info.bgClass} border ${info.borderClass} p-3 text-center`}>
                  <p className={`text-lg font-bold ${info.color}`}>{count}</p>
                  <p className={`text-[10px] ${info.color}`}>{info.label}</p>
                </div>
              )
            })}
          </div>

          {/* Earned Badges */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" />
              Earned Badges ({badges?.earnedCount || 0})
            </h3>
            {badges && badges.earned.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badges.earned.map((badge: any) => {
                  const rarityInfo = BADGE_RARITY_LABELS[badge.rarity as BadgeRarity]
                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`border ${rarityInfo.borderClass} bg-gradient-to-br from-card to-muted/20 cursor-pointer`}
                        onClick={() => { setSelectedBadge(badge); setShowBadgeModal(true) }}
                      >
                        <CardContent className="p-4 text-center">
                          <motion.div
                            className="text-4xl mb-2"
                            animate={{ rotateY: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 5 }}
                          >
                            {badge.icon}
                          </motion.div>
                          <p className="text-sm font-semibold truncate">{badge.name}</p>
                          <Badge className={`mt-1 text-[10px] ${rarityInfo.bgClass} ${rarityInfo.color} ${rarityInfo.borderClass}`}>
                            {rarityInfo.label}
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <Card className="border-border/30 bg-card/40">
                <CardContent className="p-6 text-center">
                  <Lock className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No badges earned yet. Complete challenges to earn badges!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Locked Badges */}
          {badges && badges.locked.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Lock className="size-4" />
                Locked Badges ({badges.locked.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badges.locked.map((badge: any) => {
                  const rarityInfo = BADGE_RARITY_LABELS[badge.rarity as BadgeRarity]
                  return (
                    <Card
                      key={badge.id}
                      className="border-border/20 bg-card/30 opacity-50"
                      onClick={() => { setSelectedBadge(badge); setShowBadgeModal(true) }}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-4xl mb-2 grayscale opacity-30">🔒</div>
                        <p className="text-sm font-semibold truncate text-muted-foreground">{badge.name}</p>
                        <Badge className={`mt-1 text-[10px] ${rarityInfo.bgClass} ${rarityInfo.color} ${rarityInfo.borderClass} opacity-50`}>
                          {rarityInfo.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Rankings Tab ─── */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="border-border/30 bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="size-5 text-amber-400" />
                Your Gamification Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <StatItem icon={<Star className="size-5 text-amber-400" />} label="Level" value={stats?.level || 1} />
                <StatItem icon={<Zap className="size-5 text-amber-400" />} label="Total XP" value={formatNumber(stats?.totalXpEarned || 0)} />
                <StatItem icon={<Flame className="size-5 text-violet-400" />} label="Current Streak" value={`${stats?.currentStreak || 0} days`} />
                <StatItem icon={<Flame className="size-5 text-violet-400" />} label="Best Streak" value={`${stats?.longestStreak || 0} days`} />
                <StatItem icon={<Calendar className="size-5 text-emerald-400" />} label="Total Check-ins" value={stats?.totalCheckIns || 0} />
                <StatItem icon={<Target className="size-5 text-emerald-400" />} label="Challenges Done" value={stats?.challengesCompleted || 0} />
                <StatItem icon={<TrendingUp className="size-5 text-cyan-400" />} label="USDC Earned" value={formatCurrency(stats?.totalUsdcRewards || 0)} />
                <StatItem icon={<Award className="size-5 text-amber-400" />} label="Badges" value={`${badges?.earnedCount || 0}/${badges?.totalBadges || 0}`} />
              </div>
            </CardContent>
          </Card>

          {/* Streak Milestones */}
          <Card className="border-border/30 bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="size-5 text-violet-400" />
                Streak Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { days: 7, reward: '$5 USDC', icon: '🔥' },
                  { days: 14, reward: '$10 USDC', icon: '⚡' },
                  { days: 30, reward: '$25 USDC', icon: '🌟' },
                  { days: 100, reward: '$100 USDC', icon: '👑' },
                ].map((milestone) => {
                  const achieved = (stats?.currentStreak || 0) >= milestone.days
                  return (
                    <div
                      key={milestone.days}
                      className={`rounded-lg border p-3 text-center ${
                        achieved
                          ? 'bg-violet-500/10 border-violet-500/30'
                          : 'bg-muted/30 border-border/30'
                      }`}
                    >
                      <span className="text-2xl">{achieved ? milestone.icon : '🔒'}</span>
                      <p className="text-sm font-semibold mt-1">{milestone.days} Days</p>
                      <p className={`text-xs ${achieved ? 'text-violet-400' : 'text-muted-foreground'}`}>
                        {achieved ? 'Achieved!' : milestone.reward}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Badge Detail Modal */}
      <Dialog open={showBadgeModal} onOpenChange={setShowBadgeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="size-5 text-amber-400" />
              Badge Details
            </DialogTitle>
            <DialogDescription>
              View badge information and unlock conditions
            </DialogDescription>
          </DialogHeader>
          {selectedBadge && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {badges?.earned.find((b: any) => b.id === selectedBadge.id) ? selectedBadge.icon : '🔒'}
                </motion.div>
                <h3 className="text-xl font-bold">{selectedBadge.name}</h3>
                <Badge className={`mt-2 ${BADGE_RARITY_LABELS[selectedBadge.rarity as BadgeRarity]?.bgClass} ${BADGE_RARITY_LABELS[selectedBadge.rarity as BadgeRarity]?.color} ${BADGE_RARITY_LABELS[selectedBadge.rarity as BadgeRarity]?.borderClass}`}>
                  {BADGE_RARITY_LABELS[selectedBadge.rarity as BadgeRarity]?.label}
                </Badge>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{selectedBadge.description}</p>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">How to earn:</span>
                  <span className="font-medium">{selectedBadge.condition}</span>
                </div>
                {selectedBadge.xpRequired > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">XP Required:</span>
                    <span className="font-medium text-amber-400">{selectedBadge.xpRequired} XP</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border/30 p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
