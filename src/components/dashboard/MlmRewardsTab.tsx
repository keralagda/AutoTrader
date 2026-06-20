'use client'

import { Crown, Gift, Star, Trophy, Users, ShieldAlert } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface RewardLevel {
  level: number
  name: string
  reqTv: number
  bonus: number
  gift: string
  description: string
  badgeColor: string
  icon: React.ComponentType<{ className?: string }>
}

const rewardLevels: RewardLevel[] = [
  {
    level: 1,
    name: 'Executive',
    reqTv: 1000,
    bonus: 50,
    gift: 'Nova Executive Writing Pen & Official Executive Badge',
    description: 'Awarded on reaching 1,000 BV. Cash bonus credited instantly to Trading Wallet.',
    badgeColor: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
    icon: Star,
  },
  {
    level: 2,
    name: 'Manager',
    reqTv: 5000,
    bonus: 250,
    gift: 'Montblanc Business Writing Set & Leadership Plaque',
    description: 'Awarded on reaching 5,000 BV. Cash bonus credited instantly to Trading Wallet.',
    badgeColor: 'bg-slate-300/20 text-slate-300 border-slate-300/30',
    icon: Trophy,
  },
  {
    level: 3,
    name: 'Director',
    reqTv: 20000,
    bonus: 1000,
    gift: 'Exclusive Leadership Retreat Invite & 18k Gold VIP Badge',
    description: 'Awarded on reaching 20,000 BV. Cash bonus credited instantly to Trading Wallet.',
    badgeColor: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    icon: Crown,
  },
  {
    level: 4,
    name: 'President',
    reqTv: 100000,
    bonus: 5000,
    gift: '18K Gold President Signet Ring & Luxury Car Program Eligibility',
    description: 'Awarded on reaching 100,000 BV. Cash bonus credited instantly to Trading Wallet.',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    icon: Gift,
  },
]

export function MlmRewardsTab() {
  const { user } = useAppStore()
  const teamVolume = user?.teamVolume || 0
  const currentRank = user?.mlmRank || 'Member'

  // Find next rank progression
  const nextLevelIndex = rewardLevels.findIndex((r) => teamVolume < r.reqTv)
  const nextRank = nextLevelIndex !== -1 ? rewardLevels[nextLevelIndex] : null
  const prevRank = nextLevelIndex !== -1 && nextLevelIndex > 0 ? rewardLevels[nextLevelIndex - 1] : null
  const baseVolume = prevRank ? prevRank.reqTv : 0
  const progressToNext = nextRank
    ? ((teamVolume - baseVolume) / (nextRank.reqTv - baseVolume)) * 100
    : 100

  // Filter rewards: only show if user's volume is enough to unlock it
  const unlockedRewards = rewardLevels.filter((r) => teamVolume >= r.reqTv)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Leadership Gifts & Rewards</h2>
        <p className="text-sm text-muted-foreground">Perform and grow your binary team network volume to unlock luxury rewards.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Team Volume</p>
              <p className="text-xl font-bold text-foreground font-mono">{teamVolume.toLocaleString()} BV</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Leadership Rank</p>
              <p className="text-xl font-bold text-foreground">{currentRank}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Gift className="size-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Gifts Unlocked</p>
              <p className="text-xl font-bold text-foreground">{unlockedRewards.length} / 4</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress towards next reward */}
      {nextRank && (
        <Card className="bg-gradient-to-r from-emerald-500/5 via-card to-violet-500/5 border-emerald-500/15">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Next Rank: {nextRank.name}</span>
              <span className="font-mono text-foreground font-semibold">
                {teamVolume.toLocaleString()} / {nextRank.reqTv.toLocaleString()} BV
              </span>
            </div>
            <Progress value={Math.min(progressToNext, 100)} className="h-2" />
            <p className="text-[11px] text-muted-foreground">
              Accumulate <strong className="text-emerald-400 font-mono">{(nextRank.reqTv - teamVolume).toLocaleString()} BV</strong> more team volume to unlock the {nextRank.name} reward tier.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rewards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Gift className="size-4 text-primary" /> Unlocked Leadership Rewards
        </h3>

        {unlockedRewards.length === 0 ? (
          <Card className="bg-card/50 border-dashed border-border/50 py-12 text-center">
            <CardContent>
              <ShieldAlert className="size-12 text-muted-foreground opacity-40 mx-auto mb-3" />
              <p className="text-sm text-foreground font-semibold">No Leadership Gifts Unlocked Yet</p>
              <p className="text-xs text-muted-foreground mt-1">Gifts and rewards are revealed once your Total Volume reaches 1,000 BV (Executive Rank).</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlockedRewards.map((reward) => {
              const Icon = reward.icon
              return (
                <Card key={reward.level} className="bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30 shadow-lg shadow-emerald-500/5 animate-in fade-in duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30">
                          <Icon className="size-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{reward.name} Tier Reward</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Level {reward.level}</p>
                        </div>
                      </div>
                      <Badge className={reward.badgeColor}>{reward.reqTv.toLocaleString()} BV</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg bg-background/40 border border-border/30 p-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase text-emerald-400">🎁 Physical Gift</p>
                      <p className="text-xs text-foreground/90 font-medium">{reward.gift}</p>
                    </div>

                    <div className="rounded-lg bg-background/40 border border-border/30 p-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase text-cyan-400">💰 Cash Prize Bonus</p>
                      <p className="text-xs text-foreground/90 font-mono font-bold">${reward.bonus.toLocaleString()} USD</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Dispatched & Paid
                      </span>
                      <span className="text-muted-foreground font-mono">Claimed</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
