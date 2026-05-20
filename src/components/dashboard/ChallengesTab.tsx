'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ChallengeType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Target, Trophy, Zap, Gift } from 'lucide-react'

const PLACEHOLDER_CHALLENGES = [
  {
    id: 'ph-1',
    title: 'First Deposit Bonus',
    description: 'Make your first deposit and earn a bonus reward',
    reward: 50,
    icon: Zap,
  },
  {
    id: 'ph-2',
    title: 'Referral Master',
    description: 'Refer 5 friends and unlock the Referral Master challenge',
    reward: 100,
    icon: Target,
  },
  {
    id: 'ph-3',
    title: 'Weekly Streak',
    description: 'Deposit for 7 consecutive days to earn a streak bonus',
    reward: 75,
    icon: Trophy,
  },
  {
    id: 'ph-4',
    title: 'Holiday Special',
    description: 'Complete special holiday-themed tasks for extra rewards',
    reward: 200,
    icon: Gift,
  },
]

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

export function ChallengesTab() {
  const [challenges, setChallenges] = useState<ChallengeType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/challenges')
      if (res.ok) {
        const json = await res.json()
        setChallenges(json)
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Coming Soon Overlay Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card backdrop-blur-sm relative overflow-hidden">
        <CardContent className="p-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 mb-4">
            <Lock className="size-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Exciting challenges and competitions are coming soon! Stay tuned for
            amazing rewards and compete with other traders on the platform.
          </p>
          <Badge className="mt-4 bg-primary/20 text-primary border-primary/30">
            Stay Tuned
          </Badge>
        </CardContent>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 grid-pattern pointer-events-none" />
      </Card>

      {/* Beta Preview - Placeholder Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Lock className="size-3.5" />
          Preview — Coming Challenges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLACEHOLDER_CHALLENGES.map((challenge) => {
            const Icon = challenge.icon
            return (
              <Card
                key={challenge.id}
                className="border-border/30 bg-card/40 backdrop-blur-sm opacity-50 pointer-events-none relative overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2 shrink-0">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold truncate">{challenge.title}</p>
                        <Lock className="size-3.5 text-muted-foreground shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {challenge.description}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30"
                      >
                        Reward: {formatCurrency(challenge.reward)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                {/* Grayed out overlay */}
                <div className="absolute inset-0 bg-background/30 pointer-events-none" />
              </Card>
            )
          })}
        </div>
      </div>

      {/* Real challenges if any exist (still behind overlay) */}
      {!loading && challenges.length > 0 && (
        <div className="space-y-4 opacity-30 pointer-events-none">
          <h3 className="text-sm font-medium text-muted-foreground">Active Challenges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="border-border/30 bg-card/40 backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/20 p-2">
                      <Target className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{challenge.title}</p>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                      <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                        {formatCurrency(challenge.reward)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
