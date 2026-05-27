'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Crown } from 'lucide-react'

interface TierData {
  currentTier: { name: string; bonus: number; icon: string; benefits: string[] }
  nextTier: { name: string; minDeposit: number; icon: string } | null
  totalDeposited: number
  progressToNext: number
}

export function VIPTierCard() {
  const { user } = useAppStore()
  const [tier, setTier] = useState<TierData | null>(null)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/user/tier?userId=${user.id}`)
      .then(r => r.json())
      .then(setTier)
      .catch(() => {})
  }, [user?.id])

  if (!tier) return null

  return (
    <Card className="bg-gradient-to-r from-amber-500/5 via-card to-violet-500/5 border-amber-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{tier.currentTier.icon}</span>
            <div>
              <p className="text-sm font-bold">{tier.currentTier.name} Tier</p>
              {tier.currentTier.bonus > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                  +{tier.currentTier.bonus}% daily bonus
                </Badge>
              )}
            </div>
          </div>
          <Crown className="h-5 w-5 text-amber-400" />
        </div>

        {tier.nextTier && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{tier.currentTier.name}</span>
              <span>{tier.nextTier.icon} {tier.nextTier.name} (${tier.nextTier.minDeposit.toLocaleString()})</span>
            </div>
            <Progress value={tier.progressToNext} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">
              ${(tier.nextTier.minDeposit - tier.totalDeposited).toLocaleString()} more to upgrade
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
