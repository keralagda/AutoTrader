'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { UserSidebar } from './UserSidebar'
import { OverviewTab } from './OverviewTab'
import { ProfileTab } from './ProfileTab'
import { EarningsTab } from './EarningsTab'
import { InvestmentTab } from './InvestmentTab'
import { DepositTab } from './DepositTab'
import { WithdrawTab } from './WithdrawTab'
import { TeamTab } from './TeamTab'
import { ChallengesTab } from './ChallengesTab'
import { LeaderboardTab } from './LeaderboardTab'
import { MessagesTab } from './MessagesTab'
import { NewsTab } from './NewsTab'
import { TransactionsTab } from './TransactionsTab'
import { SecurityTab } from './SecurityTab'
import { WelcomeTour } from './WelcomeTour'
import { MobileBottomNav } from './MobileBottomNav'
import { ProfitNotification } from './ProfitNotification'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  User,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Wallet,
  Users,
  Target,
  Trophy,
  MessageSquare,
  Newspaper,
  ArrowRightLeft,
  Bell,
  ScrollText,
  Shield,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const TAB_META: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }> }
> = {
  overview: { title: 'Dashboard', icon: LayoutDashboard },
  profile: { title: 'Profile', icon: User },
  earnings: { title: 'My Earnings', icon: TrendingUp },
  investment: { title: 'Investment', icon: PiggyBank },
  deposit: { title: 'Deposit', icon: CreditCard },
  withdraw: { title: 'Withdrawal', icon: Wallet },
  team: { title: 'Team', icon: Users },
  challenges: { title: 'Competition', icon: Target },
  leaderboard: { title: 'Leaderboard', icon: Trophy },
  messages: { title: 'Message Centre', icon: MessageSquare },
  transactions: { title: 'Transactions', icon: ScrollText },
  news: { title: 'News', icon: Newspaper },
  security: { title: 'Security', icon: Shield },
}

export function UserDashboard() {
  const { dashboardTab, user, updateUserWallets } = useAppStore()
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferDirection, setTransferDirection] = useState<'trading_to_withdrawal' | 'withdrawal_to_trading'>('trading_to_withdrawal')
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const { toast } = useToast()

  const currentTab = TAB_META[dashboardTab] || TAB_META.overview
  const TabIcon = currentTab.icon

  const tradingBalance = user?.tradingBalance || 0
  const withdrawalBalance = user?.withdrawalBalance || 0

  // Fetch notification count
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/notifications?userId=${user.id}`)
      .then(r => r.json())
      .then(data => setUnreadNotifs(data.unreadCount || 0))
      .catch(() => {})
  }, [user?.id, dashboardTab])

  const handleTransfer = async () => {
    if (!user?.id) return
    const amount = parseFloat(transferAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' })
      return
    }
    const sourceBalance = transferDirection === 'trading_to_withdrawal' ? tradingBalance : withdrawalBalance
    if (amount > sourceBalance) {
      toast({ title: 'Insufficient balance', variant: 'destructive' })
      return
    }

    setTransferring(true)
    try {
      const res = await fetch('/api/transfer-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount,
          direction: transferDirection,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        updateUserWallets(data.tradingBalance, data.withdrawalBalance)
        toast({
          title: 'Transfer Successful',
          description: transferDirection === 'trading_to_withdrawal'
            ? `$${amount.toFixed(2)} moved to Withdrawal Wallet`
            : `$${amount.toFixed(2)} moved to Trading Wallet`,
        })
        setTransferAmount('')
        setTransferModalOpen(false)
      } else {
        const data = await res.json()
        toast({ title: 'Transfer Failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setTransferring(false)
    }
  }

  const renderTab = () => {
    switch (dashboardTab) {
      case 'overview': return <OverviewTab />
      case 'profile': return <ProfileTab />
      case 'earnings': return <EarningsTab />
      case 'investment': return <InvestmentTab />
      case 'deposit': return <DepositTab />
      case 'withdraw': return <WithdrawTab />
      case 'team': return <TeamTab />
      case 'challenges': return <ChallengesTab />
      case 'leaderboard': return <LeaderboardTab />
      case 'messages': return <MessagesTab />
      case 'transactions': return <TransactionsTab />
      case 'news': return <NewsTab />
      case 'security': return <SecurityTab />
      default: return <OverviewTab />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <UserSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile App Header */}
        <header className="shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 md:px-6 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            {/* Left: Page title */}
            <div className="flex items-center gap-2.5 pl-10 md:pl-0">
              <TabIcon className="size-5 text-primary" />
              <h1 className="text-base md:text-lg font-semibold truncate">{currentTab.title}</h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile: Compact balance display */}
              <div className="flex md:hidden items-center gap-1.5">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px] px-1.5 py-0.5">
                  ${tradingBalance.toFixed(0)}
                </Badge>
              </div>

              {/* Desktop: Full balance display */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Trading:</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono">
                  ${tradingBalance.toFixed(2)}
                </Badge>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Withdraw:</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                  ${withdrawalBalance.toFixed(2)}
                </Badge>
              </div>

              <Button
                onClick={() => setTransferModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 px-2 md:px-3"
              >
                <ArrowRightLeft className="size-3.5 md:size-4" />
                <span className="hidden md:inline">Transfer</span>
              </Button>
              <button className="relative p-2 rounded-full hover:bg-muted active:scale-90 transition-all" onClick={() => { /* notifications */ }}>
                <Bell className="size-4 text-muted-foreground" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content - extra bottom padding on mobile for bottom nav */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 overscroll-y-contain">
          {renderTab()}
        </div>
      </main>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-primary" />
              Transfer Funds
            </DialogTitle>
            <DialogDescription>
              Move funds between your wallets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <p className="text-xs text-emerald-400 font-medium">Trading Wallet</p>
                <p className="text-lg font-bold text-emerald-400">${tradingBalance.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
                <p className="text-xs text-cyan-400 font-medium">Withdrawal Wallet</p>
                <p className="text-lg font-bold text-cyan-400">${withdrawalBalance.toFixed(2)}</p>
              </div>
            </div>

            {/* Direction Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTransferDirection('trading_to_withdrawal')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  transferDirection === 'trading_to_withdrawal'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'border-border/50 text-muted-foreground'
                }`}
              >
                Trading → Withdrawal
              </button>
              <button
                onClick={() => setTransferDirection('withdrawal_to_trading')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  transferDirection === 'withdrawal_to_trading'
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    : 'border-border/50 text-muted-foreground'
                }`}
              >
                Withdrawal → Trading
              </button>
            </div>

            <div className="space-y-2">
              <Label>Amount (USDC)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="pl-7"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2">
                {[10, 50, 100].map(val => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setTransferAmount(Math.min(val, tradingBalance).toFixed(2))}
                  >
                    ${val}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs text-primary"
                  onClick={() => setTransferAmount(tradingBalance.toFixed(2))}
                >
                  Max
                </Button>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleTransfer}
              disabled={transferring || !transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > tradingBalance}
            >
              {transferring ? 'Transferring...' : 'Confirm Transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Tour for new users */}
      <WelcomeTour />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Profit Notification Checker */}
      <ProfitNotification />
    </div>
  )
}
