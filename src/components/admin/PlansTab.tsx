'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Plus, Save, Edit2, X, Trash2, ChevronDown, ChevronUp,
  DollarSign, Percent, Lock, Layers, BarChart3, Eye,
  RefreshCw, Info, AlertTriangle, Clock, Zap, Sparkles, Settings, Package
} from 'lucide-react'
import type { PlanType } from '@/lib/types'

const getPlanLimitMultiplier = (planName: string): string => {
  const name = planName.toLowerCase()
  if (name.includes('starter')) return '1X'
  if (name.includes('flash') || name.includes('hourly')) return '1.5X'
  if (name.includes('silver')) return '2X'
  if (name.includes('gold')) return '2.5X'
  if (name.includes('platinum')) return '3X'
  return '2X' // default fallback
}

// ─── Extended plan with UI state ─────────────────────────────────────────────
interface EditablePlan extends PlanType {
  isEditing?: boolean
  isNew?: boolean
  isExpanded?: boolean
  referralRules?: {
    id?: string
    level: number
    commission: number
    amount: number
    type?: string
    minSponsorDeposit?: number
    minDirectReferrals?: number
    targetWallet?: string
    enabled?: boolean
  }[]
  conditionalLogics?: {
    id?: string
    enabled: boolean
    priority: number
    conditionType: string
    operator: string
    value: string
    actionType: string
    actionValue: string
    description?: string
  }[]
  maxEarningMultiplier?: number
  drawdownLimit?: number
  profitTarget?: number
  hedgingRatio?: number
  lossLimitAction?: string
  pnlLogicDescription?: string

  // Binary MLM Configuration
  isBinaryMlmEnabled?: boolean
  binaryPairingBonusPercent?: number
  binaryPairingBonusType?: 'percent' | 'fixed'
  binaryPairingBonusFixed?: number
  binaryMatchingType?: 'weaker_leg' | 'both_legs' | 'stronger_leg'
  binaryDailyPairingCap?: number
  binaryWeeklyPairingCap?: number
  binaryCarryForward?: boolean
  binarySpilloverPlacement?: 'left' | 'right' | 'balanced' | 'cycle_fill'
  binaryDepthLimit?: number
  binaryFlushBonusEnabled?: boolean
  binaryFlushBonusPercent?: number
  binaryFlushBonusThreshold?: number
  binaryCycleEnabled?: boolean
  binaryCycleRatio?: string
  binaryCycleBonusPercent?: number
  binaryCycleBonusType?: 'percent' | 'fixed'
  binaryCycleBonusFixed?: number
}

// ─── Auto-generation helpers ─────────────────────────────────────────────────
function generateEarningMechanism(p: Partial<PlanType>): string {
  const daily = p.dailyEarningPercent ?? 0
  const cap = p.maxEarningLimit ?? 0
  const compound = p.autoCompound ? ' Auto-compound available to reinvest earnings.' : ''
  return `Daily earnings at ${daily}% of deposit amount, capped at $${cap.toLocaleString()} total. Earnings accrue Monday to Friday.${compound}`
}

function generateWithdrawalRule(p: Partial<PlanType>): string {
  const lock = p.lockPeriodDays ?? 0
  const penalty = p.earlyExitPenalty ?? 0
  if (lock === 0 && penalty === 0) return 'No lock-in period. Earnings available for withdrawal anytime.'
  const lockText = lock > 0 ? `${lock}-day lock-in on principal.` : 'No lock-in period.'
  const penaltyText = penalty > 0 ? ` Early exit incurs ${penalty}% penalty on earnings.` : ''
  const compoundText = p.autoCompound ? ' Auto-compound earnings locked for cycle.' : ''
  return lockText + penaltyText + compoundText
}

function generateStackingRule(p: Partial<PlanType>): string {
  if (!p.stackingEnabled) return 'Single deposit only per plan.'
  const max = p.maxStacks ?? 1
  const bonus = p.stackingBonusPercent ?? 0
  return `Up to ${max} simultaneous deposits allowed. Each additional stack earns ${bonus}% bonus on daily rate.`
}

// ─── Distribution bar colors ─────────────────────────────────────────────────
const DIST_COLORS = {
  accountHolder: 'bg-emerald-500',
  tradeProfit: 'bg-cyan-500',
  rewardsOffers: 'bg-amber-500',
  platformFee: 'bg-rose-500',
  charity: 'bg-purple-500',
  insurance: 'bg-blue-500',
  developer: 'bg-indigo-500',
  liquidity: 'bg-teal-500',
}

const SUB_DIST_COLORS = {
  referral: 'bg-violet-500',
  rewards: 'bg-amber-500',
  platform: 'bg-rose-500',
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function PlansTab() {
  const [plans, setPlans] = useState<EditablePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPlanData, setNewPlanData] = useState<EditablePlan | null>(null)

  // Floating Simulator & Calculator state
  const [showCalc, setShowCalc] = useState(false)
  const [simName, setSimName] = useState('New Custom Plan')
  const [simMinDeposit, setSimMinDeposit] = useState(100)
  const [simDailyRate, setSimDailyRate] = useState(1.5)
  const [simCapMult, setSimCapMult] = useState(2.0)
  const [simHolder, setSimHolder] = useState(75)
  const [simShared, setSimShared] = useState(20)
  const [simRewards, setSimRewards] = useState(5)
  const [simPlatform, setSimPlatform] = useState(0)
  const [simCharity, setSimCharity] = useState(0)
  const [simInsurance, setSimInsurance] = useState(0)
  const [simDeveloper, setSimDeveloper] = useState(0)
  const [simLiquidity, setSimLiquidity] = useState(0)
  const [simLevels, setSimLevels] = useState(7)
  const [simRules, setSimRules] = useState<{level: number, commission: number, amount: number}[]>([])
  const [simDrawdown, setSimDrawdown] = useState(10.0)
  const [simTarget, setSimTarget] = useState(20.0)
  const [simHedging, setSimHedging] = useState(0.0)
  const [simAction, setSimAction] = useState('pause')
  const [simPrincipal, setSimPrincipal] = useState(1000)
  const [simYieldPercent, setSimYieldPercent] = useState(1.5)

  // Binary MLM Config Section States
  const [showShowBinaryPairingConfig, setShowShowBinaryPairingConfig] = useState(false)
  const [showShowBinarySpilloverConfig, setShowShowBinarySpilloverConfig] = useState(false)
  const [showShowBinaryFlushConfig, setShowShowBinaryFlushConfig] = useState(false)
  const [showShowBinaryCycleConfig, setShowShowBinaryCycleConfig] = useState(false)

  const activeEditingPlan = plans.find(p => p.isEditing)

  useEffect(() => {
    if (activeEditingPlan) {
      setSimName(activeEditingPlan.name || '')
      setSimMinDeposit(activeEditingPlan.minDeposit || 100)
      setSimDailyRate(activeEditingPlan.dailyEarningPercent || 1.0)
      setSimCapMult(activeEditingPlan.maxEarningMultiplier || 2.0)
      setSimHolder(activeEditingPlan.accountHolderPercent || 50)
      setSimShared(activeEditingPlan.tradeProfitSharePercent || 30)
      setSimRewards(activeEditingPlan.rewardsOffersPercent || 15)
      setSimPlatform(activeEditingPlan.platformFeePercent || 5)
      setSimCharity((activeEditingPlan as any).charityDonationPercent || 0)
      setSimInsurance((activeEditingPlan as any).insuranceReservePercent || 0)
      setSimDeveloper((activeEditingPlan as any).developerFundPercent || 0)
      setSimLiquidity((activeEditingPlan as any).liquidityPoolPercent || 0)
      setSimLevels(activeEditingPlan.registrationReferralLevels || 7)
      setSimRules((activeEditingPlan.referralRules || []).map((r: any) => ({
        level: r.level,
        commission: r.commission || 0,
        amount: r.amount || 0
      })))
      setSimDrawdown((activeEditingPlan as any).drawdownLimit ?? 10.0)
      setSimTarget((activeEditingPlan as any).profitTarget ?? 20.0)
      setSimHedging((activeEditingPlan as any).hedgingRatio ?? 0.0)
      setSimAction((activeEditingPlan as any).lossLimitAction || 'pause')
    }
  }, [activeEditingPlan])

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans')
      if (!res.ok) throw new Error('Failed to fetch plans')
      const data = await res.json()
      setPlans(data.map((p: PlanType) => ({ ...p, isEditing: false, isExpanded: false })))
    } catch {
      toast({ title: 'Error', description: 'Failed to load plans', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleEdit = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, isEditing: true } : p))
  }

  const handleCancel = (id: string) => {
    const plan = plans.find(p => p.id === id)
    if (plan?.isNew) {
      setPlans(prev => prev.filter(p => p.id !== id))
    } else {
      fetchPlans()
    }
  }

  const handleToggleExpand = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, isExpanded: !p.isExpanded } : p))
  }

  const handleChange = (id: string, field: keyof EditablePlan, value: any) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, [field]: value } as any

      // Auto-generate plain English descriptions when related fields change
      if (['dailyEarningPercent', 'maxEarningLimit', 'autoCompound'].includes(field as string)) {
        updated.earningMechanism = generateEarningMechanism(updated)
      }
      if (['lockPeriodDays', 'earlyExitPenalty', 'autoCompound'].includes(field as string)) {
        updated.withdrawalRule = generateWithdrawalRule(updated)
      }
      if (['stackingEnabled', 'maxStacks', 'stackingBonusPercent'].includes(field as string)) {
        updated.stackingRule = generateStackingRule(updated)
      }

      // Sync cap & multiplier
      if (field === 'minDeposit' || field === 'maxEarningMultiplier') {
        const mult = updated.maxEarningMultiplier ?? 2.0
        const minDep = updated.minDeposit ?? 100
        updated.maxEarningLimit = Number((minDep * mult).toFixed(2))
        updated.earningMechanism = generateEarningMechanism(updated)
      }
      if (field === 'maxEarningLimit') {
        const minDep = updated.minDeposit ?? 100
        if (minDep > 0) {
          updated.maxEarningMultiplier = Number((value / minDep).toFixed(1))
        }
        updated.earningMechanism = generateEarningMechanism(updated)
      }

      return updated
    }))
  }

  const handleSave = async (plan: EditablePlan) => {
    // Validate distribution totals (8-way split check)
    const distTotal = plan.accountHolderPercent +
      plan.tradeProfitSharePercent +
      plan.rewardsOffersPercent +
      plan.platformFeePercent +
      (plan.charityDonationPercent || 0) +
      (plan.insuranceReservePercent || 0) +
      (plan.developerFundPercent || 0) +
      (plan.liquidityPoolPercent || 0)

    if (Math.abs(distTotal - 100) > 0.01) {
      toast({ title: 'Validation Error', description: `Distribution percentages must total 100%. Currently: ${distTotal}%`, variant: 'destructive' })
      return
    }
    const subTotal = plan.subscriptionReferralPercent + plan.subscriptionRewardsPercent + plan.subscriptionPlatformPercent
    if (Math.abs(subTotal - 100) > 0.01) {
      toast({ title: 'Validation Error', description: `Subscription distribution must total 100%. Currently: ${subTotal}%`, variant: 'destructive' })
      return
    }
    if (!plan.name.trim()) {
      toast({ title: 'Validation Error', description: 'Plan name is required', variant: 'destructive' })
      return
    }

    setSaving(plan.id)
    try {
      if (plan.isNew) {
        const { id, isEditing, isNew, isExpanded, ...data } = plan as any
        // Ensure auto-generated fields are included
        data.earningMechanism = data.earningMechanism || generateEarningMechanism(data)
        data.withdrawalRule = data.withdrawalRule || generateWithdrawalRule(data)
        data.stackingRule = data.stackingRule || generateStackingRule(data)
        const res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to create plan')
        toast({ title: 'Plan Created', description: `${plan.name} has been created successfully` })
      } else {
        const { id, isEditing, isNew, isExpanded, ...data } = plan as any
        const res = await fetch('/api/admin/plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: plan.id, ...data }),
        })
        if (!res.ok) throw new Error('Failed to update plan')
        toast({ title: 'Plan Updated', description: `${plan.name} has been updated successfully` })
      }
      fetchPlans()
    } catch {
      toast({ title: 'Error', description: 'Failed to save plan', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete plan')
      toast({ title: 'Plan Deleted', description: 'The plan has been removed' })
      fetchPlans()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleAddNew = () => {
    const newPlan: EditablePlan = {
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      entryFee: 0,
      minDeposit: 100,
      maxDeposit: 1000,
      dailyEarningPercent: 5,
      maxEarningLimit: 1000,
      // Time-based fields
      returnType: 'daily',
      returnPeriodHours: 24,
      totalReturnPercent: 0,
      durationDays: 0,
      capitalReturn: 'included',
      repeatCount: 0,
      stackingEnabled: false,
      maxStacks: 1,
      stackingBonusPercent: 0,
      lockPeriodDays: 0,
      autoCompound: false,
      earlyExitPenalty: 0,
      accountHolderPercent: 50,
      tradeProfitSharePercent: 30,
      rewardsOffersPercent: 15,
      platformFeePercent: 5,
      subscriptionReferralPercent: 80,
      subscriptionRewardsPercent: 15,
      subscriptionPlatformPercent: 5,
      earningMechanism: 'Daily earnings at 5% of deposit amount, capped at $1,000 total. Earnings accrue Monday to Friday.',
      withdrawalRule: 'No lock-in period. Earnings available for withdrawal anytime.',
      stackingRule: 'Single deposit only per plan.',
      isActive: true,
      sortOrder: plans.length + 1,
      isEditing: true,
      isNew: true,
      isExpanded: true,
      maxEarningMultiplier: 2.0,
      drawdownLimit: 10.0,
      profitTarget: 20.0,
      hedgingRatio: 0.0,
      lossLimitAction: 'pause',
      pnlLogicDescription: 'Base risk settings initialized.',
      // New configurations
      depositMultipleOf: 100.0,
      strictMultiples: true,
      dailyEarningCapPercent: 200.0,
      cappingAppliesTo: 'all',
      registrationReferralLevels: 7,
      minLossPercent: 0.1,
      maxLossPercent: 5.0,
      allowNegativeBalance: false,
      maxConsecutiveLossDays: 3,
      charityDonationPercent: 0,
      insuranceReservePercent: 0,
      developerFundPercent: 0,
      liquidityPoolPercent: 0,
      profitDays: 'mon,tue,wed,thu,fri',
      gracePeriodDays: 0,
      volatilityMode: 'moderate',
      lossDayChance: 0,
      bonusDayChance: 5,
      minVipTier: 'Bronze',
      spotsLimit: 0,
      referralRules: [
        { level: 1, commission: 25, amount: 0 },
        { level: 2, commission: 20, amount: 0 },
        { level: 3, commission: 15, amount: 0 },
        { level: 4, commission: 10, amount: 0 },
        { level: 5, commission: 10, amount: 0 },
        { level: 6, commission: 10, amount: 0 },
        { level: 7, commission: 10, amount: 0 },
      ],
    }
    setNewPlanData(newPlan)
    setShowCreateDialog(true)
  }

  // Handle changes for the create dialog plan
  const handleNewPlanChange = (id: string, field: keyof EditablePlan, value: any) => {
    setNewPlanData(prev => {
      if (!prev) return prev
      const updated = { ...prev, [field]: value } as any
      if (['dailyEarningPercent', 'maxEarningLimit', 'autoCompound'].includes(field as string)) {
        updated.earningMechanism = generateEarningMechanism(updated)
      }
      if (['lockPeriodDays', 'earlyExitPenalty', 'autoCompound'].includes(field as string)) {
        updated.withdrawalRule = generateWithdrawalRule(updated)
      }
      if (['stackingEnabled', 'maxStacks', 'stackingBonusPercent'].includes(field as string)) {
        updated.stackingRule = generateStackingRule(updated)
      }

      // Sync cap & multiplier
      if (field === 'minDeposit' || field === 'maxEarningMultiplier') {
        const mult = updated.maxEarningMultiplier ?? 2.0
        const minDep = updated.minDeposit ?? 100
        updated.maxEarningLimit = Number((minDep * mult).toFixed(2))
        updated.earningMechanism = generateEarningMechanism(updated)
      }
      if (field === 'maxEarningLimit') {
        const minDep = updated.minDeposit ?? 100
        if (minDep > 0) {
          updated.maxEarningMultiplier = Number((value / minDep).toFixed(1))
        }
        updated.earningMechanism = generateEarningMechanism(updated)
      }

      return updated
    })
  }

  const handleNewPlanRegenerateField = (id: string, field: 'earningMechanism' | 'withdrawalRule' | 'stackingRule') => {
    setNewPlanData(prev => {
      if (!prev) return prev
      const updated = { ...prev }
      if (field === 'earningMechanism') updated.earningMechanism = generateEarningMechanism(updated)
      if (field === 'withdrawalRule') updated.withdrawalRule = generateWithdrawalRule(updated)
      if (field === 'stackingRule') updated.stackingRule = generateStackingRule(updated)
      return updated
    })
  }

  const handleSaveNewPlan = async () => {
    if (!newPlanData) return
    // Validate (8-way split check)
    const distTotal = newPlanData.accountHolderPercent +
      newPlanData.tradeProfitSharePercent +
      newPlanData.rewardsOffersPercent +
      newPlanData.platformFeePercent +
      (newPlanData.charityDonationPercent || 0) +
      (newPlanData.insuranceReservePercent || 0) +
      (newPlanData.developerFundPercent || 0) +
      (newPlanData.liquidityPoolPercent || 0)

    if (Math.abs(distTotal - 100) > 0.01) {
      toast({ title: 'Validation Error', description: `Distribution percentages must total 100%. Currently: ${distTotal}%`, variant: 'destructive' })
      return
    }
    if (!newPlanData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Plan name is required', variant: 'destructive' })
      return
    }

    setSaving(newPlanData.id)
    try {
      const { id, isEditing, isNew, isExpanded, ...data } = newPlanData as any
      data.earningMechanism = data.earningMechanism || generateEarningMechanism(data)
      data.withdrawalRule = data.withdrawalRule || generateWithdrawalRule(data)
      data.stackingRule = data.stackingRule || generateStackingRule(data)
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create plan')
      toast({ title: 'Plan Created', description: `${newPlanData.name} has been created successfully` })
      setShowCreateDialog(false)
      setNewPlanData(null)
      fetchPlans()
    } catch {
      toast({ title: 'Error', description: 'Failed to save plan', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const handleRegenerateField = (id: string, field: 'earningMechanism' | 'withdrawalRule' | 'stackingRule') => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p }
      if (field === 'earningMechanism') updated.earningMechanism = generateEarningMechanism(updated)
      if (field === 'withdrawalRule') updated.withdrawalRule = generateWithdrawalRule(updated)
      if (field === 'stackingRule') updated.stackingRule = generateStackingRule(updated)
      return updated
    }))
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/4 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <div key={j} className="h-10 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  // ─── If creating a new plan, show full-page form (Perfex CRM style) ──────
  if (showCreateDialog && newPlanData) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowCreateDialog(false); setNewPlanData(null) }}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Back to Plans
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium">Create New Investment Plan</span>
          </div>
        </div>

        {/* Full-page Plan Form */}
        <PlanCard
          plan={newPlanData}
          saving={saving === newPlanData.id}
          onDelete={() => {}}
          onEdit={() => {}}
          onCancel={() => { setShowCreateDialog(false); setNewPlanData(null) }}
          onSave={handleSaveNewPlan}
          onChange={handleNewPlanChange}
          onToggleExpand={() => setNewPlanData(prev => prev ? { ...prev, isExpanded: !prev.isExpanded } : prev)}
          onRegenerateField={handleNewPlanRegenerateField}
          isDeleteTarget={false}
          onDeleteConfirm={() => {}}
          onDeleteCancel={() => {}}
        />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Investment Plans</h2>
          <p className="text-sm text-muted-foreground mt-1">Advanced plan builder with field-based configuration</p>
        </div>
        <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Add New Plan
        </Button>
      </div>

      {/* Plan Cards */}
      <div className="space-y-4">
        {plans.filter(p => !p.isNew).map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            saving={saving === plan.id}
            onDelete={() => setDeleteTarget(plan.id)}
            onEdit={() => handleEdit(plan.id)}
            onCancel={() => handleCancel(plan.id)}
            onSave={() => handleSave(plan)}
            onChange={handleChange}
            onToggleExpand={() => handleToggleExpand(plan.id)}
            onRegenerateField={handleRegenerateField}
            isDeleteTarget={deleteTarget === plan.id}
            onDeleteConfirm={() => handleDelete(plan.id)}
            onDeleteCancel={() => setDeleteTarget(null)}
          />
        ))}
      </div>

      {plans.length === 0 && (
        <Card className="bg-card/50 border-border/50 border-dashed">
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No plans yet. Click &ldquo;Add New Plan&rdquo; to create one.</p>
          </CardContent>
        </Card>
      )}

      {/* Floating Yield Simulator Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowCalc(!showCalc)}
          className="rounded-full shadow-lg h-12 w-12 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center p-0"
        >
          <BarChart3 className="size-6 animate-pulse" />
        </Button>
      </div>

      {showCalc && (
        <Card className="fixed bottom-20 right-6 z-50 w-[350px] md:w-[450px] max-h-[85vh] overflow-y-auto bg-card/95 border border-emerald-500/20 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
          <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Plan Yield Simulator & Calculator
              </CardTitle>
              <CardDescription className="text-[10px]">
                Simulate splits and limits based on plan config
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setShowCalc(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            {/* Sync Alert */}
            {activeEditingPlan ? (
              <div className="p-2 rounded bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 flex items-center justify-between">
                <span>Simulating active plan in editor: <strong>{simName || 'Untitled'}</strong></span>
                <Button 
                  size="sm" 
                  className="h-5 text-[9px] bg-violet-600 hover:bg-violet-700 text-white py-0 px-2 font-medium"
                  onClick={() => {
                    const id = activeEditingPlan.id
                    handleChange(id, 'minDeposit', simMinDeposit)
                    handleChange(id, 'dailyEarningPercent', simDailyRate)
                    handleChange(id, 'maxEarningMultiplier', simCapMult)
                    handleChange(id, 'maxEarningLimit', simMinDeposit * simCapMult)
                    handleChange(id, 'accountHolderPercent', simHolder)
                    handleChange(id, 'tradeProfitSharePercent', simShared)
                    handleChange(id, 'rewardsOffersPercent', simRewards)
                    handleChange(id, 'platformFeePercent', simPlatform)
                    handleChange(id, 'charityDonationPercent', simCharity)
                    handleChange(id, 'insuranceReservePercent', simInsurance)
                    handleChange(id, 'developerFundPercent', simDeveloper)
                    handleChange(id, 'liquidityPoolPercent', simLiquidity)
                    handleChange(id, 'drawdownLimit', simDrawdown)
                    handleChange(id, 'profitTarget', simTarget)
                    handleChange(id, 'hedgingRatio', simHedging)
                    handleChange(id, 'lossLimitAction', simAction)
                    if (simRules.length > 0) {
                      handleChange(id, 'referralRules', simRules)
                    }
                    toast({ title: 'Plan Builder Synced', description: 'Form fields populated with calculator parameters.' })
                  }}
                >
                  Sync to Form
                </Button>
              </div>
            ) : (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400">
                <p>No active plan is being edited. Tweak parameters below and click "Create New Plan" to populate the form.</p>
                <Button 
                  size="sm" 
                  className="h-5 text-[9px] bg-amber-600 hover:bg-amber-700 text-white py-0 px-2 mt-1.5 w-full font-medium"
                  onClick={() => {
                    handleAddNew()
                    setTimeout(() => {
                      toast({ title: 'New Plan Form Created', description: 'Click Sync to Form inside calculator to apply values.' })
                    }, 500)
                  }}
                >
                  Create Plan from Simulator
                </Button>
              </div>
            )}

            {/* Simulated Inputs */}
            <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/20">
              <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Simulated Test Parameters</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Simulated Investment ($)</span>
                  <span className="text-emerald-400 font-bold">${simPrincipal.toLocaleString()}</span>
                </div>
                <Slider
                  value={[simPrincipal]}
                  onValueChange={([v]) => setSimPrincipal(v)}
                  min={100}
                  max={10000}
                  step={100}
                  className="py-1"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Simulated Daily Rate (%)</span>
                  <span className="text-cyan-400 font-bold">{simYieldPercent}%</span>
                </div>
                <Slider
                  value={[simYieldPercent]}
                  onValueChange={([v]) => setSimYieldPercent(v)}
                  min={0.1}
                  max={10.0}
                  step={0.1}
                  className="py-1"
                />
              </div>
            </div>

            {/* Plan Configuration Controls */}
            <div className="space-y-3">
              <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Simulator Baseline Configuration</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Daily Return Base (%)</Label>
                  <Input 
                    type="number" 
                    step="0.05"
                    value={simDailyRate} 
                    onChange={e => setSimDailyRate(parseFloat(e.target.value) || 0)} 
                    className="h-7 text-xs bg-muted/30"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Cap Multiplier (X)</Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    value={simCapMult} 
                    onChange={e => setSimCapMult(parseFloat(e.target.value) || 0)} 
                    className="h-7 text-xs bg-muted/30"
                  />
                </div>
              </div>

              {/* Splits Sliders */}
              <div className="space-y-2 p-2 rounded bg-muted/10 border border-border/30">
                <span className="font-semibold text-[10px] text-muted-foreground">Distribution Splits (%)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground">Holder: {simHolder}%</span>
                    <input type="range" min={0} max={100} value={simHolder} onChange={e => {
                      const v = parseInt(e.target.value) || 0
                      setSimHolder(v)
                    }} className="w-full h-1 bg-emerald-500/20 cursor-pointer accent-emerald-500 rounded-full" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground">Shared Pool: {simShared}%</span>
                    <input type="range" min={0} max={100} value={simShared} onChange={e => {
                      const v = parseInt(e.target.value) || 0
                      setSimShared(v)
                    }} className="w-full h-1 bg-cyan-500/20 cursor-pointer accent-cyan-500 rounded-full" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground">Rewards: {simRewards}%</span>
                    <input type="range" min={0} max={100} value={simRewards} onChange={e => {
                      const v = parseInt(e.target.value) || 0
                      setSimRewards(v)
                    }} className="w-full h-1 bg-amber-500/20 cursor-pointer accent-amber-500 rounded-full" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground">Platform: {simPlatform}%</span>
                    <input type="range" min={0} max={100} value={simPlatform} onChange={e => {
                      const v = parseInt(e.target.value) || 0
                      setSimPlatform(v)
                    }} className="w-full h-1 bg-rose-500/20 cursor-pointer accent-rose-500 rounded-full" />
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-1.5 rounded-full overflow-hidden flex mt-2 bg-muted">
                  <div className="bg-emerald-500" style={{ width: `${simHolder}%` }} />
                  <div className="bg-cyan-500" style={{ width: `${simShared}%` }} />
                  <div className="bg-amber-500" style={{ width: `${simRewards}%` }} />
                  <div className="bg-rose-500" style={{ width: `${simPlatform}%` }} />
                  <div className="bg-purple-500" style={{ width: `${simCharity}%` }} />
                  <div className="bg-blue-500" style={{ width: `${simInsurance}%` }} />
                  <div className="bg-indigo-500" style={{ width: `${simDeveloper}%` }} />
                  <div className="bg-teal-500" style={{ width: `${simLiquidity}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>Sum: {simHolder + simShared + simRewards + simPlatform + simCharity + simInsurance + simDeveloper + simLiquidity}%</span>
                  <span className={Math.abs(simHolder + simShared + simRewards + simPlatform + simCharity + simInsurance + simDeveloper + simLiquidity - 100) < 0.01 ? "text-emerald-400" : "text-rose-400"}>
                    {Math.abs(simHolder + simShared + simRewards + simPlatform + simCharity + simInsurance + simDeveloper + simLiquidity - 100) < 0.01 ? "Valid (100%)" : "Invalid (Must be 100%)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time yields outputs */}
            {(() => {
              const rawYield = (simPrincipal * simYieldPercent) / 100
              const maxCapValue = simMinDeposit * simCapMult
              const isCapped = rawYield > maxCapValue
              const finalYield = isCapped ? maxCapValue : rawYield

              const holderPayout = (finalYield * simHolder) / 100
              const sharedPoolPayout = (finalYield * simShared) / 100
              const rewardsPayout = (finalYield * simRewards) / 100
              const platformPayout = (finalYield * simPlatform) / 100

              return (
                <div className="space-y-3 pt-3 border-t border-border/50">
                  <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Simulated Yield Results</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[10px] text-muted-foreground">Daily Gross Yield</p>
                      <p className="text-base font-bold text-emerald-400 flex items-center justify-between">
                        ${rawYield.toFixed(2)}
                        {isCapped && <Badge className="bg-rose-500/20 text-rose-400 text-[8px] h-4">Capped</Badge>}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                      <p className="text-[10px] text-muted-foreground">Daily Cap Limit</p>
                      <p className="text-base font-bold text-cyan-400">${maxCapValue.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 p-2 bg-card rounded border border-border/50 font-mono text-[10px] leading-tight">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investor Share ({simHolder}%):</span>
                      <span className="font-semibold text-emerald-400">${holderPayout.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shared Pool ({simShared}%):</span>
                      <span className="font-semibold text-cyan-400">${sharedPoolPayout.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rewards Share ({simRewards}%):</span>
                      <span className="font-semibold text-amber-400">${rewardsPayout.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee ({simPlatform}%):</span>
                      <span className="font-semibold text-rose-400">${platformPayout.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Level wise breakdown */}
                  {sharedPoolPayout > 0 && (
                    <div className="space-y-1">
                      <span className="font-semibold text-[10px] text-muted-foreground block">Sponsor Level Payouts:</span>
                      <div className="max-h-[120px] overflow-y-auto border border-border/30 rounded p-1 bg-muted/10 space-y-1">
                        {Array.from({ length: simLevels }).map((_, idx) => {
                          const lvl = idx + 1
                          const rule = simRules.find(r => r.level === lvl)
                          const defaultRates = [25, 20, 15, 10, 10, 10, 10]
                          const rate = rule ? rule.commission : (defaultRates[idx] ?? 0)
                          const amt = rule ? (rule.amount || 0) : 0

                          let levelPayout = 0
                          let calcText = ''
                          if (amt > 0) {
                            levelPayout = amt
                            calcText = `Fixed: $${amt.toFixed(2)}`
                          } else {
                            levelPayout = (sharedPoolPayout * rate) / 100
                            calcText = `${rate}% of Shared Pool: $${levelPayout.toFixed(2)}`
                          }

                          return (
                            <div key={lvl} className="flex justify-between text-[9px] border-b border-border/10 pb-0.5 last:border-0 font-mono">
                              <span className="text-muted-foreground">Level {lvl}:</span>
                              <span className="text-foreground">{calcText}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Advanced P&L checks */}
                  <div className="p-2 bg-muted/20 rounded border border-border/30 text-[9px] text-muted-foreground">
                    <span className="font-semibold text-foreground block mb-0.5">Advanced Risk Checks:</span>
                    <span>Max Drawdown: <strong>{simDrawdown}%</strong> • Profit Target: <strong>{simTarget}%</strong> • Hedging Cover: <strong>{simHedging}%</strong> • Action: <strong>{simAction}</strong></span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Plan Card Component ─────────────────────────────────────────────────────
function PlanCard({
  plan,
  saving,
  onDelete,
  onEdit,
  onCancel,
  onSave,
  onChange,
  onToggleExpand,
  onRegenerateField,
  isDeleteTarget,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  plan: EditablePlan
  saving: boolean
  onDelete: () => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onChange: (id: string, field: keyof EditablePlan, value: any) => void
  onToggleExpand: () => void
  onRegenerateField: (id: string, field: 'earningMechanism' | 'withdrawalRule' | 'stackingRule') => void
  isDeleteTarget: boolean
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}) {
  if (plan.isEditing) {
    return <PlanEditor plan={plan} saving={saving} onCancel={onCancel} onSave={onSave} onChange={onChange} onRegenerateField={onRegenerateField} />
  }

  return <PlanSummary plan={plan} onEdit={onEdit} onDelete={onDelete} isExpanded={!!plan.isExpanded} onToggleExpand={onToggleExpand} isDeleteTarget={isDeleteTarget} onDeleteConfirm={onDeleteConfirm} onDeleteCancel={onDeleteCancel} />
}

// ─── Plan Editor (editing mode) ──────────────────────────────────────────────
function PlanEditor({
  plan,
  saving,
  onCancel,
  onSave,
  onChange,
  onRegenerateField,
}: {
  plan: EditablePlan
  saving: boolean
  onCancel: () => void
  onSave: () => void
  onChange: (id: string, field: keyof EditablePlan, value: any) => void
  onRegenerateField: (id: string, field: 'earningMechanism' | 'withdrawalRule' | 'stackingRule') => void
}) {
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  // AI Referral & Bonus prompt states
  const [aiReferralPrompt, setAiReferralPrompt] = useState('')
  const [generatingReferrals, setGeneratingReferrals] = useState(false)

  // AI Conditional Logics prompt states
  const [aiLogicPrompt, setAiLogicPrompt] = useState('')
  const [generatingLogics, setGeneratingLogics] = useState(false)

  // Expanded details row index/key
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  const [showRegOverrides, setShowRegOverrides] = useState(false)
  const [showProfitOverrides, setShowProfitOverrides] = useState(false)
  const [showDepositOverrides, setShowDepositOverrides] = useState(false)
  const [showConditionalLogics, setShowConditionalLogics] = useState(false)

  // Global Logic Builder variables configuration
  const [logicConfig, setLogicConfig] = useState<any>(null)
  useEffect(() => {
    fetch('/api/admin/logic-builder')
      .then(r => r.json())
      .then(setLogicConfig)
      .catch(() => {})
  }, [])


  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      })
      if (!res.ok) throw new Error('AI generation failed')
      const generated = await res.json()

      // Populate fields in the form
      Object.entries(generated).forEach(([k, v]) => {
        onChange(plan.id, k as any, v)
      })

      // Also trigger regeneration of plain english descriptions
      setTimeout(() => {
        onRegenerateField(plan.id, 'earningMechanism')
        onRegenerateField(plan.id, 'withdrawalRule')
        onRegenerateField(plan.id, 'stackingRule')
      }, 100)

      toast({ title: 'AI Generation Successful', description: 'Plan configurations populated.' })
    } catch (err) {
      toast({ title: 'AI Generation Failed', description: 'Could not generate plan from prompt.', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateReferrals = async () => {
    if (!aiReferralPrompt.trim()) return
    setGeneratingReferrals(true)
    try {
      const res = await fetch('/api/ai/generate-referral-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiReferralPrompt, currentRules: plan.referralRules || [] })
      })
      if (!res.ok) throw new Error('AI generation failed')
      const generated = await res.json()
      if (generated.rules && Array.isArray(generated.rules)) {
        ch('referralRules', generated.rules)
        toast({ title: 'Referral Rules Updated', description: 'Referral override rules populated from prompt.' })
      } else {
        throw new Error('Invalid response structure')
      }
    } catch (err) {
      toast({ title: 'AI Generation Failed', description: 'Could not generate referral rules.', variant: 'destructive' })
    } finally {
      setGeneratingReferrals(false)
    }
  }

  const handleGenerateLogics = async () => {
    if (!aiLogicPrompt.trim()) return
    setGeneratingLogics(true)
    try {
      const res = await fetch('/api/ai/generate-conditional-logics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiLogicPrompt, currentLogics: plan.conditionalLogics || [] })
      })
      if (!res.ok) throw new Error('AI generation failed')
      const generated = await res.json()
      if (generated.logics && Array.isArray(generated.logics)) {
        ch('conditionalLogics', generated.logics)
        toast({ title: 'Conditional Logics Updated', description: 'Plan conditional logics populated from prompt.' })
      } else {
        throw new Error('Invalid response structure')
      }
    } catch (err) {
      toast({ title: 'AI Generation Failed', description: 'Could not generate conditional logics.', variant: 'destructive' })
    } finally {
      setGeneratingLogics(false)
    }
  }

  const updateRule = (indexInRules: number, field: string, value: any) => {
    const currentRules = [...(plan.referralRules || [])]
    currentRules[indexInRules] = {
      ...currentRules[indexInRules],
      [field]: value
    }
    ch('referralRules', currentRules)
  }

  const addRuleRow = (type: string) => {
    const currentRules = [...(plan.referralRules || [])]
    let nextLvl = 1
    while (currentRules.some(r => r.type === type && r.level === nextLvl) && nextLvl < 20) {
      nextLvl++
    }
    currentRules.push({
      level: nextLvl,
      commission: 0,
      amount: 0,
      type,
      minSponsorDeposit: 0,
      minDirectReferrals: 0,
      targetWallet: type === 'profit' ? 'withdrawal' : 'trading',
      enabled: true
    })
    ch('referralRules', currentRules)
  }

  const deleteRuleRow = (index: number) => {
    const currentRules = [...(plan.referralRules || [])]
    currentRules.splice(index, 1)
    ch('referralRules', currentRules)
  }

  const addLogicRow = () => {
    const currentLogics = [...(plan.conditionalLogics || [])]
    const maxPriority = currentLogics.reduce((max, l) => Math.max(max, l.priority), 0)
    currentLogics.push({
      enabled: true,
      priority: maxPriority + 10,
      conditionType: 'daily_yield',
      operator: '>',
      value: '0.0',
      actionType: 'adjust_yield',
      actionValue: '+0.0',
      description: 'New conditional rule'
    })
    ch('conditionalLogics', currentLogics)
  }

  const updateLogic = (index: number, field: string, value: any) => {
    const currentLogics = [...(plan.conditionalLogics || [])]
    currentLogics[index] = {
      ...currentLogics[index],
      [field]: value
    }
    ch('conditionalLogics', currentLogics)
  }

  const deleteLogicRow = (index: number) => {
    const currentLogics = [...(plan.conditionalLogics || [])]
    currentLogics.splice(index, 1)
    ch('conditionalLogics', currentLogics)
  }

  const renderOverrideSection = (type: string, title: string, totalPoolField?: string) => {
    const isOpen = type === 'registration' ? showRegOverrides : type === 'profit' ? showProfitOverrides : showDepositOverrides
    const setIsOpen = type === 'registration' ? setShowRegOverrides : type === 'profit' ? setShowProfitOverrides : setShowDepositOverrides

    const allRules = plan.referralRules || []
    const rulesWithType = allRules.map((r, index) => ({ ...r, originalIndex: index })).filter(r => r.type === type)

    const totalComm = rulesWithType.reduce((sum, r) => sum + (r.commission || 0), 0)
    const poolValue = totalPoolField ? (plan as any)[totalPoolField] : null
    const isBalanced = poolValue !== null ? Math.abs(totalComm - poolValue) < 0.01 : true

    return (
      <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10">
        <div 
          className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            <span className="text-xs font-semibold text-foreground">{title}</span>
            <Badge variant="outline" className="text-[10px] bg-background/50 border-border/50">
              {rulesWithType.length} active
            </Badge>
          </div>
          {poolValue !== null && (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <Badge variant="outline" className={cn(
                isBalanced 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]" 
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]"
              )}>
                Total: {totalComm.toFixed(1)}% / Pool: {poolValue}%
              </Badge>
              {!isBalanced && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-5 text-[9px] px-1.5 py-0 border-amber-500/30 hover:bg-amber-500/10 text-amber-400 bg-background/50"
                  onClick={() => {
                    const count = plan.registrationReferralLevels || 7
                    const pctPerLevel = Number((poolValue / count).toFixed(2))
                    
                    const otherTypeRules = allRules.filter(r => r.type !== type)
                    const newTypeRules = Array.from({ length: count }).map((_, i) => {
                      const lvl = i + 1
                      const existing = rulesWithType.find(r => r.level === lvl)
                      return {
                        level: lvl,
                        commission: pctPerLevel,
                        amount: existing ? (existing.amount || 0) : 0,
                        type,
                        minSponsorDeposit: existing ? (existing.minSponsorDeposit || 0) : 0,
                        minDirectReferrals: existing ? (existing.minDirectReferrals || 0) : 0,
                        targetWallet: existing ? (existing.targetWallet || 'trading') : 'trading',
                        enabled: existing ? existing.enabled : true
                      }
                    })
                    ch('referralRules', [...otherTypeRules, ...newTypeRules])
                  }}
                >
                  Auto-Balance
                </Button>
              )}
            </div>
          )}
        </div>

        {isOpen && (
          <div className="p-3 border-t border-border/20 space-y-3 bg-background/30">
            {rulesWithType.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No overrides defined for this type. Payouts will fallback to default values.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-2 w-[100px]">Level</th>
                      <th className="p-2 w-[120px]">Commission (%)</th>
                      <th className="p-2 w-[120px]">Fixed Amount ($)</th>
                      <th className="p-2 text-center w-[80px]">Status</th>
                      <th className="p-2 w-[100px]">Options</th>
                      <th className="p-2 w-[60px] text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rulesWithType.map((rule) => {
                      const isRuleExpanded = expandedRule === `${type}-${rule.originalIndex}`
                      return (
                        <Fragment key={rule.originalIndex}>
                          <tr className="border-b border-border/20 hover:bg-muted/10">
                            <td className="p-2">
                              <select
                                value={rule.level}
                                onChange={e => updateRule(rule.originalIndex, 'level', parseInt(e.target.value) || 1)}
                                className="bg-muted/50 border border-border/50 rounded h-7 px-1.5 text-[11px] text-foreground w-[80px]"
                              >
                                {Array.from({ length: 20 }).map((_, i) => (
                                  <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <div className="relative max-w-[100px]">
                                <Input
                                  type="number"
                                  value={rule.commission}
                                  onChange={e => updateRule(rule.originalIndex, 'commission', parseFloat(e.target.value) || 0)}
                                  className="bg-muted/50 border border-border/50 h-7 pr-5 text-[11px] w-full"
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">%</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="relative max-w-[100px]">
                                <Input
                                  type="number"
                                  value={rule.amount}
                                  onChange={e => updateRule(rule.originalIndex, 'amount', parseFloat(e.target.value) || 0)}
                                  className="bg-muted/50 border border-border/50 h-7 pr-5 text-[11px] w-full"
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">$</span>
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={checked => updateRule(rule.originalIndex, 'enabled', checked)}
                                className="scale-75"
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1"
                                onClick={() => setExpandedRule(isRuleExpanded ? null : `${type}-${rule.originalIndex}`)}
                              >
                                <Settings className="h-3 w-3" />
                                {isRuleExpanded ? 'Hide' : 'Configure'}
                              </Button>
                            </td>
                            <td className="p-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                onClick={() => deleteRuleRow(rule.originalIndex)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>

                          {isRuleExpanded && (
                            <tr className="bg-muted/15 border-b border-border/20">
                              <td colSpan={6} className="p-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Min Sponsor Active Deposit ($)</Label>
                                    <Input
                                      type="number"
                                      value={rule.minSponsorDeposit || 0}
                                      onChange={e => updateRule(rule.originalIndex, 'minSponsorDeposit', parseFloat(e.target.value) || 0)}
                                      className="bg-muted/50 border border-border/50 h-8 text-xs"
                                      placeholder="0 (no minimum)"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Min Direct Referrals Required</Label>
                                    <Input
                                      type="number"
                                      value={rule.minDirectReferrals || 0}
                                      onChange={e => updateRule(rule.originalIndex, 'minDirectReferrals', parseInt(e.target.value) || 0)}
                                      className="bg-muted/50 border border-border/50 h-8 text-xs"
                                      placeholder="0 (no minimum)"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Payout Wallet Destination</Label>
                                    <select
                                      value={rule.targetWallet || 'trading'}
                                      onChange={e => updateRule(rule.originalIndex, 'targetWallet', e.target.value)}
                                      className="w-full bg-muted/50 border border-border/50 rounded-md h-8 px-2 text-xs text-foreground"
                                    >
                                      <option value="trading">Trading Wallet</option>
                                      <option value="withdrawal">Withdrawal Wallet</option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5"
                onClick={() => addRuleRow(type)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Level Override
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const distTotal = useMemo(() =>
    plan.accountHolderPercent +
    plan.tradeProfitSharePercent +
    plan.rewardsOffersPercent +
    plan.platformFeePercent +
    (plan.charityDonationPercent || 0) +
    (plan.insuranceReservePercent || 0) +
    (plan.developerFundPercent || 0) +
    (plan.liquidityPoolPercent || 0),
    [
      plan.accountHolderPercent,
      plan.tradeProfitSharePercent,
      plan.rewardsOffersPercent,
      plan.platformFeePercent,
      plan.charityDonationPercent,
      plan.insuranceReservePercent,
      plan.developerFundPercent,
      plan.liquidityPoolPercent
    ]
  )

  const subDistTotal = useMemo(() =>
    plan.subscriptionReferralPercent + plan.subscriptionRewardsPercent + plan.subscriptionPlatformPercent,
    [plan.subscriptionReferralPercent, plan.subscriptionRewardsPercent, plan.subscriptionPlatformPercent]
  )

  const distValid = Math.abs(distTotal - 100) < 0.01
  const subDistValid = Math.abs(subDistTotal - 100) < 0.01

  const ch = (field: keyof EditablePlan, value: any) => onChange(plan.id, field, value)

  return (
    <Card className="bg-card/50 border-emerald-500/30 shadow-lg shadow-emerald-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-emerald-400" />
            {plan.isNew ? 'Create New Plan' : `Editing: ${plan.name || 'Untitled'}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Plan Assistant */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">AI Plan Assistant</h4>
              <p className="text-[11px] text-muted-foreground">Describe your plan in plain text (e.g., "Create a VIP high yield plan with 1.2% daily profit, Mon-Fri schedule, minimum deposit $500, with 5 referral levels")</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe the plan rules, splits, or schedules..."
              className="bg-muted/50 border-border/50 resize-none h-16 text-xs flex-1"
            />
            <Button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={generating || !aiPrompt.trim()}
              className="sm:self-end bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs h-9"
            >
              {generating ? 'Thinking...' : 'Generate with AI'}
            </Button>
          </div>
        </div>

        {/* Connected Global Logic Builder Variables */}
        {logicConfig && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Global Logic Builder Variables</h4>
                  <p className="text-[11px] text-muted-foreground">Connected to platform-wide active rules</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[10px] bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20"
                onClick={() => {
                  const capPercent = logicConfig.variables?.find((v: any) => v.id === 'var_daily_cap')?.value ?? 0
                  const floorPercent = logicConfig.variables?.find((v: any) => v.id === 'var_min_floor')?.value ?? 0
                  
                  ch('dailyEarningCapPercent', capPercent)
                  ch('minLossPercent', floorPercent)
                  toast({
                    title: 'Applied Global Baseline',
                    description: `Daily Capping set to ${capPercent}%, Min Floor set to ${floorPercent}%.`
                  })
                }}
              >
                Apply Baseline Settings
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-muted-foreground bg-background/20 p-2.5 rounded-lg border border-border/30">
              <div>
                <span className="block font-medium text-foreground">Skew Exponent</span>
                <span>{logicConfig.variables?.find((v: any) => v.id === 'var_base_skew')?.value ?? 3} (var_base_skew)</span>
              </div>
              <div>
                <span className="block font-medium text-foreground">Volatility noise</span>
                <span>{logicConfig.variables?.find((v: any) => v.id === 'var_volatility')?.value ?? 0.5} (var_volatility)</span>
              </div>
              <div>
                <span className="block font-medium text-foreground">Min floor</span>
                <span>{logicConfig.variables?.find((v: any) => v.id === 'var_min_floor')?.value ?? 0.1}% (var_min_floor)</span>
              </div>
              <div>
                <span className="block font-medium text-foreground">Daily return cap</span>
                <span>{logicConfig.variables?.find((v: any) => v.id === 'var_daily_cap')?.value ?? 15}% (var_daily_cap)</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Basic Info */}
        <SectionCard icon={<Info className="h-4 w-4 text-emerald-400" />} title="Basic Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Plan Name</Label>
              <Input
                value={plan.name}
                onChange={e => ch('name', e.target.value)}
                placeholder="e.g. Starter, Silver, Gold..."
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Sort Order</Label>
              <Input
                type="number"
                value={plan.sortOrder}
                onChange={e => ch('sortOrder', parseInt(e.target.value) || 0)}
                onBlur={e => { if (e.target.value === '') ch('sortOrder', 0) }}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
              <Textarea
                value={plan.description || ''}
                onChange={e => ch('description', e.target.value)}
                placeholder="Plain English description of this plan..."
                className="bg-muted/50 border-border/50 min-h-20 resize-y"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Enable this plan for users</p>
              </div>
              <Switch
                checked={plan.isActive}
                onCheckedChange={checked => ch('isActive', checked)}
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Deposit & Earning Rules */}
        <SectionCard icon={<DollarSign className="h-4 w-4 text-emerald-400" />} title="Deposit & Earning Rules">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <NumberField label="Entry Fee" prefix="$" value={plan.entryFee} onChange={v => ch('entryFee', v)} />
            <NumberField label="Min Deposit" prefix="$" value={plan.minDeposit} onChange={v => ch('minDeposit', v)} />
            <NumberField label="Max Deposit" prefix="$" value={plan.maxDeposit} onChange={v => ch('maxDeposit', v)} />
            <NumberField label="Base Daily % (display)" suffix="%" value={plan.dailyEarningPercent} onChange={v => ch('dailyEarningPercent', v)} />
            <NumberField label="Daily Earning Cap" prefix="$" value={plan.maxEarningLimit} onChange={v => ch('maxEarningLimit', v)} />
            <div className="space-y-1.5 mt-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cap Multiplier</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={plan.maxEarningMultiplier ?? 2.0}
                  onChange={e => ch('maxEarningMultiplier', parseFloat(e.target.value) || 0)}
                  className="bg-muted/50 border-border/50 h-[38px] pr-6 text-xs text-foreground"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">X</span>
              </div>
            </div>
            <NumberField label="Deposit Increment" prefix="$" value={plan.depositMultipleOf || 1} onChange={v => ch('depositMultipleOf', v)} hint="Multiples of" />
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20 h-[58px] mt-1.5">
              <div>
                <p className="text-xs font-semibold">Strict Multiples</p>
                <p className="text-[9px] text-muted-foreground">Only allow deposit multiples</p>
              </div>
              <Switch checked={plan.strictMultiples !== false} onCheckedChange={v => ch('strictMultiples', v)} />
            </div>
            <NumberField label="Daily Earning Cap %" suffix="%" value={plan.dailyEarningCapPercent || 0} onChange={v => ch('dailyEarningCapPercent', v)} hint="0 = no cap" />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Capping Applies To</Label>
              <div className="flex gap-1.5">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'profits_only', label: 'Profits' },
                  { value: 'referrals_only', label: 'Referrals' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => ch('cappingAppliesTo', opt.value)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all",
                      plan.cappingAppliesTo === opt.value
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "border-border/50 text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <NumberField label="Registration Levels" value={plan.registrationReferralLevels || 7} onChange={v => ch('registrationReferralLevels', Math.max(1, Math.min(20, Math.round(v))))} hint="Upline levels" />
          </div>

          {/* Variable Win % Configuration */}
          <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Variable Win Percentage</p>
                <p className="text-[10px] text-muted-foreground">Actual daily returns vary within these ranges per risk level</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Low Risk */}
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <p className="text-xs font-medium text-emerald-400">🟢 Low Risk</p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="Min %" suffix="%" value={(plan as any).lowRiskMin || 0.5} onChange={v => ch('lowRiskMin' as any, v)} />
                  <NumberField label="Max %" suffix="%" value={(plan as any).lowRiskMax || 2.0} onChange={v => ch('lowRiskMax' as any, v)} />
                </div>
              </div>
              {/* Medium Risk */}
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                <p className="text-xs font-medium text-amber-400">🟡 Medium Risk</p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="Min %" suffix="%" value={(plan as any).mediumRiskMin || 2.0} onChange={v => ch('mediumRiskMin' as any, v)} />
                  <NumberField label="Max %" suffix="%" value={(plan as any).mediumRiskMax || 5.0} onChange={v => ch('mediumRiskMax' as any, v)} />
                </div>
              </div>
              {/* High Risk */}
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-2">
                <p className="text-xs font-medium text-rose-400">🔴 High Risk</p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="Min %" suffix="%" value={(plan as any).highRiskMin || 5.0} onChange={v => ch('highRiskMin' as any, v)} />
                  <NumberField label="Max %" suffix="%" value={(plan as any).highRiskMax || 15.0} onChange={v => ch('highRiskMax' as any, v)} />
                </div>
              </div>
            </div>

            {/* Rotation with Stacking */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="text-xs font-medium">Rotate Win % with Stacks</p>
                  <p className="text-[9px] text-muted-foreground">Increase % range per stack level</p>
                </div>
                <Switch checked={(plan as any).rotateWinPercent !== false} onCheckedChange={v => ch('rotateWinPercent' as any, v)} />
              </div>
              <NumberField label="Rotation Increment per Stack" suffix="%" value={(plan as any).rotationIncrement || 0.5} onChange={v => ch('rotationIncrement' as any, v)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<BarChart3 className="h-4 w-4 text-emerald-400" />} title="Advanced P&L Configuration" description="Configure volatility, negative returns, and consecutive loss ceilings">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumberField label="Min Loss %" suffix="%" value={plan.minLossPercent || 0.1} onChange={v => ch('minLossPercent', v)} />
            <NumberField label="Max Loss %" suffix="%" value={plan.maxLossPercent || 5.0} onChange={v => ch('maxLossPercent', v)} />
            <NumberField label="Max Consecutive Loss Days" value={plan.maxConsecutiveLossDays || 3} onChange={v => ch('maxConsecutiveLossDays', Math.max(1, Math.round(v)))} />
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20 h-[58px] mt-1.5 col-span-2 sm:col-span-1">
              <div>
                <p className="text-xs font-semibold">Allow Negative Balance</p>
                <p className="text-[9px] text-muted-foreground">User balance can drop below 0</p>
              </div>
              <Switch checked={plan.allowNegativeBalance || false} onCheckedChange={v => ch('allowNegativeBalance', v)} />
            </div>
            <NumberField label="Drawdown Limit" suffix="%" value={plan.drawdownLimit ?? 10.0} onChange={v => ch('drawdownLimit', v)} />
            <NumberField label="Profit Target" suffix="%" value={plan.profitTarget ?? 20.0} onChange={v => ch('profitTarget', v)} />
            <NumberField label="Hedging Ratio" suffix="%" value={plan.hedgingRatio ?? 0.0} onChange={v => ch('hedgingRatio', v)} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Loss Limit Action</Label>
              <select
                value={plan.lossLimitAction || 'pause'}
                onChange={e => ch('lossLimitAction', e.target.value)}
                className="w-full bg-muted/50 border border-border/50 rounded-md h-[38px] px-3 text-xs text-foreground"
              >
                <option value="pause">Pause Yields</option>
                <option value="liquidate">Liquidate Deposit</option>
                <option value="notify">Notify User Only</option>
              </select>
            </div>
          </div>

          {/* AI P&L Assistant */}
          <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">AI P&L Logic Generator</h4>
                <p className="text-[10px] text-muted-foreground">Describe your risk parameters (e.g., "Safe model with 5% drawdown cap, auto-pause on 2 consecutive losses, and 15% hedging cover")</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id={`ai-pnl-prompt-${plan.id}`}
                placeholder="Describe P&L risk preferences..."
                className="bg-muted/50 border-border/50 h-8 text-xs flex-1 text-foreground"
              />
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const promptEl = document.getElementById(`ai-pnl-prompt-${plan.id}`) as HTMLInputElement
                  const prompt = promptEl?.value
                  if (!prompt) return
                  try {
                    const res = await fetch('/api/ai/generate-logic', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        prompt: `For Advanced P&L Configuration: ${prompt}. Return ONLY a JSON object containing keys: minLossPercent, maxLossPercent, maxConsecutiveLossDays, allowNegativeBalance, drawdownLimit, profitTarget, hedgingRatio, lossLimitAction, pnlLogicDescription`,
                        currentConfig: {
                          minLossPercent: plan.minLossPercent,
                          maxLossPercent: plan.maxLossPercent,
                          maxConsecutiveLossDays: plan.maxConsecutiveLossDays,
                          allowNegativeBalance: plan.allowNegativeBalance,
                          drawdownLimit: plan.drawdownLimit,
                          profitTarget: plan.profitTarget,
                          hedgingRatio: plan.hedgingRatio,
                          lossLimitAction: plan.lossLimitAction
                        }
                      })
                    })
                    if (res.ok) {
                      const data = await res.json()
                      const pnlData = data.pnlFields || data
                      if (pnlData.minLossPercent !== undefined) ch('minLossPercent', pnlData.minLossPercent)
                      if (pnlData.maxLossPercent !== undefined) ch('maxLossPercent', pnlData.maxLossPercent)
                      if (pnlData.maxConsecutiveLossDays !== undefined) ch('maxConsecutiveLossDays', pnlData.maxConsecutiveLossDays)
                      if (pnlData.allowNegativeBalance !== undefined) ch('allowNegativeBalance', pnlData.allowNegativeBalance)
                      if (pnlData.drawdownLimit !== undefined) ch('drawdownLimit', pnlData.drawdownLimit)
                      if (pnlData.profitTarget !== undefined) ch('profitTarget', pnlData.profitTarget)
                      if (pnlData.hedgingRatio !== undefined) ch('hedgingRatio', pnlData.hedgingRatio)
                      if (pnlData.lossLimitAction !== undefined) ch('lossLimitAction', pnlData.lossLimitAction)
                      if (pnlData.pnlLogicDescription !== undefined) ch('pnlLogicDescription', pnlData.pnlLogicDescription)
                      toast({ title: 'P&L Logics Generated!' })
                    }
                  } catch (e) {
                    toast({ title: 'AI P&L Generation failed', variant: 'destructive' })
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
              >
                Generate
              </Button>
            </div>
            {plan.pnlLogicDescription && (
              <div className="p-2 rounded bg-muted/50 border border-border/30 text-[10px] font-mono text-muted-foreground">
                <span className="font-semibold text-foreground block mb-0.5">Generated Rule Logic:</span>
                {plan.pnlLogicDescription}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 2.5: Time-Based Configuration (HYIPLab Feature) */}
        <SectionCard icon={<Clock className="h-4 w-4 text-emerald-400" />} title="Time-Based Configuration">
          <div className="space-y-4">
            {/* Return Type Selection */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Return Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { value: 'hourly', label: 'Hourly', desc: 'Every hour' },
                  { value: 'daily', label: 'Daily', desc: 'Every 24h' },
                  { value: 'weekly', label: 'Weekly', desc: 'Every 7 days' },
                  { value: 'monthly', label: 'Monthly', desc: 'Every 30 days' },
                  { value: 'after_end', label: 'After End', desc: 'One-time at plan end' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      ch('returnType', opt.value)
                      // Auto-set returnPeriodHours based on type
                      if (opt.value === 'hourly') ch('returnPeriodHours', 1)
                      else if (opt.value === 'daily') ch('returnPeriodHours', 24)
                      else if (opt.value === 'weekly') ch('returnPeriodHours', 168)
                      else if (opt.value === 'monthly') ch('returnPeriodHours', 720)
                    }}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all",
                      plan.returnType === opt.value
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField
                label="Return Period"
                suffix=" hours"
                value={plan.returnPeriodHours}
                onChange={v => ch('returnPeriodHours', Math.max(1, Math.round(v)))}
                hint="1=hourly, 24=daily"
              />
              <NumberField
                label="Duration"
                suffix=" days"
                value={plan.durationDays}
                onChange={v => ch('durationDays', Math.max(0, Math.round(v)))}
                hint="0 = unlimited"
              />
              <NumberField
                label="Total Return"
                suffix="%"
                value={plan.totalReturnPercent}
                onChange={v => ch('totalReturnPercent', Math.max(0, v))}
                hint="0 = use daily%"
              />
              <NumberField
                label="Repeat Count"
                value={plan.repeatCount}
                onChange={v => ch('repeatCount', Math.max(0, Math.round(v)))}
                hint="0 = unlimited"
              />
            </div>

            {/* Capital Return Selection */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Capital Return</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'included', label: 'Included in Profit', desc: 'Principal is part of returns' },
                  { value: 'end', label: 'Return at End', desc: 'Principal returned after duration' },
                  { value: 'none', label: 'No Return', desc: 'Principal not returned' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => ch('capitalReturn', opt.value)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all",
                      plan.capitalReturn === opt.value
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick info */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-xs space-y-1">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Current config:</span>{' '}
                {plan.returnType === 'after_end' 
                  ? `One-time ${plan.totalReturnPercent > 0 ? `${plan.totalReturnPercent}%` : `variable daily`} return after ${plan.durationDays || 'unlimited'} days`
                  : `Variable ${(plan as any).lowRiskMin || 0.5}%-${(plan as any).highRiskMax || 15}% every ${plan.returnPeriodHours === 1 ? 'hour' : `${plan.returnPeriodHours} hours`}`}
                {plan.durationDays > 0 && ` for ${plan.durationDays} days`}
                {plan.capitalReturn === 'end' && '. Principal returned at end.'}
                {plan.capitalReturn === 'none' && '. Principal not returned.'}
              </p>
              {plan.repeatCount > 0 && (
                <p className="text-cyan-400">Limited to {plan.repeatCount} payouts per deposit.</p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Section 4: Stacking Options */}
        <SectionCard icon={<Layers className="h-4 w-4 text-emerald-400" />} title="Stacking Options">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Stacking Enabled</p>
                <p className="text-xs text-muted-foreground">Allow multiple simultaneous deposits</p>
              </div>
              <Switch
                checked={plan.stackingEnabled}
                onCheckedChange={checked => ch('stackingEnabled', checked)}
              />
            </div>

            {plan.stackingEnabled && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <NumberField
                  label="Max Stacks"
                  value={plan.maxStacks}
                  onChange={v => ch('maxStacks', Math.min(10, Math.max(1, Math.round(v))))}
                  min={1}
                  max={10}
                  hint="1-10"
                />
                <NumberField
                  label="Stacking Bonus"
                  suffix="%"
                  value={plan.stackingBonusPercent}
                  onChange={v => ch('stackingBonusPercent', v)}
                  hint="Per additional stack"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Stacking Rule</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300"
                  onClick={() => onRegenerateField(plan.id, 'stackingRule')}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Auto-generate
                </Button>
              </div>
              <Textarea
                value={plan.stackingRule || ''}
                onChange={e => ch('stackingRule', e.target.value)}
                className="bg-muted/50 border-border/50 min-h-16 resize-y text-sm"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 5: Lock & Exit Rules */}
        <SectionCard icon={<Lock className="h-4 w-4 text-emerald-400" />} title="Lock & Exit Rules">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Lock Period Days"
                value={plan.lockPeriodDays}
                onChange={v => ch('lockPeriodDays', Math.max(0, Math.round(v)))}
                min={0}
                hint="0 = no lock"
              />
              <NumberField
                label="Early Exit Penalty"
                suffix="%"
                value={plan.earlyExitPenalty}
                onChange={v => ch('earlyExitPenalty', Math.max(0, v))}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Auto Compound</p>
                <p className="text-xs text-muted-foreground">Automatically reinvest earnings</p>
              </div>
              <Switch
                checked={plan.autoCompound}
                onCheckedChange={checked => ch('autoCompound', checked)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Withdrawal Rule</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300"
                  onClick={() => onRegenerateField(plan.id, 'withdrawalRule')}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Auto-generate
                </Button>
              </div>
              <Textarea
                value={plan.withdrawalRule || ''}
                onChange={e => ch('withdrawalRule', e.target.value)}
                className="bg-muted/50 border-border/50 min-h-16 resize-y text-sm"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 5.5: Advanced Options */}
        <SectionCard icon={<Zap className="h-4 w-4 text-emerald-400" />} title="Advanced Options">
          <div className="space-y-4">
            {/* Profit Schedule */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Profit Days</Label>
              <div className="flex flex-wrap gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
                  const profitDays = ((plan as any).profitDays || 'mon,tue,wed,thu,fri').split(',')
                  const isActive = profitDays.includes(day)
                  return (
                    <button key={day} type="button" onClick={() => {
                      const days = isActive ? profitDays.filter((d: string) => d !== day) : [...profitDays, day]
                      ch('profitDays' as any, days.join(','))
                    }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isActive ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-border/50 text-muted-foreground'}`}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField label="Grace Period (days)" value={(plan as any).gracePeriodDays || 0} onChange={v => ch('gracePeriodDays' as any, v)} />
              <NumberField label="Withdrawal Cooldown (hrs)" value={(plan as any).withdrawalCooldown || 24} onChange={v => ch('withdrawalCooldown' as any, v)} />
              <NumberField label="Spots Limit (0=∞)" value={(plan as any).spotsLimit || 0} onChange={v => ch('spotsLimit' as any, v)} />
              <NumberField label="Loss Day Chance %" suffix="%" value={(plan as any).lossDayChance || 0} onChange={v => ch('lossDayChance' as any, v)} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField label="Bonus Day Chance %" suffix="%" value={(plan as any).bonusDayChance || 5} onChange={v => ch('bonusDayChance' as any, v)} />
              <NumberField label="Custom Referral %" suffix="%" value={(plan as any).customReferralPct || 0} onChange={v => ch('customReferralPct' as any, v)} />
              <NumberField label="Team Requirement" value={(plan as any).teamRequirement || 0} onChange={v => ch('teamRequirement' as any, v)} />
              <NumberField label="Early Exit Penalty" suffix="%" value={plan.earlyExitPenalty || 0} onChange={v => ch('earlyExitPenalty', v)} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Plan Badge */}
              <div className="space-y-2">
                <Label className="text-xs">Plan Badge</Label>
                <div className="flex gap-1 flex-wrap">
                  {['', 'popular', 'new', 'limited', 'vip'].map(badge => (
                    <button key={badge} type="button" onClick={() => ch('planBadge' as any, badge)} className={`px-2 py-1 rounded text-[10px] border transition-all ${(plan as any).planBadge === badge ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground'}`}>
                      {badge || 'None'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min VIP Tier */}
              <div className="space-y-2">
                <Label className="text-xs">Min VIP Tier</Label>
                <div className="flex gap-1 flex-wrap">
                  {['Bronze', 'Silver', 'Gold', 'Platinum'].map(tier => (
                    <button key={tier} type="button" onClick={() => ch('minVipTier' as any, tier)} className={`px-2 py-1 rounded text-[10px] border transition-all ${(plan as any).minVipTier === tier ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground'}`}>
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volatility Mode */}
              <div className="space-y-2">
                <Label className="text-xs">Volatility Mode</Label>
                <div className="flex gap-1 flex-wrap">
                  {['stable', 'moderate', 'volatile'].map(mode => (
                    <button key={mode} type="button" onClick={() => ch('volatilityMode' as any, mode)} className={`px-2 py-1 rounded text-[10px] border transition-all capitalize ${(plan as any).volatilityMode === mode ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground'}`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div><p className="text-xs font-medium">Require KYC</p><p className="text-[9px] text-muted-foreground">KYC needed to invest</p></div>
                <Switch checked={(plan as any).requireKyc || false} onCheckedChange={v => ch('requireKyc' as any, v)} />
              </div>
            </div>

          </div>
        </SectionCard>

        {/* Section: Binary MLM Configuration */}
        <SectionCard icon={<Package className="h-4 w-4 text-emerald-400" />} title="Binary MLM Configuration">
          <div className="space-y-4">
            {/* Binary MLM Enable Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Enable Binary MLM</p>
                <p className="text-xs text-muted-foreground">Activate binary tree structure for referrals</p>
              </div>
              <Switch
                checked={plan.isBinaryMlmEnabled}
                onCheckedChange={checked => ch('isBinaryMlmEnabled', checked)}
              />
            </div>

            {plan.isBinaryMlmEnabled && (
              <>
                {/* Pairing Bonus Configuration */}
                <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10">
                  <div
                    className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                    onClick={() => setShowBinaryPairingConfig(!showShowBinaryPairingConfig)}
                  >
                    <div className="flex items-center gap-2">
                      {showShowBinaryPairingConfig ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs font-semibold text-foreground">Pairing Bonus Settings</span>
                      <Badge variant="outline" className="text-[10px] bg-background/50 border-border/50">
                        Configured
                      </Badge>
                    </div>
                  </div>

                  {showShowBinaryPairingConfig && (
                    <div className="p-3 border-t border-border/20 space-y-3 bg-background/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pairing Bonus Type</Label>
                          <div className="flex gap-1.5">
                            {[
                              { value: 'percent', label: 'Percentage of Matched Volume' },
                              { value: 'fixed', label: 'Fixed Amount per Pair' }
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => ch('binaryPairingBonusType', opt.value)}
                                className={cn(
                                  "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all",
                                  plan.binaryPairingBonusType === opt.value
                                    ? "bg-primary/15 border-primary/30 text-primary"
                                    : "border-border/50 text-muted-foreground"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pairing Bonus Value</Label>
                          {plan.binaryPairingBonusType === 'percent' ? (
                            <NumberField
                              label="Pairing Bonus %"
                              suffix="%"
                              value={plan.binaryPairingBonusPercent || 10}
                              onChange={v => ch('binaryPairingBonusPercent', v)}
                              hint="Percentage paid on matched volume"
                            />
                          ) : (
                            <NumberField
                              label="Pairing Bonus $"
                              suffix=""
                              value={plan.binaryPairingBonusFixed || 0}
                              onChange={v => ch('binaryPairingBonusFixed', v)}
                              hint="Fixed amount paid per matched pair"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Matching Type</Label>
                          <div className="flex gap-1.5">
                            {[
                              { value: 'weaker_leg', label: 'Weaker Leg (Lesser of Two Legs)' },
                              { value: 'both_legs', label: 'Both Legs (Total Matched Volume)' },
                              { value: 'stronger_leg', label: 'Stronger Leg (Greater of Two Legs)' }
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => ch('binaryMatchingType', opt.value)}
                                className={cn(
                                  "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all",
                                  plan.binaryMatchingType === opt.value
                                    ? "bg-primary/15 border-primary/30 text-primary"
                                    : "border-border/50 text-muted-foreground"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Daily Pairing Cap</Label>
                          <NumberField
                            label="Max Pairs/Day"
                            value={plan.binaryDailyPairingCap || 0}
                            onChange={v => ch('binaryDailyPairingCap', Math.max(0, Math.round(v)))}
                            hint="0 = unlimited"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Weekly Pairing Cap</Label>
                        <NumberField
                          label="Max Pairs/Week"
                          value={plan.binaryWeeklyPairingCap || 0}
                          onChange={v => ch('binaryWeeklyPairingCap', Math.max(0, Math.round(v)))}
                          hint="0 = unlimited"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Carry Forward Unmatched Volume</Label>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
                          <div>
                            <p className="text-xs font-medium">Enable Carry Forward</p>
                            <p className="text-[9px] text-muted-foreground">Unmatched volume carries to next period</p>
                          </div>
                          <Switch
                            checked={plan.binaryCarryForward !== false}
                            onCheckedChange={v => ch('binaryCarryForward', v)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Spillover and Depth Configuration */}
                <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10 mt-4">
                  <div
                    className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                    onClick={() => setShowBinarySpilloverConfig(!showShowBinarySpilloverConfig)}
                  >
                    <div className="flex items-center gap-2">
                      {showShowBinarySpilloverConfig ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs font-semibold text-foreground">Tree Structure Settings</span>
                      <Badge variant="outline" className="text-[10px] bg-background/50 border-border/50">
                        Configured
                      </Badge>
                    </div>
                  </div>

                  {showShowBinarySpilloverConfig && (
                    <div className="p-3 border-t border-border/20 space-y-3 bg-background/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Spillover Placement</Label>
                          <div className="flex gap-1.5">
                            {[
                              { value: 'left', label: 'Always Left Leg' },
                              { value: 'right', label: 'Always Right Leg' },
                              { value: 'balanced', label: 'Fill Lesser Leg First' },
                              { value: 'cycle_fill', label: 'Complete Cycles First' }
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => ch('binarySpilloverPlacement', opt.value)}
                                className={cn(
                                  "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all",
                                  plan.binarySpilloverPlacement === opt.value
                                    ? "bg-primary/15 border-primary/30 text-primary"
                                    : "border-border/50 text-muted-foreground"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Depth Limit</Label>
                          <NumberField
                            label="Max Depth"
                            value={plan.binaryDepthLimit || 0}
                            onChange={v => ch('binaryDepthLimit', Math.max(0, Math.round(v)))}
                            hint="0 = unlimited depth"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flush Bonus Configuration */}
                <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10 mt-4">
                  <div
                    className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                    onClick={() => setShowBinaryFlushConfig(!showShowBinaryFlushConfig)}
                  >
                    <div className="flex items-center gap-2">
                      {showShowBinaryFlushConfig ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs font-semibold text-foreground">Flush Bonus Settings</span>
                      <Badge variant="outline" className="text-[10px] bg-background/50 border-border/50">
                        {(plan.binaryFlushBonusEnabled || false) ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  {showShowBinaryFlushConfig && (
                    <div className="p-3 border-t border-border/20 space-y-3 bg-background/30">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div>
                          <p className="text-xs font-medium">Enable Flush Bonus</p>
                          <p className="text-[9px] text-muted-foreground">Bonus for significant leg imbalance</p>
                        </div>
                        <Switch
                          checked={plan.binaryFlushBonusEnabled}
                          onCheckedChange={checked => ch('binaryFlushBonusEnabled', checked)}
                        />
                      </div>

                      {plan.binaryFlushBonusEnabled && (
                        <>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Flush Bonus %</Label>
                                <NumberField
                                  label="Flush Bonus %"
                                  suffix="%"
                                  value={plan.binaryFlushBonusPercent || 5}
                                  onChange={v => ch('binaryFlushBonusPercent', v)}
                                  hint="Percentage paid on excess volume"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Flush Threshold %</Label>
                                <NumberField
                                  label="Flush Threshold %"
                                  suffix="%"
                                  value={plan.binaryFlushBonusThreshold || 200}
                                  onChange={v => ch('binaryFlushBonusThreshold', v)}
                                  hint="% imbalance to trigger (e.g. 200 = one leg is 2x other)"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Cycle Bonus Configuration */}
                <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10 mt-4">
                  <div
                    className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                    onClick={() => setShowBinaryCycleConfig(!showShowBinaryCycleConfig)}
                  >
                    <div className="flex items-center gap-2">
                      {showShowBinaryCycleConfig ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs font-semibold text-foreground">Cycle Bonus Settings</span>
                      <Badge variant="outline" className="text-[10px] bg-background/50 border-border/50">
                        {(plan.binaryCycleEnabled || false) ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  {showShowBinaryCycleConfig && (
                    <div className="p-3 border-t border-border/20 space-y-3 bg-background/30">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div>
                          <p className="text-xs font-medium">Enable Cycle Bonus</p>
                          <p className="text-[9px] text-muted-foreground">Bonus for completing binary cycles</p>
                        </div>
                        <Switch
                          checked={plan.binaryCycleEnabled}
                          onCheckedChange={checked => ch('binaryCycleEnabled', checked)}
                        />
                      </div>

                      {plan.binaryCycleEnabled && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cycle Ratio</Label>
                            <div className="flex gap-1.5">
                              {[
                                { value: '1:1', label: '1:1 (Equal Volume)' },
                                { value: '2:1', label: '2:1 (2:1 Ratio)' },
                                { value: '3:2', label: '3:2 (3:2 Ratio)' }
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => ch('binaryCycleRatio', opt.value)}
                                  className={cn(
                                    "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all",
                                    plan.binaryCycleRatio === opt.value
                                      ? "bg-primary/15 border-primary/30 text-primary"
                                      : "border-border/50 text-muted-foreground"
                                  )}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cycle Bonus %</Label>
                            <NumberField
                              label="Cycle Bonus %"
                              suffix="%"
                              value={plan.binaryCycleBonusPercent || 5}
                              onChange={v => ch('binaryCycleBonusPercent', v)}
                              hint="Percentage paid when cycle completes"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SectionCard>

        {/* Dedicated Re-Investment Configuration Section */}
        <SectionCard icon={<RefreshCw className="h-4 w-4 text-emerald-400" />} title="Re-Investment Configuration" description="Configure settings for automatic or manual profit reinvestments and compounds">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20 h-[58px] mt-1.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Auto-Reinvest Profits</p>
                  <p className="text-[9px] text-muted-foreground">Automatically reinvest profits back into the active plan</p>
                </div>
                <Switch checked={(plan as any).autoReinvest || false} onCheckedChange={v => ch('autoReinvest' as any, v)} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20 h-[58px] mt-1.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Auto-Compound Yields</p>
                  <p className="text-[9px] text-muted-foreground">Compounding yields directly to active principal</p>
                </div>
                <Switch checked={plan.autoCompound || false} onCheckedChange={v => ch('autoCompound', v)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField label="Re-Investment Bonus %" suffix="%" value={(plan as any).reinvestBonus || 2} onChange={v => ch('reinvestBonus' as any, v)} hint="Bonus added on manual/auto reinvest" />
              <NumberField label="Min Re-Investment Amount ($)" suffix="$" value={(plan as any).minReinvestAmount || 0} onChange={v => ch('minReinvestAmount' as any, v)} hint="Minimum amount to reinvest (0 = default to plan min)" />
              <NumberField label="Re-Investment Lock Period" suffix="days" value={(plan as any).reinvestLockPeriod || 0} onChange={v => ch('reinvestLockPeriod' as any, v)} hint="Separate lock for reinvested funds (0 = no lock)" />
            </div>
          </div>
        </SectionCard>

        {/* Section: Level-by-Level Sponsor & Deposit Overrides */}
        <SectionCard icon={<Zap className="h-4 w-4 text-emerald-400" />} title="Level-by-Level Sponsor & Deposit Overrides">
          <div className="space-y-4">
            {/* AI Referral & Bonus Rules Assistant */}
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">AI Referral & Bonus Rules Assistant</h4>
                  <p className="text-[10px] text-muted-foreground">Describe referral changes (e.g. "Level 1 deposit bonus gets 5% but requires $1000 sponsor deposit. Level 2 trade profit split gets 15%")</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={aiReferralPrompt}
                  onChange={e => setAiReferralPrompt(e.target.value)}
                  placeholder="Ask AI to configure commission overrides, qualifications, and target wallets..."
                  className="bg-muted/50 border-border/50 resize-none h-12 text-xs flex-1"
                />
                <Button
                  type="button"
                  onClick={handleGenerateReferrals}
                  disabled={generatingReferrals || !aiReferralPrompt.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0 self-end h-9"
                >
                  {generatingReferrals ? 'Analyzing...' : 'Apply Rules'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {renderOverrideSection("registration", "Registration Fee Overrides", "subscriptionReferralPercent")}
              {renderOverrideSection("profit", "Trade Profit Share Overrides", "tradeProfitSharePercent")}
              {renderOverrideSection("deposit", "Deposit Bonus Overrides")}
            </div>
          </div>
        </SectionCard>

        {/* Section: Plan Conditional Logics */}
        <SectionCard icon={<Settings className="h-4 w-4 text-emerald-400" />} title="Plan Conditional Logics">
          <div className="space-y-4">
            {/* AI Conditional Logics Assistant */}
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">AI Conditional Logics Assistant</h4>
                  <p className="text-[10px] text-muted-foreground">Describe your condition rules (e.g. "If consecutive loss days reaches 3, pause referrals and adjust splits to investor 80, shared pool 15, platform 5")</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={aiLogicPrompt}
                  onChange={e => setAiLogicPrompt(e.target.value)}
                  placeholder="Ask AI to write yield adjustment rules, split adjustments, and lock-out logics..."
                  className="bg-muted/50 border-border/50 resize-none h-12 text-xs flex-1"
                />
                <Button
                  type="button"
                  onClick={handleGenerateLogics}
                  disabled={generatingLogics || !aiLogicPrompt.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0 self-end h-9"
                >
                  {generatingLogics ? 'Analyzing...' : 'Generate Logics'}
                </Button>
              </div>
            </div>

            {/* List/Table of Conditional Rules */}
            <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10">
              <div 
                className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                onClick={() => setShowConditionalLogics(!showConditionalLogics)}
              >
                <div className="flex items-center gap-2">
                  {showConditionalLogics ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-xs font-semibold text-foreground">Rules Matrix</span>
                  <Badge variant="outline" className="text-[10px] bg-background/50 border-border/50">
                    {(plan.conditionalLogics || []).length} defined
                  </Badge>
                </div>
              </div>

              {showConditionalLogics && (
                <div className="p-3 border-t border-border/20 space-y-3 bg-background/30">
                  {(!plan.conditionalLogics || plan.conditionalLogics.length === 0) ? (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No conditional logic rules defined. Plan yields and multipliers will behave statically.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-semibold">
                            <th className="p-2 w-[70px]">Priority</th>
                            <th className="p-2 w-[130px]">Condition Type</th>
                            <th className="p-2 w-[70px]">Operator</th>
                            <th className="p-2 w-[100px]">Threshold</th>
                            <th className="p-2 w-[130px]">Action Type</th>
                            <th className="p-2 w-[150px]">Action Value</th>
                            <th className="p-2 text-center w-[50px]">Status</th>
                            <th className="p-2 w-[55px] text-right">Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(plan.conditionalLogics || []).map((logic, index) => (
                            <tr key={index} className="border-b border-border/20 hover:bg-muted/10">
                              <td className="p-2">
                                <Input
                                  type="number"
                                  value={logic.priority}
                                  onChange={e => updateLogic(index, 'priority', parseInt(e.target.value) || 1)}
                                  className="bg-muted/50 border border-border/50 h-7 text-[11px] w-full"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={logic.conditionType}
                                  onChange={e => updateLogic(index, 'conditionType', e.target.value)}
                                  className="w-full bg-muted/50 border border-border/50 rounded h-7 px-1.5 text-[11px] text-foreground"
                                >
                                  <option value="daily_yield">Daily Yield</option>
                                  <option value="consecutive_loss_days">Consecutive Loss Days</option>
                                  <option value="active_deposits">Active Deposits Balance</option>
                                  <option value="day_of_week">Day of Week</option>
                                  <option value="spots_filled">Spots Filled</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <select
                                  value={logic.operator}
                                  onChange={e => updateLogic(index, 'operator', e.target.value)}
                                  className="w-full bg-muted/50 border border-border/50 rounded h-7 px-1 text-[11px] text-foreground"
                                >
                                  <option value=">">&gt;</option>
                                  <option value="<">&lt;</option>
                                  <option value="==">==</option>
                                  <option value="contains">contains</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <Input
                                  value={logic.value}
                                  onChange={e => updateLogic(index, 'value', e.target.value)}
                                  className="bg-muted/50 border border-border/50 h-7 text-[11px] w-full"
                                  placeholder="e.g. 1.0, mon"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={logic.actionType}
                                  onChange={e => updateLogic(index, 'actionType', e.target.value)}
                                  className="w-full bg-muted/50 border border-border/50 rounded h-7 px-1.5 text-[11px] text-foreground"
                                >
                                  <option value="adjust_yield">Adjust Yield</option>
                                  <option value="adjust_multiplier">Adjust Daily Cap Multiplier</option>
                                  <option value="pause_referrals">Pause Referrals</option>
                                  <option value="adjust_splits">Adjust Splits</option>
                                  <option value="disable_plan">Disable Plan</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <Input
                                  value={logic.actionValue}
                                  onChange={e => updateLogic(index, 'actionValue', e.target.value)}
                                  className="bg-muted/50 border border-border/50 h-7 text-[11px] w-full"
                                  placeholder="e.g. +0.25, holder:80,shared:15..."
                                />
                              </td>
                              <td className="p-2 text-center">
                                <Switch
                                  checked={logic.enabled}
                                  onCheckedChange={checked => updateLogic(index, 'enabled', checked)}
                                  className="scale-75"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  onClick={() => deleteLogicRow(index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5"
                      onClick={addLogicRow}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Logic Rule
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Section 5: Distribution Percentages */}
        <SectionCard icon={<BarChart3 className="h-4 w-4 text-emerald-400" />} title="Distribution Percentages">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField
                label="Account Holder"
                suffix="%"
                value={plan.accountHolderPercent}
                onChange={v => ch('accountHolderPercent', v)}
                color="text-emerald-400"
              />
              <NumberField
                label="Shared Pool"
                suffix="%"
                value={plan.tradeProfitSharePercent}
                onChange={v => ch('tradeProfitSharePercent', v)}
                color="text-cyan-400"
              />
              <NumberField
                label="Rewards"
                suffix="%"
                value={plan.rewardsOffersPercent}
                onChange={v => ch('rewardsOffersPercent', v)}
                color="text-amber-400"
              />
              <NumberField
                label="Platform Fee"
                suffix="%"
                value={plan.platformFeePercent}
                onChange={v => ch('platformFeePercent', v)}
                color="text-rose-400"
              />
              <NumberField
                label="Charity Donation"
                suffix="%"
                value={plan.charityDonationPercent || 0}
                onChange={v => ch('charityDonationPercent', v)}
                color="text-purple-400"
              />
              <NumberField
                label="Insurance Reserve"
                suffix="%"
                value={plan.insuranceReservePercent || 0}
                onChange={v => ch('insuranceReservePercent', v)}
                color="text-blue-400"
              />
              <NumberField
                label="Developer Fund"
                suffix="%"
                value={plan.developerFundPercent || 0}
                onChange={v => ch('developerFundPercent', v)}
                color="text-indigo-400"
              />
              <NumberField
                label="Liquidity Pool"
                suffix="%"
                value={plan.liquidityPoolPercent || 0}
                onChange={v => ch('liquidityPoolPercent', v)}
                color="text-teal-400"
              />
            </div>

            {/* Visual Distribution Bar */}
            <DistributionBar
              segments={[
                { value: plan.accountHolderPercent, color: DIST_COLORS.accountHolder, label: 'Account Holder' },
                { value: plan.tradeProfitSharePercent, color: DIST_COLORS.tradeProfit, label: 'Shared Pool' },
                { value: plan.rewardsOffersPercent, color: DIST_COLORS.rewardsOffers, label: 'Rewards' },
                { value: plan.platformFeePercent, color: DIST_COLORS.platformFee, label: 'Platform' },
                { value: plan.charityDonationPercent || 0, color: DIST_COLORS.charity, label: 'Charity' },
                { value: plan.insuranceReservePercent || 0, color: DIST_COLORS.insurance, label: 'Insurance' },
                { value: plan.developerFundPercent || 0, color: DIST_COLORS.developer, label: 'Developer' },
                { value: plan.liquidityPoolPercent || 0, color: DIST_COLORS.liquidity, label: 'Liquidity' },
              ]}
              total={distTotal}
              valid={distValid}
            />

            {!distValid && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <p className="text-xs text-rose-400">Total is {distTotal}% — must equal 100%</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 6: Subscription Fee Distribution */}
        <SectionCard icon={<Percent className="h-4 w-4 text-emerald-400" />} title="Subscription Fee Distribution">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <NumberField
                label="Referral/Profit Share"
                suffix="%"
                value={plan.subscriptionReferralPercent}
                onChange={v => ch('subscriptionReferralPercent', v)}
                color="text-violet-400"
              />
              <NumberField
                label="Rewards & Offers"
                suffix="%"
                value={plan.subscriptionRewardsPercent}
                onChange={v => ch('subscriptionRewardsPercent', v)}
                color="text-amber-400"
              />
              <NumberField
                label="Platform Fee"
                suffix="%"
                value={plan.subscriptionPlatformPercent}
                onChange={v => ch('subscriptionPlatformPercent', v)}
                color="text-rose-400"
              />
            </div>

            {/* Visual Bar */}
            <DistributionBar
              segments={[
                { value: plan.subscriptionReferralPercent, color: SUB_DIST_COLORS.referral, label: 'Referral' },
                { value: plan.subscriptionRewardsPercent, color: SUB_DIST_COLORS.rewards, label: 'Rewards' },
                { value: plan.subscriptionPlatformPercent, color: SUB_DIST_COLORS.platform, label: 'Platform' },
              ]}
              total={subDistTotal}
              valid={subDistValid}
            />

            {!subDistValid && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <p className="text-xs text-rose-400">Total is {subDistTotal}% — must equal 100%</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 7: Plan Logic Preview */}
        <SectionCard icon={<Eye className="h-4 w-4 text-emerald-400" />} title="Plan Logic Preview" description="Auto-generated from your field values">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Earning Mechanism</p>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-sm text-foreground/90">{plan.earningMechanism || generateEarningMechanism(plan)}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Withdrawal Rule</p>
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-sm text-foreground/90">{plan.withdrawalRule || generateWithdrawalRule(plan)}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Stacking Rule</p>
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <p className="text-sm text-foreground/90">{plan.stackingRule || generateStackingRule(plan)}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </CardContent>
    </Card>
  )
}

// ─── Plan Summary (view mode) ────────────────────────────────────────────────
function PlanSummary({
  plan,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpand,
  isDeleteTarget,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  plan: EditablePlan
  onEdit: () => void
  onDelete: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  isDeleteTarget: boolean
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}) {
  return (
    <Card className={cn(
      "bg-card/50 border-border/50 hover:border-emerald-500/30 transition-all duration-200",
      isExpanded && "border-emerald-500/20"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-lg text-foreground">{plan.name || 'Untitled Plan'}</CardTitle>
            <Badge
              variant={plan.isActive ? 'default' : 'secondary'}
              className={plan.isActive ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30' : 'bg-muted text-muted-foreground'}
            >
              {plan.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {plan.stackingEnabled && (
              <Badge className="bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border-violet-500/30">
                <Layers className="h-3 w-3 mr-1" /> Stacking
              </Badge>
            )}
            {plan.autoCompound && (
              <Badge className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/30">
                Auto-Compound
              </Badge>
            )}
            {plan.lockPeriodDays > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30">
                <Lock className="h-3 w-3 mr-1" /> {plan.lockPeriodDays}d Lock
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleExpand}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="text-muted-foreground hover:text-emerald-400"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog open={isDeleteTarget} onOpenChange={(open) => { if (!open) onDeleteCancel() }}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="text-muted-foreground hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{plan.name}&rdquo;? This action cannot be undone. Any deposits linked to this plan may be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={onDeleteCancel}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Compact Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <StatBadge label="Entry Fee" value={`$${plan.entryFee.toLocaleString()}`} icon={<DollarSign className="h-3 w-3" />} />
          <StatBadge label="Daily Rate" value={`${(plan as any).lowRiskMin || 0.5}-${(plan as any).highRiskMax || 15}%`} icon={<Percent className="h-3 w-3" />} />
          <StatBadge label="Deposit Range" value={`$${plan.minDeposit.toLocaleString()} - $${plan.maxDeposit.toLocaleString()}`} />
          <StatBadge label="Daily Limit" value={`${getPlanLimitMultiplier(plan.name)} of Investment`} />
          <StatBadge label="Lock Period" value={plan.lockPeriodDays > 0 ? `${plan.lockPeriodDays} days` : 'None'} />
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <Separator />

            {plan.description && (
              <p className="text-sm text-muted-foreground italic">&ldquo;{plan.description}&rdquo;</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stacking Info */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-violet-400" /> Stacking
                </p>
                <p className="text-sm text-foreground">{plan.stackingRule || 'Single deposit only per plan.'}</p>
              </div>

              {/* Lock Info */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-400" /> Withdrawal
                </p>
                <p className="text-sm text-foreground">{plan.withdrawalRule || 'No lock-in period.'}</p>
              </div>
            </div>

            {/* Distribution Bar (compact) */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-emerald-400" /> Distribution
              </p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                <div className={cn(DIST_COLORS.accountHolder, " rounded-l-full")} style={{ width: `${plan.accountHolderPercent}%` }} />
                <div className={cn(DIST_COLORS.tradeProfit)} style={{ width: `${plan.tradeProfitSharePercent}%` }} />
                <div className={cn(DIST_COLORS.rewardsOffers)} style={{ width: `${plan.rewardsOffersPercent}%` }} />
                <div className={cn(DIST_COLORS.platformFee)} style={{ width: `${plan.platformFeePercent}%` }} />
                <div className={cn(DIST_COLORS.charity)} style={{ width: `${(plan as any).charityDonationPercent || 0}%` }} />
                <div className={cn(DIST_COLORS.insurance)} style={{ width: `${(plan as any).insuranceReservePercent || 0}%` }} />
                <div className={cn(DIST_COLORS.developer)} style={{ width: `${(plan as any).developerFundPercent || 0}%` }} />
                <div className={cn(DIST_COLORS.liquidity, " rounded-r-full")} style={{ width: `${(plan as any).liquidityPoolPercent || 0}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                <span className="text-xs text-emerald-400">Holder {plan.accountHolderPercent}%</span>
                <span className="text-xs text-cyan-400">Shared Pool {plan.tradeProfitSharePercent}%</span>
                <span className="text-xs text-amber-400">Rewards {plan.rewardsOffersPercent}%</span>
                <span className="text-xs text-rose-400">Platform {plan.platformFeePercent}%</span>
                <span className="text-xs text-purple-400 font-medium">Charity {(plan as any).charityDonationPercent || 0}%</span>
                <span className="text-xs text-blue-400 font-medium">Insurance {(plan as any).insuranceReservePercent || 0}%</span>
                <span className="text-xs text-indigo-400 font-medium">Dev {(plan as any).developerFundPercent || 0}%</span>
                <span className="text-xs text-teal-400 font-medium">Liquidity {(plan as any).liquidityPoolPercent || 0}%</span>
              </div>
            </div>

            {/* Earning Mechanism */}
            {plan.earningMechanism && (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-emerald-400" /> Earning Mechanism
                </p>
                <p className="text-sm text-foreground/90">{plan.earningMechanism}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Helper: Section Card ────────────────────────────────────────────────────
function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-4 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Helper: Number Field ────────────────────────────────────────────────────
function NumberField({
  label,
  prefix,
  suffix,
  value,
  onChange,
  min,
  max,
  hint,
  color,
}: {
  label: string
  prefix?: string
  suffix?: string
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  hint?: string
  color?: string
}) {
  const [localValue, setLocalValue] = useState(String(value))

  // Sync from parent when value changes externally
  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)

    // Parse and propagate if valid
    if (raw === '' || raw === '-') return
    let v = parseFloat(raw)
    if (isNaN(v)) return
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    onChange(v)
  }

  const handleBlur = () => {
    // On blur, normalize the display value
    let v = parseFloat(localValue)
    if (isNaN(v)) v = 0
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    setLocalValue(String(v))
    onChange(v)
  }

  return (
    <div className="space-y-1.5">
      <Label className={cn("text-xs uppercase tracking-wider", color || "text-muted-foreground")}>
        {label}
        {hint && <span className="ml-1 text-muted-foreground/60 normal-case">({hint})</span>}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">{prefix}</span>
        )}
        <Input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            'bg-muted/50 border-border/50 h-9',
            prefix && 'pl-7',
            suffix && 'pr-7'
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">{suffix}</span>
        )}
      </div>
    </div>
  )
}

// ─── Helper: Distribution Bar ────────────────────────────────────────────────
function DistributionBar({
  segments,
  total,
  valid,
}: {
  segments: { value: number; color: string; label: string }[]
  total: number
  valid: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 bg-muted/30">
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            className={cn(
              seg.color,
              " transition-all duration-300",
              i === 0 && "rounded-l-full",
              i === segments.length - 1 && "rounded-r-full"
            )}
            style={{ width: `${Math.max(seg.value, 0)}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {segments.map(seg => (
            <span key={seg.label} className="text-xs text-muted-foreground">
              <span className={cn("inline-block h-2 w-2 rounded-full mr-1", seg.color)} />
              {seg.label} <span className="font-medium text-foreground">{seg.value}%</span>
            </span>
          ))}
        </div>
        <span className={cn(
          "text-xs font-medium",
          valid ? "text-emerald-400" : "text-rose-400"
        )}>
          Total: {total}%
        </span>
      </div>
    </div>
  )
}

// ─── Helper: Stat Badge (for summary view) ───────────────────────────────────
function StatBadge({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
