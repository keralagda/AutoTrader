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
import { Plus, TrendingUp, Wallet, Trophy, Target, ArrowRightLeft } from 'lucide-react'
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
  earnings: { title: 'My Earnings', icon: TrendingUp },
  withdraw: { title: 'Withdraw Funds', icon: Wallet },
  leaderboard: { title: 'Leaderboard', icon: Trophy },
  challenges: { title: 'Challenges', icon: Target },
}

export function UserDashboard() {
  const { dashboardTab, user, updateUserWallets } = useAppStore()
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const { toast } = useToast()

  const currentTab = TAB_META[dashboardTab] || TAB_META.earnings
  const TabIcon = currentTab.icon

  const tradingBalance = user?.tradingBalance || 0
  const withdrawalBalance = user?.withdrawalBalance || 0

  const handleTransfer = async () => {
    if (!user?.id) return
    const amount = parseFloat(transferAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' })
      return
    }
    if (amount > tradingBalance) {
      toast({ title: 'Insufficient trading balance', variant: 'destructive' })
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
          direction: 'trading_to_withdrawal',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        updateUserWallets(data.tradingBalance, data.withdrawalBalance)
        toast({
          title: 'Transfer Successful',
          description: `$${amount.toFixed(2)} moved to Withdrawal Wallet`,
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
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Trading:</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono">
                  ${tradingBalance.toFixed(2)}
                </Badge>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Withdraw:</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                  ${withdrawalBalance.toFixed(2)}
                </Badge>
              </div>
              <Button
                onClick={() => setTransferModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <ArrowRightLeft className="size-4" />
                <span className="hidden sm:inline">Transfer</span>
              </Button>
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

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-primary" />
              Transfer Funds
            </DialogTitle>
            <DialogDescription>
              Move funds from your Trading Wallet to your Withdrawal Wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Balances */}
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

            {/* Transfer Direction */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="text-emerald-400 font-medium">Trading</span>
              <ArrowRightLeft className="size-4" />
              <span className="text-cyan-400 font-medium">Withdrawal</span>
            </div>

            {/* Amount */}
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

            {/* Note */}
            <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
              <p className="text-xs text-muted-foreground">
                Funds transferred to your Withdrawal Wallet can be used for withdrawal requests.
                This action cannot be reversed automatically.
              </p>
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
    </div>
  )
}
