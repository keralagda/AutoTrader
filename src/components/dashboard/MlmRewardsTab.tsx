'use client'

import { useState, useEffect } from 'react'
import { Crown, Gift, Star, Trophy, Users, ShieldAlert, CheckCircle, Clock, RefreshCw, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface RewardLevel {
  level: number
  name: string
  reqPv: number
  reqBv: number
  reqTv: number
  bonus: number
  gift: string
  perks: string
  reqMinPersonalInvestment?: number
  reqRequiredPlanId?: string
  reqLeftVolume?: number
  reqRightVolume?: number
  reqWeakerLegVolume?: number
  reqDirectReferrals?: number
  reqActiveDirects?: number
  reqDirectsWithMinRankLevel?: number
  reqDirectsWithMinRankCount?: number
}

// Fallback reward levels if loading fails
const defaultRewardLevels: RewardLevel[] = [
  { level: 0, name: 'Member', reqPv: 0, reqBv: 0, reqTv: 0, bonus: 0, gift: 'None', perks: 'Access to basic plan' },
  {
    level: 1,
    name: 'Executive',
    reqPv: 100,
    reqBv: 500,
    reqTv: 1000,
    bonus: 50,
    gift: 'Nova Executive Writing Pen & Official Executive Badge',
    perks: 'Executive Badge, 5% pairing limit increase',
    reqMinPersonalInvestment: 100,
    reqLeftVolume: 500,
    reqRightVolume: 500
  },
  {
    level: 2,
    name: 'Manager',
    reqPv: 500,
    reqBv: 2500,
    reqTv: 5000,
    bonus: 250,
    gift: 'Montblanc Business Writing Set & Leadership Plaque',
    perks: 'Manager Badge, 10% pairing limit increase',
    reqMinPersonalInvestment: 250,
    reqLeftVolume: 2000,
    reqRightVolume: 2000,
    reqActiveDirects: 2
  },
  {
    level: 3,
    name: 'Director',
    reqPv: 2000,
    reqBv: 10000,
    reqTv: 20000,
    bonus: 1000,
    gift: 'Exclusive Leadership Retreat Invite & 18k Gold VIP Badge',
    perks: 'Director Badge, Retreat invite, 15% pairing limit increase',
    reqMinPersonalInvestment: 1000,
    reqLeftVolume: 10000,
    reqRightVolume: 10000,
    reqActiveDirects: 4,
    reqDirectsWithMinRankLevel: 1,
    reqDirectsWithMinRankCount: 2
  },
  {
    level: 4,
    name: 'President',
    reqPv: 10000,
    reqBv: 50000,
    reqTv: 100000,
    bonus: 5000,
    gift: '18K Gold President Signet Ring & Luxury Car Program Eligibility',
    perks: 'President Ring, Luxury car program, 20% pairing limit increase',
    reqMinPersonalInvestment: 2500,
    reqLeftVolume: 50000,
    reqRightVolume: 50000,
    reqActiveDirects: 6,
    reqDirectsWithMinRankLevel: 2,
    reqDirectsWithMinRankCount: 2
  },
]

export function MlmRewardsTab() {
  const { user } = useAppStore()
  
  // Local state
  const [profile, setProfile] = useState<any>(null)
  const [rewardLevels, setRewardLevels] = useState<RewardLevel[]>(defaultRewardLevels)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMlmData() {
      if (!user?.id) return
      setLoading(true)
      try {
        // 1. Fetch user extended profile metrics
        const profileRes = await fetch(`/api/profile?userId=${user.id}`)
        if (!profileRes.ok) throw new Error('Failed to fetch profile details')
        const profileData = await profileRes.json()
        setProfile(profileData)

        // 2. Fetch plans list to grab custom mlmRewardsConfig if it exists
        const plansRes = await fetch('/api/plans')
        if (plansRes.ok) {
          const plansList = await plansRes.json()
          
          // Find the user's active binary plan
          const activeBinaryPlan = plansList.find((p: any) => 
            p.isBinaryMlmEnabled && 
            profileData.activePlanIds?.includes(p.id)
          ) || plansList.find((p: any) => p.isBinaryMlmEnabled)

          if (activeBinaryPlan?.mlmRewardsConfig) {
            const parsed = JSON.parse(activeBinaryPlan.mlmRewardsConfig)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRewardLevels(parsed)
            }
          }
        }
      } catch (err) {
        console.error('Error loading user rewards config:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMlmData()
  }, [user?.id])

  // Volume metrics fallbacks
  const teamVolume = profile?.teamVolume ?? user?.teamVolume ?? 0
  const personalVolume = profile?.personalVolume ?? user?.personalVolume ?? 0
  const businessVolume = profile?.businessVolume ?? user?.businessVolume ?? 0
  
  const leftVolume = profile?.binaryTreeLeftVolume ?? user?.binaryTreeLeftVolume ?? 0
  const rightVolume = profile?.binaryTreeRightVolume ?? user?.binaryTreeRightVolume ?? 0
  const weakerVolume = Math.min(leftVolume, rightVolume)
  
  const personalInvestment = profile?.totalActiveInvestment ?? profile?.investmentAmount ?? 0
  const directsCount = profile?.directsCount ?? 0
  const activeDirectsCount = profile?.activeDirectsCount ?? 0
  const activePlanIds = profile?.activePlanIds ?? []

  const currentRank = profile?.mlmRank ?? user?.mlmRank ?? 'Member'
  const currentLevel = profile?.mlmLevel ?? user?.mlmLevel ?? 0

  // Filter reward levels to exclude Level 0 (Member) for UI
  const displayRewards = rewardLevels.filter((r) => r.level > 0)

  // Find next rank progression
  const nextRank = displayRewards.find((r) => r.level > currentLevel)
  const prevRank = currentLevel > 0 ? rewardLevels.find((r) => r.level === currentLevel) : null

  // Calculate overall team volume progress to next rank
  const baseVolume = prevRank ? prevRank.reqTv : 0
  const progressToNext = nextRank
    ? ((teamVolume - baseVolume) / (nextRank.reqTv - baseVolume)) * 100
    : 100

  // Filter unlocked rewards (where user meets the rank level)
  const unlockedRewards = displayRewards.filter((r) => currentLevel >= r.level)
  const lockedRewards = displayRewards.filter((r) => currentLevel < r.level)

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
        <p className="text-xs text-muted-foreground">Loading Leadership Rewards...</p>
      </div>
    )
  }

  // Helper to render condition row in progression panel
  const renderCondition = (
    label: string, 
    current: number, 
    required: number, 
    suffix: string = ''
  ) => {
    const isMet = current >= required
    const pct = required > 0 ? Math.min((current / required) * 100, 100) : 100
    return (
      <div className="space-y-1.5 p-2.5 rounded bg-background/35 border border-border/10">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            {isMet ? (
              <CheckCircle className="size-3.5 text-emerald-400 fill-emerald-400/10" />
            ) : (
              <Clock className="size-3.5 text-amber-400" />
            )}
            {label}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {current.toLocaleString()}{suffix} / {required.toLocaleString()}{suffix}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={pct} className={`h-1.5 ${isMet ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`} />
          <span className={`text-[9px] font-bold font-mono w-8 text-right ${isMet ? 'text-emerald-400' : 'text-amber-400'}`}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
    )
  }

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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Team Volume</p>
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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Leadership Rank</p>
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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Gifts Unlocked</p>
              <p className="text-xl font-bold text-foreground">{unlockedRewards.length} / {displayRewards.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Rank Detailed Checklist */}
      {nextRank && (
        <Card className="bg-gradient-to-r from-emerald-500/5 via-card to-violet-500/5 border-emerald-500/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crown className="size-4 text-purple-400" /> Progression to Next Rank: {nextRank.name}
              </span>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Level {nextRank.level}</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Satisfy all constraints in both the Investment Plan and the Binary Plan to qualify.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Condition List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Basic Volumes */}
              {renderCondition('Personal Volume (PV)', personalVolume, nextRank.reqPv, ' BV')}
              {renderCondition('Total Team Volume (TV)', teamVolume, nextRank.reqTv, ' BV')}
              
              {/* Binary Leg Volumes */}
              {nextRank.reqLeftVolume !== undefined && nextRank.reqLeftVolume > 0 && 
                renderCondition('Left Leg Volume', leftVolume, nextRank.reqLeftVolume, ' BV')
              }
              {nextRank.reqRightVolume !== undefined && nextRank.reqRightVolume > 0 && 
                renderCondition('Right Leg Volume', rightVolume, nextRank.reqRightVolume, ' BV')
              }
              {nextRank.reqWeakerLegVolume !== undefined && nextRank.reqWeakerLegVolume > 0 && 
                renderCondition('Weaker Leg Volume', weakerVolume, nextRank.reqWeakerLegVolume, ' BV')
              }

              {/* Investment Constraints */}
              {nextRank.reqMinPersonalInvestment !== undefined && nextRank.reqMinPersonalInvestment > 0 && 
                renderCondition('Personal Active Investment', personalInvestment, nextRank.reqMinPersonalInvestment, ' USD')
              }
              {nextRank.reqRequiredPlanId && (
                <div className="space-y-1.5 p-2.5 rounded bg-background/35 border border-border/10 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    {activePlanIds.includes(nextRank.reqRequiredPlanId) ? (
                      <CheckCircle className="size-3.5 text-emerald-400 fill-emerald-400/10" />
                    ) : (
                      <Clock className="size-3.5 text-amber-400" />
                    )}
                    Required Active Plan
                  </span>
                  <Badge variant="secondary" className="font-mono text-[9px] lowercase bg-background">
                    {nextRank.reqRequiredPlanId}
                  </Badge>
                </div>
              )}

              {/* Referral Constraints */}
              {nextRank.reqDirectReferrals !== undefined && nextRank.reqDirectReferrals > 0 && 
                renderCondition('Direct Sponsored Referrals', directsCount, nextRank.reqDirectReferrals, ' directs')
              }
              {nextRank.reqActiveDirects !== undefined && nextRank.reqActiveDirects > 0 && 
                renderCondition('Active Direct Referrals', activeDirectsCount, nextRank.reqActiveDirects, ' active')
              }

              {/* Advanced Direct Referral Rank Constraints */}
              {nextRank.reqDirectsWithMinRankLevel !== undefined && nextRank.reqDirectsWithMinRankLevel > 0 && 
                nextRank.reqDirectsWithMinRankCount !== undefined && nextRank.reqDirectsWithMinRankCount > 0 && (
                  <div className="space-y-1.5 p-2.5 rounded bg-background/35 border border-border/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Directs with Rank Lvl {nextRank.reqDirectsWithMinRankLevel}+</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {profile?.directReferrals?.filter((d: any) => (d.mlmLevel ?? 0) >= nextRank.reqDirectsWithMinRankLevel!).length || 0} / {nextRank.reqDirectsWithMinRankCount} directs
                      </span>
                    </div>
                  </div>
                )
              }
            </div>

            {/* Overall Volume Progress Bar */}
            <div className="space-y-1 bg-background/20 p-2 rounded border border-border/10">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-muted-foreground">Team Volume Metric Progression</span>
                <span className="text-foreground font-mono">{Math.round(progressToNext)}%</span>
              </div>
              <Progress value={Math.min(progressToNext, 100)} className="h-2" />
            </div>

          </CardContent>
        </Card>
      )}

      {/* Rewards Grid */}
      <div className="space-y-4">
        {/* Unlocked Section */}
        {unlockedRewards.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="size-4 text-emerald-400" /> Unlocked Leadership Tiers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedRewards.map((reward) => (
                <Card key={reward.level} className="bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30 shadow-lg shadow-emerald-500/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30">
                          <Trophy className="size-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{reward.name} Tier</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Level {reward.level}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 font-mono">{reward.reqTv.toLocaleString()} BV</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {reward.gift && reward.gift !== 'None' && (
                      <div className="rounded bg-background/40 border border-border/30 p-2.5 space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-emerald-400">🎁 Physical Gift Incentive</p>
                        <p className="text-foreground/90 font-medium">{reward.gift}</p>
                      </div>
                    )}

                    <div className="rounded bg-background/40 border border-border/30 p-2.5 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase text-cyan-400">💰 Cash Prize Bonus</p>
                      <p className="text-foreground/90 font-mono font-bold">${reward.bonus.toLocaleString()} USD</p>
                    </div>
                    
                    {reward.perks && (
                      <p className="text-[10px] text-muted-foreground italic">⚡ Benefits: {reward.perks}</p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Dispatched & Credited
                      </span>
                      <span className="text-muted-foreground font-mono">Completed</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Locked Section */}
        {lockedRewards.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" /> Locked Leadership Rewards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lockedRewards.map((reward) => (
                <Card key={reward.level} className="bg-card/40 border-border/50 opacity-70">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border/50">
                          <Trophy className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground/80">{reward.name} Tier</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Level {reward.level}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-muted-foreground border-border/40">{reward.reqTv.toLocaleString()} BV</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-xs text-muted-foreground">
                    {reward.gift && reward.gift !== 'None' && (
                      <div>
                        <p className="text-[9px] font-semibold uppercase text-muted-foreground">🎁 Physical Gift</p>
                        <p className="text-foreground/75 font-medium mt-0.5">{reward.gift}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] font-semibold uppercase text-muted-foreground">💰 Cash Prize</p>
                      <p className="text-foreground/75 font-mono font-bold mt-0.5">${reward.bonus.toLocaleString()} USD</p>
                    </div>
                    {reward.perks && (
                      <p className="text-[10px] italic">⚡ Perks: {reward.perks}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
