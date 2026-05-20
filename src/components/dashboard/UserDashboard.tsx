'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { UserSidebar } from './UserSidebar'
import { EarningsTab } from './EarningsTab'
import { WithdrawTab } from './WithdrawTab'
import { LeaderboardTab } from './LeaderboardTab'
import { ChallengesTab } from './ChallengesTab'
import { DepositModal } from './DepositModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, Wallet, Trophy, Target } from 'lucide-react'

const TAB_META: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }> }
> = {
  earnings: { title: 'My Earnings', icon: TrendingUp },
  withdraw: { title: 'Withdraw Funds', icon: Wallet },
  leaderboard: { title: 'Leaderboard', icon: Trophy },
  challenges: { title: 'Challenges', icon: Target },
}

export function UserDashboard() {
  const { dashboardTab, user } = useAppStore()
  const [depositModalOpen, setDepositModalOpen] = useState(false)

  const currentTab = TAB_META[dashboardTab] || TAB_META.earnings
  const TabIcon = currentTab.icon

  const renderTab = () => {
    switch (dashboardTab) {
      case 'earnings':
        return <EarningsTab />
      case 'withdraw':
        return <WithdrawTab />
      case 'leaderboard':
        return <LeaderboardTab />
      case 'challenges':
        return <ChallengesTab />
      default:
        return <EarningsTab />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pl-10 md:pl-0">
              <TabIcon className="size-5 text-primary" />
              <h1 className="text-lg font-semibold">{currentTab.title}</h1>
              {dashboardTab === 'challenges' && (
                <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Coming Soon
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Balance:</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono">
                  ${user?.balance?.toFixed(2) || '0.00'} USDC
                </Badge>
              </div>
              <Button
                onClick={() => setDepositModalOpen(true)}
                className="gap-1.5"
                size="sm"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Deposit</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTab()}
        </div>
      </main>

      {/* Deposit Modal */}
      <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
    </div>
  )
}
