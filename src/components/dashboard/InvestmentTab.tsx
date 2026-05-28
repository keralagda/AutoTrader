'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TradingSimulator } from './TradingSimulator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  PiggyBank,
  Wallet,
  Layers,
  Lock,
  Loader2,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { PlanType } from '@/lib/types'

interface Deposit {
  id: string
  amount: number
  status: string
  earnedSoFar: number
  stackIndex: number
  lockedUntil: string | null
  createdAt: string
  plan: {
    id: string
    name: string
    dailyEarningPercent: number
    maxEarningLimit: number
  }
}

const PLAN_COLORS: Record<string, string> = {
  Starter: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  Gold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Platinum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

export function InvestmentTab() {
  const { user, updateUserWallets } = useAppStore()
  const { toast } = useToast()
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [plans, setPlans] = useState<PlanType[]>([])
  const [loading, setLoading] = useState(true)
  const [investModalOpen, setInvestModalOpen] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)

  // Invest form state
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const parsedAmount = parseFloat(amount) || 0
  const tradingBalance = user?.tradingBalance || 0

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [depsRes, plansRes] = await Promise.all([
        fetch(`/api/deposits?userId=${user.id}`),
        fetch('/api/plans'),
      ])
      if (depsRes.ok) setDeposits(await depsRes.json())
      if (plansRes.ok) setPlans(await plansRes.json())
    } catch {
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const estimatedDailyEarning = selectedPlan
    ? (parsedAmount * selectedPlan.dailyEarningPercent) / 100
    : 0

  const validationError = (() => {
    if (!selectedPlan || parsedAmount <= 0) return null
    if (user?.role !== 'admin') {
      if (parsedAmount < selectedPlan.minDeposit) return `Minimum is $${selectedPlan.minDeposit}`
      if (parsedAmount > selectedPlan.maxDeposit) return `Maximum is $${selectedPlan.maxDeposit}`
      if (parsedAmount > tradingBalance) return 'Insufficient wallet balance. Deposit funds first.'
    }
    return null
  })()

  const handleInvest = async () => {
    if (!user?.id || !selectedPlanId || parsedAmount <= 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId: selectedPlanId,
          amount: parsedAmount,
          riskLevel: selectedRiskLevel,
        }),
      })

      if (res.ok) {
        toast({ title: 'Investment Successful!', description: `$${parsedAmount.toFixed(2)} invested in ${selectedPlan?.name} plan` })
        // Deduct from trading wallet (the API already handles this via totalDeposited, but we need to reflect in UI)
        // Refresh user data
        const meRes = await fetch(`/api/auth/me?userId=${user.id}`)
        if (meRes.ok) {
          const userData = await meRes.json()
          updateUserWallets(userData.tradingBalance, userData.withdrawalBalance)
        }
        setInvestModalOpen(false)
        setSelectedPlanId('')
        setAmount('')
        loadData()
      } else {
        const data = await res.json()
        toast({ title: 'Investment Failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Reinvest state and handler
  const [reinvestingId, setReinvestingId] = useState<string | null>(null)

  const handleReinvest = async (deposit: Deposit) => {
    if (!user?.id) return
    
    // Reinvest the earnings from this deposit into the same plan
    const reinvestAmount = deposit.earnedSoFar
    if (reinvestAmount <= 0) {
      toast({ title: 'No earnings to reinvest', variant: 'destructive' })
      return
    }

    setReinvestingId(deposit.id)
    try {
      const res = await fetch('/api/reinvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId: deposit.plan.id,
          amount: reinvestAmount,
          sourceDepositId: deposit.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({ 
          title: 'Reinvestment Successful!', 
          description: `$${reinvestAmount.toFixed(2)} reinvested into ${data.deposit.planName}` 
        })
        // Refresh user data and deposits
        const meRes = await fetch(`/api/auth/me?userId=${user.id}`)
        if (meRes.ok) {
          const userData = await meRes.json()
          updateUserWallets(userData.tradingBalance, userData.withdrawalBalance)
        }
        loadData()
      } else {
        const data = await res.json()
        toast({ title: 'Reinvestment Failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setReinvestingId(null)
    }
  }

  const activeDeposits = deposits.filter(d => d.status === 'active' || d.status === 'locked')
  const completedDeposits = deposits.filter(d => d.status === 'completed')

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <TrendingUp className="size-4 text-emerald-400" />
      case 'locked': return <Clock className="size-4 text-amber-400" />
      case 'completed': return <CheckCircle className="size-4 text-cyan-400" />
      default: return <XCircle className="size-4 text-rose-400" />
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'locked': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'completed': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      default: return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    }
  }

  if (selectedDeposit) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedDeposit(null)}>
          ← Back to Investments
        </Button>
        <TradingSimulator deposit={selectedDeposit} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Investment</h2>
          <p className="text-sm text-muted-foreground">Select a plan and invest from your wallet</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <Wallet className="size-4 text-emerald-400" />
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-bold text-emerald-400">${tradingBalance.toFixed(2)}</span>
          </div>
          <Button onClick={() => setInvestModalOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            New Investment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeDeposits.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedDeposits.length})</TabsTrigger>
          <TabsTrigger value="all">All ({deposits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {activeDeposits.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <PiggyBank className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No active investments.</p>
                <p className="text-xs text-muted-foreground mt-1">Deposit funds first, then invest in a plan.</p>
                <Button onClick={() => setInvestModalOpen(true)} className="mt-4">
                  Start Investing
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeDeposits.map(deposit => (
              <DepositCard
                key={deposit.id}
                deposit={deposit}
                statusIcon={statusIcon}
                statusColor={statusColor}
                onViewTrading={() => setSelectedDeposit(deposit)}
                onReinvest={() => handleReinvest(deposit)}
                reinvesting={reinvestingId === deposit.id}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedDeposits.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">No completed investments yet</CardContent>
            </Card>
          ) : completedDeposits.map(deposit => (
            <DepositCard key={deposit.id} deposit={deposit} statusIcon={statusIcon} statusColor={statusColor} onViewTrading={() => setSelectedDeposit(deposit)} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {deposits.map(deposit => (
            <DepositCard key={deposit.id} deposit={deposit} statusIcon={statusIcon} statusColor={statusColor} onViewTrading={() => setSelectedDeposit(deposit)} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Invest Modal */}
      <Dialog open={investModalOpen} onOpenChange={setInvestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="size-5 text-primary" />
              New Investment
            </DialogTitle>
            <DialogDescription>
              Choose a plan and invest from your Trading Wallet (${tradingBalance.toFixed(2)} available)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Plan Selection */}
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.isActive).map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${PLAN_COLORS[plan.name] || ''}`}>
                          {plan.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {plan.dailyEarningPercent}%/day · ${plan.minDeposit}-${plan.maxDeposit.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan Details */}
            {selectedPlan && (
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={PLAN_COLORS[selectedPlan.name] || ''}>
                    {selectedPlan.name}
                  </Badge>
                  <span className="text-sm font-medium text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="size-3.5" />
                    {selectedPlan.dailyEarningPercent}% daily
                  </span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entry Fee</p>
                    <p className="font-medium">${selectedPlan.entryFee}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Earning</p>
                    <p className="font-medium">${selectedPlan.maxEarningLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Investment Range</p>
                    <p className="font-medium">${selectedPlan.minDeposit} - ${selectedPlan.maxDeposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lock Period</p>
                    <p className="font-medium flex items-center gap-1">
                      {selectedPlan.lockPeriodDays > 0 ? <><Lock className="size-3" />{selectedPlan.lockPeriodDays} days</> : 'None'}
                    </p>
                  </div>
                </div>
                {selectedPlan.stackingEnabled && (
                  <div className="flex items-center gap-1.5 text-xs text-violet-400">
                    <Layers className="size-3" />
                    Stack up to {selectedPlan.maxStacks} deposits, +{selectedPlan.stackingBonusPercent}% bonus each
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label>Investment Amount (from Trading Wallet)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-7"
                  min="0"
                  step="0.01"
                  disabled={!selectedPlanId}
                />
              </div>
              {selectedPlan && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setAmount(selectedPlan.minDeposit.toString())}>
                    Min: ${selectedPlan.minDeposit}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setAmount(Math.min(selectedPlan.maxDeposit, tradingBalance).toString())}>
                    Max: ${Math.min(selectedPlan.maxDeposit, tradingBalance).toLocaleString()}
                  </Button>
                </div>
              )}
            </div>

            {/* Risk Level Selection */}
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <p className="text-[10px] text-muted-foreground">Higher risk = higher potential returns but more variation</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'low', label: '🟢 Low', desc: '0.5-2%/day', color: 'emerald' },
                  { value: 'medium', label: '🟡 Medium', desc: '2-5%/day', color: 'amber' },
                  { value: 'high', label: '🔴 High', desc: '5-15%/day', color: 'rose' },
                ].map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSelectedRiskLevel(level.value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedRiskLevel === level.value
                        ? `bg-${level.color}-500/15 border-${level.color}-500/30 text-${level.color}-400`
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <p className="text-sm font-medium">{level.label}</p>
                    <p className="text-[10px] mt-0.5">{level.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Error */}
            {validationError && (
              <p className="text-xs text-rose-400">{validationError}</p>
            )}

            {/* Estimated Earnings */}
            {selectedPlan && parsedAmount > 0 && !validationError && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Daily Earning</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="size-3.5" />
                    +${estimatedDailyEarning.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Paid from</span>
                  <span className="text-emerald-400">Trading Wallet</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full"
              onClick={handleInvest}
              disabled={submitting || !selectedPlanId || parsedAmount <= 0 || !!validationError}
            >
              {submitting ? (
                <><Loader2 className="size-4 animate-spin mr-2" /> Processing...</>
              ) : (
                'Confirm Investment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DepositCard({
  deposit,
  statusIcon,
  statusColor,
  onViewTrading,
  onReinvest,
  reinvesting,
}: {
  deposit: Deposit
  statusIcon: (s: string) => React.ReactNode
  statusColor: (s: string) => string
  onViewTrading: () => void
  onReinvest?: () => void
  reinvesting?: boolean
}) {
  const progress = deposit.plan.maxEarningLimit > 0
    ? (deposit.earnedSoFar / deposit.plan.maxEarningLimit) * 100
    : 0

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {statusIcon(deposit.status)}
            <span className="font-semibold">{deposit.plan.name} Plan</span>
            <Badge className={`text-[10px] ${statusColor(deposit.status)}`}>
              {deposit.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            {deposit.status === 'active' && deposit.earnedSoFar > 0 && onReinvest && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReinvest}
                disabled={reinvesting}
                className="text-emerald-400 hover:text-emerald-300"
              >
                {reinvesting ? (
                  <><Loader2 className="size-3.5 animate-spin mr-1" /> Reinvesting...</>
                ) : (
                  <><RefreshCw className="size-3.5 mr-1" /> Reinvest</>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onViewTrading}>
              View Trading
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Invested</p>
            <p className="font-bold">${(deposit.amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="font-bold text-emerald-400">${(deposit.earnedSoFar || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Daily Return</p>
            <p className="font-bold text-cyan-400">~${((deposit.amount * deposit.plan.dailyEarningPercent) / 100).toFixed(2)}/day</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capital + Profit</p>
            <p className="font-bold text-amber-400">${(deposit.amount + deposit.earnedSoFar).toFixed(2)}</p>
          </div>
        </div>

        {/* X Multiplier */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Returns Multiplier</span>
              <span className="font-bold text-emerald-400">
                {deposit.amount > 0 ? `${(deposit.earnedSoFar / deposit.amount).toFixed(2)}x` : '0x'}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min((deposit.earnedSoFar / Math.max(deposit.amount, 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>0x</span>
              <span>1x</span>
              <span>2x</span>
              <span>3x+</span>
            </div>
          </div>
          {/* Multiplier badge */}
          <div className={`text-center px-3 py-1.5 rounded-lg border ${
            deposit.earnedSoFar >= deposit.amount * 3 ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' :
            deposit.earnedSoFar >= deposit.amount * 2 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            deposit.earnedSoFar >= deposit.amount ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            'bg-muted/30 border-border/30 text-muted-foreground'
          }`}>
            <p className="text-lg font-bold">{deposit.amount > 0 ? `${Math.floor(deposit.earnedSoFar / deposit.amount)}x` : '0x'}</p>
            <p className="text-[8px]">returns</p>
          </div>
        </div>

        {deposit.lockedUntil && (
          <p className="text-xs text-amber-400 mt-2">
            🔒 Locked until {new Date(deposit.lockedUntil).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
