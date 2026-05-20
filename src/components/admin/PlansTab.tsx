'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Plus, Save, Edit2, X, Check } from 'lucide-react'
import type { PlanType } from '@/lib/types'

interface EditablePlan extends PlanType {
  isEditing?: boolean
  isNew?: boolean
}

export function PlansTab() {
  const [plans, setPlans] = useState<EditablePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans')
      if (!res.ok) throw new Error('Failed to fetch plans')
      const data = await res.json()
      setPlans(data.map((p: PlanType) => ({ ...p, isEditing: false })))
    } catch {
      toast({ title: 'Error', description: 'Failed to load plans', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const handleEdit = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, isEditing: true } : p))
  }

  const handleCancel = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, isEditing: false } : p))
    fetchPlans()
  }

  const handleChange = (id: string, field: keyof PlanType, value: string | number | boolean) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const handleSave = async (plan: EditablePlan) => {
    setSaving(plan.id)
    try {
      if (plan.isNew) {
        const { id, isEditing, isNew, createdAt, updatedAt, ...data } = plan as any
        const res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to create plan')
        toast({ title: 'Plan Created', description: `${plan.name} has been created` })
      } else {
        const { id, isEditing, isNew, createdAt, updatedAt, ...data } = plan as any
        const res = await fetch('/api/admin/plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: plan.id, ...data }),
        })
        if (!res.ok) throw new Error('Failed to update plan')
        toast({ title: 'Plan Updated', description: `${plan.name} has been updated` })
      }
      fetchPlans()
    } catch {
      toast({ title: 'Error', description: 'Failed to save plan', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const handleAddNew = () => {
    const newPlan: EditablePlan = {
      id: `new-${Date.now()}`,
      name: '',
      entryFee: 0,
      minDeposit: 0,
      maxDeposit: 0,
      dailyEarningPercent: 0,
      maxEarningLimit: 0,
      isActive: true,
      isEditing: true,
      isNew: true,
    }
    setPlans(prev => [...prev, newPlan])
  }

  const handleToggleActive = async (plan: EditablePlan) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle plan')
      toast({ title: 'Plan Updated', description: `${plan.name} is now ${plan.isActive ? 'inactive' : 'active'}` })
      fetchPlans()
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle plan status', variant: 'destructive' })
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Investment Plans</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your investment plan offerings</p>
        </div>
        <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Add New Plan
        </Button>
      </div>

      <div className="space-y-4">
        {plans.map(plan => (
          <Card key={plan.id} className="bg-card/50 border-border/50 hover:border-emerald-500/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {plan.isEditing ? (
                    <Input
                      value={plan.name}
                      onChange={e => handleChange(plan.id, 'name', e.target.value)}
                      placeholder="Plan Name"
                      className="w-48 bg-muted/50 border-border/50"
                    />
                  ) : (
                    <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                  )}
                  <Badge
                    variant={plan.isActive ? 'default' : 'secondary'}
                    className={plan.isActive ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-muted text-muted-foreground'}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {plan.isEditing ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleCancel(plan.id)} className="text-muted-foreground">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(plan)}
                        disabled={saving === plan.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saving === plan.id ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <>
                      {!plan.isNew && (
                        <Switch
                          checked={plan.isActive}
                          onCheckedChange={() => handleToggleActive(plan)}
                        />
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(plan.id)} className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <PlanField
                  label="Entry Fee"
                  value={plan.entryFee}
                  isEditing={plan.isEditing}
                  prefix="$"
                  onChange={v => handleChange(plan.id, 'entryFee', v)}
                />
                <PlanField
                  label="Min Deposit"
                  value={plan.minDeposit}
                  isEditing={plan.isEditing}
                  prefix="$"
                  onChange={v => handleChange(plan.id, 'minDeposit', v)}
                />
                <PlanField
                  label="Max Deposit"
                  value={plan.maxDeposit}
                  isEditing={plan.isEditing}
                  prefix="$"
                  onChange={v => handleChange(plan.id, 'maxDeposit', v)}
                />
                <PlanField
                  label="Daily %"
                  value={plan.dailyEarningPercent}
                  isEditing={plan.isEditing}
                  suffix="%"
                  onChange={v => handleChange(plan.id, 'dailyEarningPercent', v)}
                />
                <PlanField
                  label="Max Earning"
                  value={plan.maxEarningLimit}
                  isEditing={plan.isEditing}
                  prefix="$"
                  onChange={v => handleChange(plan.id, 'maxEarningLimit', v)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PlanField({
  label,
  value,
  isEditing,
  prefix,
  suffix,
  onChange,
}: {
  label: string
  value: number
  isEditing: boolean
  prefix?: string
  suffix?: string
  onChange: (val: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      {isEditing ? (
        <div className="relative">
          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
          <Input
            type="number"
            value={value}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            className={cn('bg-muted/50 border-border/50 h-9', prefix && 'pl-7', suffix && 'pr-7')}
          />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{suffix}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-1 h-9 px-3 bg-muted/30 rounded-md">
          {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
          <span className="text-sm font-medium text-foreground">{value.toLocaleString()}</span>
          {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
