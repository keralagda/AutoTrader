'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  RefreshCw, Info, AlertTriangle
} from 'lucide-react'
import type { PlanType } from '@/lib/types'

// ─── Extended plan with UI state ─────────────────────────────────────────────
interface EditablePlan extends PlanType {
  isEditing?: boolean
  isNew?: boolean
  isExpanded?: boolean
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

  const handleChange = (id: string, field: keyof PlanType, value: string | number | boolean) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, [field]: value }

      // Auto-generate plain English descriptions when related fields change
      if (['dailyEarningPercent', 'maxEarningLimit', 'autoCompound'].includes(field)) {
        updated.earningMechanism = generateEarningMechanism(updated)
      }
      if (['lockPeriodDays', 'earlyExitPenalty', 'autoCompound'].includes(field)) {
        updated.withdrawalRule = generateWithdrawalRule(updated)
      }
      if (['stackingEnabled', 'maxStacks', 'stackingBonusPercent'].includes(field)) {
        updated.stackingRule = generateStackingRule(updated)
      }

      return updated
    }))
  }

  const handleSave = async (plan: EditablePlan) => {
    // Validate distribution totals
    const distTotal = plan.accountHolderPercent + plan.tradeProfitSharePercent + plan.rewardsOffersPercent + plan.platformFeePercent
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
    }
    setPlans(prev => [...prev, newPlan])
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
        {plans.map(plan => (
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
  onChange: (id: string, field: keyof PlanType, value: string | number | boolean) => void
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
  onChange: (id: string, field: keyof PlanType, value: string | number | boolean) => void
  onRegenerateField: (id: string, field: 'earningMechanism' | 'withdrawalRule' | 'stackingRule') => void
}) {
  const distTotal = useMemo(() =>
    plan.accountHolderPercent + plan.tradeProfitSharePercent + plan.rewardsOffersPercent + plan.platformFeePercent,
    [plan.accountHolderPercent, plan.tradeProfitSharePercent, plan.rewardsOffersPercent, plan.platformFeePercent]
  )

  const subDistTotal = useMemo(() =>
    plan.subscriptionReferralPercent + plan.subscriptionRewardsPercent + plan.subscriptionPlatformPercent,
    [plan.subscriptionReferralPercent, plan.subscriptionRewardsPercent, plan.subscriptionPlatformPercent]
  )

  const distValid = Math.abs(distTotal - 100) < 0.01
  const subDistValid = Math.abs(subDistTotal - 100) < 0.01

  const ch = (field: keyof PlanType, value: string | number | boolean) => onChange(plan.id, field, value)

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
            <NumberField label="Daily Earning" suffix="%" value={plan.dailyEarningPercent} onChange={v => ch('dailyEarningPercent', v)} />
            <NumberField label="Max Earning Limit" prefix="$" value={plan.maxEarningLimit} onChange={v => ch('maxEarningLimit', v)} />
          </div>
        </SectionCard>

        {/* Section 3: Stacking Options */}
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

        {/* Section 4: Lock & Exit Rules */}
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
                label="Trade Profit Share"
                suffix="%"
                value={plan.tradeProfitSharePercent}
                onChange={v => ch('tradeProfitSharePercent', v)}
                color="text-cyan-400"
              />
              <NumberField
                label="Rewards & Offers"
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
            </div>

            {/* Visual Distribution Bar */}
            <DistributionBar
              segments={[
                { value: plan.accountHolderPercent, color: DIST_COLORS.accountHolder, label: 'Account Holder' },
                { value: plan.tradeProfitSharePercent, color: DIST_COLORS.tradeProfit, label: 'Trade Profit' },
                { value: plan.rewardsOffersPercent, color: DIST_COLORS.rewardsOffers, label: 'Rewards' },
                { value: plan.platformFeePercent, color: DIST_COLORS.platformFee, label: 'Platform' },
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
          <StatBadge label="Daily Rate" value={`${plan.dailyEarningPercent}%`} icon={<Percent className="h-3 w-3" />} />
          <StatBadge label="Deposit Range" value={`$${plan.minDeposit.toLocaleString()} - $${plan.maxDeposit.toLocaleString()}`} />
          <StatBadge label="Max Earning" value={`$${plan.maxEarningLimit.toLocaleString()}`} />
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
                <div className={cn(DIST_COLORS.platformFee, " rounded-r-full")} style={{ width: `${plan.platformFeePercent}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                <span className="text-xs text-emerald-400">Holder {plan.accountHolderPercent}%</span>
                <span className="text-xs text-cyan-400">Trade {plan.tradeProfitSharePercent}%</span>
                <span className="text-xs text-amber-400">Rewards {plan.rewardsOffersPercent}%</span>
                <span className="text-xs text-rose-400">Platform {plan.platformFeePercent}%</span>
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
          value={value}
          onChange={e => {
            let v = parseFloat(e.target.value) || 0
            if (min !== undefined) v = Math.max(min, v)
            if (max !== undefined) v = Math.min(max, v)
            onChange(v)
          }}
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
