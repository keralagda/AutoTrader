'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { PlanType, PaymentGatewayType } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Lock,
  Bitcoin,
  Landmark,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

const PLAN_COLORS: Record<string, string> = {
  Starter: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  Gold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Platinum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

const getPlanKey = (planName: string): string => {
  const name = (planName || '').toLowerCase()
  if (name.includes('starter')) return 'Starter'
  if (name.includes('silver')) return 'Silver'
  if (name.includes('gold')) return 'Gold'
  if (name.includes('platinum')) return 'Platinum'
  if (name.includes('hourly') || name.includes('flash')) return 'Silver'
  if (name.includes('weekly')) return 'Gold'
  if (name.includes('fixed')) return 'Platinum'
  return 'Starter' // default fallback
}

const getPlanLimitMultiplier = (plan: any): string => {
  if (plan && typeof plan === 'object') {
    const cappingType = plan.cappingType
    const value = plan.dailyEarningCapPercent
    if (cappingType === 'multiplier') {
      return `${value}X`
    } else if (cappingType === 'percentage') {
      return `${value}%`
    } else if (cappingType === 'fixed') {
      return `$${value}`
    } else if (value !== undefined) {
      if (value > 0) {
        const val = value / 100
        return `${val}X`
      } else if (value < 0) {
        return `$${Math.abs(value)}`
      }
    }
  }
  const name = ((plan && typeof plan === 'object' ? plan.name : plan) || '').toLowerCase()
  if (name.includes('starter')) return '1X'
  if (name.includes('flash') || name.includes('hourly')) return '1.5X'
  if (name.includes('silver')) return '2X'
  if (name.includes('gold')) return '2.5X'
  if (name.includes('platinum')) return '3X'
  return '2X' // default fallback
}

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [plans, setPlans] = useState<PlanType[]>([])
  const [gateways, setGateways] = useState<PaymentGatewayType[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('crypto_usdc')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isStaked, setIsStaked] = useState(false)

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const parsedAmount = parseFloat(amount) || 0

  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true)
      const res = await fetch(`/api/plans?t=${Date.now()}`)
      if (res.ok) {
        const json = await res.json()
        setPlans(json)
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    } finally {
      setLoadingPlans(false)
    }
  }, [])

  const fetchGateways = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-gateways')
      if (res.ok) {
        const data = await res.json()
        setGateways(data.filter((g: PaymentGatewayType) => g.isActive))
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (open) {
      fetchPlans()
      fetchGateways()
      setSuccess(false)
      setSelectedPlanId('')
      setAmount('')
      setPaymentMethod('crypto_usdc')
      setIsStaked(false)
    }
  }, [open, fetchPlans, fetchGateways])

  const validationError = (() => {
    if (!selectedPlan) return null
    if (parsedAmount <= 0) return null
    if (parsedAmount < selectedPlan.minDeposit)
      return `Minimum deposit is ${formatCurrency(selectedPlan.minDeposit)}`
    if (parsedAmount > selectedPlan.maxDeposit)
      return `Maximum deposit is ${formatCurrency(selectedPlan.maxDeposit)}`

    // Check stacking
    return null
  })()

  const stakingBonus = isStaked && selectedPlan?.stakingEnabled ? (selectedPlan.stakingBonusPercent || 0) : 0
  const stackingBonus = selectedPlan?.stackingEnabled ? selectedPlan.stackingBonusPercent : 0
  const estimatedDailyEarning = selectedPlan
    ? (parsedAmount * (selectedPlan.dailyEarningPercent + stackingBonus + stakingBonus)) / 100
    : 0

  const handleSubmit = async () => {
    if (!user?.id || !selectedPlanId || parsedAmount <= 0) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId: selectedPlanId,
          amount: parsedAmount,
          paymentMethod,
          isStaked,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        toast({
          title: 'Deposit Successful!',
          description: `You've deposited ${formatCurrency(parsedAmount)} into the ${selectedPlan?.name} plan via ${paymentMethod}.`,
        })
      } else {
        const json = await res.json()
        toast({
          title: 'Deposit Failed',
          description: json.error || 'Something went wrong',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Network error', description: 'Please try again later', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-primary" />
            New Deposit
          </DialogTitle>
          <DialogDescription>
            Choose a plan, payment method, and make a deposit
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-emerald-500/20 p-3">
              <CheckCircle2 className="size-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Deposit Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your deposit is now active and earning.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plan Selection */}
            <div className="space-y-2">
              <Label>Select Plan</Label>
              {loadingPlans ? (
                <Skeleton className="h-9 w-full rounded-md" />
              ) : (
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.filter(p => p.isActive).map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${PLAN_COLORS[getPlanKey(plan.name)] || ''}`}>
                            {plan.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {plan.dailyEarningPercent}%/day
                            {plan.stackingEnabled && ' · Stackable'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Plan Details */}
            {selectedPlan && (
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={PLAN_COLORS[getPlanKey(selectedPlan.name)] || ''}>
                    {selectedPlan.name}
                  </Badge>
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                    <TrendingUp className="size-3.5" />
                    {selectedPlan.dailyEarningPercent}% daily
                    {selectedPlan.stackingEnabled && stackingBonus > 0 && (
                      <span className="text-xs text-amber-400 ml-1">+{stackingBonus}% stack</span>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entry Fee</p>
                    <p className="font-medium">{formatCurrency(selectedPlan.entryFee)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Limit</p>
                    <p className="font-medium">
                      {(() => {
                        const mult = getPlanLimitMultiplier(selectedPlan)
                        return mult.startsWith('$') ? mult : `${mult} of Investment`
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deposit Range</p>
                    <p className="font-medium">${selectedPlan.minDeposit} - ${selectedPlan.maxDeposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lock Period</p>
                    <p className="font-medium flex items-center gap-1">
                      {selectedPlan.lockPeriodDays > 0 ? (
                        <><Lock className="size-3" />{selectedPlan.lockPeriodDays} days</>
                      ) : 'None'}
                    </p>
                  </div>
                </div>
                {selectedPlan.stackingEnabled && (
                  <div className="flex items-center gap-1.5 text-xs text-violet-400">
                    <Layers className="size-3" />
                    <span>Stack up to {selectedPlan.maxStacks} deposits, +{selectedPlan.stackingBonusPercent}% bonus each</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {gateways.length > 0 ? gateways.slice(0, 4).map(gw => (
                  <button
                    key={gw.id}
                    onClick={() => setPaymentMethod(gw.type === 'crypto' ? `crypto_${gw.network || 'usdc'}` : gw.name.toLowerCase().replace(/\s+/g, '_'))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all ${
                      paymentMethod === (gw.type === 'crypto' ? `crypto_${gw.network || 'usdc'}` : gw.name.toLowerCase().replace(/\s+/g, '_'))
                        ? gw.type === 'crypto'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    {gw.type === 'crypto' ? <Bitcoin className="size-3.5" /> : <Landmark className="size-3.5" />}
                    {gw.name}
                  </button>
                )) : (
                  <>
                    <button
                      onClick={() => setPaymentMethod('crypto_usdc')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all ${paymentMethod === 'crypto_usdc' ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground'}`}
                    >
                      <Bitcoin className="size-3.5" /> USDC (BEP-20)

                    </button>
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all ${paymentMethod === 'upi' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'border-border/50 text-muted-foreground'}`}
                    >
                      <Landmark className="size-3.5" /> UPI
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (USDC)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  min="0"
                  step="0.01"
                  disabled={!selectedPlanId}
                />
              </div>
              {selectedPlan && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAmount(selectedPlan.minDeposit.toString())}
                  >
                    Min: {formatCurrency(selectedPlan.minDeposit)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAmount(selectedPlan.maxDeposit.toString())}
                  >
                    Max: {formatCurrency(selectedPlan.maxDeposit)}
                  </Button>
                </div>
              )}
            </div>

            {/* Staking Selection */}
            {selectedPlan && selectedPlan.stakingEnabled && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 mt-2 animate-in fade-in duration-200">
                <input 
                  type="checkbox" 
                  id="stake-checkbox" 
                  checked={isStaked} 
                  onChange={(e) => setIsStaked(e.target.checked)} 
                  className="h-4 w-4 bg-background border border-border rounded accent-emerald-500 cursor-pointer mt-0.5"
                />
                <div className="flex-1 cursor-pointer select-none" onClick={() => setIsStaked(!isStaked)}>
                  <Label htmlFor="stake-checkbox" className="text-xs font-semibold text-emerald-400 cursor-pointer flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Stake this investment
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    Locks funds for {selectedPlan.stakingMinDays || 30} days. Earns +{selectedPlan.stakingBonusPercent || 0}% daily bonus yield. Early unstake fee is {selectedPlan.stakingEarlyWithdrawalPenalty || 10}%.
                  </p>
                </div>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="size-3.5" />
                {validationError}
              </div>
            )}

            {/* Estimated Earnings */}
            {selectedPlan && parsedAmount > 0 && !validationError && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Est. Daily Earning</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="size-3.5" />
                    +{formatCurrency(estimatedDailyEarning)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || !selectedPlanId || parsedAmount <= 0 || !!validationError}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Deposit'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
