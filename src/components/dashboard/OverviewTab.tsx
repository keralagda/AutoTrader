'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Wallet, Users, UserPlus, PiggyBank, Crown } from 'lucide-react'
import { DailyCheckIn } from './DailyCheckIn'
import { ReferralShare } from './ReferralShare'
import { PortfolioChart } from './PortfolioChart'
import { CopyTradingSection } from './CopyTradingSection'

interface ProfileData {
  activePlan: string | null
  planCategory: string | null
  investmentAmount: number
  directCount: number
  totalTeam: number
}

export function OverviewTab() {
  const { user, updateUserWallets } = useAppStore()
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/profile?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data)
        // Sync latest balances from server
        if (data.tradingBalance !== undefined && data.withdrawalBalance !== undefined) {
          updateUserWallets(data.tradingBalance, data.withdrawalBalance)
        }
      })
      .catch(() => {})
  }, [user?.id, updateUserWallets])

  const planColors: Record<string, string> = {
    starter: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    silver: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
    gold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    platinum: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  }

  const planColor = planColors[profile?.planCategory || ''] || planColors.starter

  const stats = [
    {
      label: 'Activated Plan',
      value: profile?.activePlan || 'None',
      icon: Crown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      extra: profile?.activePlan ? (
        <Badge className={`mt-1 text-[10px] ${planColor}`}>
          {profile.planCategory?.toUpperCase()}
        </Badge>
      ) : null,
    },
    {
      label: 'Investment Amount',
      value: `$${(profile?.investmentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: PiggyBank,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Total Earnings',
      value: `$${(user?.totalEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Total Direct',
      value: (profile?.directCount || 0).toString(),
      icon: UserPlus,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
    },
    {
      label: 'Total Team',
      value: (profile?.totalTeam || 0).toString(),
      icon: Users,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Total Deposited',
      value: `$${(user?.totalDeposited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-muted-foreground text-sm mt-1">Here&apos;s your account overview</p>
      </div>

      {/* Daily Check-in */}
      <DailyCheckIn />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-card/50 border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold truncate">{stat.value}</p>
                    {stat.extra}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction label="Deposit Funds" icon="💳" tab="deposit" />
            <QuickAction label="Invest in Plan" icon="💰" tab="investment" />
            <QuickAction label="Withdraw" icon="💸" tab="withdraw" />
            <QuickAction label="My Team" icon="👥" tab="team" />
          </div>
        </CardContent>
      </Card>

      {/* Portfolio & Earnings Chart */}
      <PortfolioChart />

      {/* Top Earners */}
      <CopyTradingSection />

      {/* Referral Share */}
      <ReferralShare />
    </div>
  )
}

function QuickAction({ label, icon, tab }: { label: string; icon: string; tab: string }) {
  const { setDashboardTab } = useAppStore()
  return (
    <button
      onClick={() => setDashboardTab(tab as any)}
      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </button>
  )
}
