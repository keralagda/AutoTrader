'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Shield, Save, AlertTriangle, Info } from 'lucide-react'

export function AdminWithdrawalLimitsTab() {
  const { toast } = useToast()
  const [limits, setLimits] = useState({
    withdrawalMin: 10,
    withdrawalMax: 10000,
    withdrawalFeePercent: 1,
    dailyLimit: 5000,
    weeklyLimit: 20000,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/withdrawal-limits')
      .then(r => r.json())
      .then(data => setLimits(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (field: keyof typeof limits, value: string) => {
    setLimits(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/withdrawal-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limits),
      })

      if (res.ok) {
        toast({ title: 'Withdrawal limits updated!' })
      } else {
        toast({ title: 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/4 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(j => (
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
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Withdrawal Limits & Fees
            </CardTitle>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              <Save className="size-3.5" /> {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Withdrawal Amount Limits */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Info className="size-4 text-muted-foreground" />
              Withdrawal Amount Limits
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Minimum Withdrawal ($)</Label>
                <Input
                  type="number"
                  value={limits.withdrawalMin}
                  onChange={e => handleChange('withdrawalMin', e.target.value)}
                  min="1"
                  step="1"
                />
                <p className="text-[10px] text-muted-foreground">Minimum amount per withdrawal</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Maximum Withdrawal ($)</Label>
                <Input
                  type="number"
                  value={limits.withdrawalMax}
                  onChange={e => handleChange('withdrawalMax', e.target.value)}
                  min="10"
                  step="1"
                />
                <p className="text-[10px] text-muted-foreground">Maximum amount per withdrawal</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fee Structure */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 text-muted-foreground" />
              Fee Structure
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Withdrawal Fee (%)</Label>
                <Input
                  type="number"
                  value={limits.withdrawalFeePercent}
                  onChange={e => handleChange('withdrawalFeePercent', e.target.value)}
                  min="0"
                  max="10"
                  step="0.1"
                />
                <p className="text-[10px] text-muted-foreground">Fee charged per withdrawal</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Platform Revenue (Remaining %)</Label>
                <Input
                  type="number"
                  value={(100 - (limits.withdrawalFeePercent || 0)).toFixed(1)}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-[10px] text-muted-foreground">Platform keeps remaining percentage</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Daily/Weekly Limits */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              Daily & Weekly Limits
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Daily Limit ($)</Label>
                <Input
                  type="number"
                  value={limits.dailyLimit}
                  onChange={e => handleChange('dailyLimit', e.target.value)}
                  min="100"
                  step="100"
                />
                <p className="text-[10px] text-muted-foreground">Maximum per 24 hours</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Weekly Limit ($)</Label>
                <Input
                  type="number"
                  value={limits.weeklyLimit}
                  onChange={e => handleChange('weeklyLimit', e.target.value)}
                  min="500"
                  step="500"
                />
                <p className="text-[10px] text-muted-foreground">Maximum per 7 days</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Users cannot withdraw below minimum or above maximum</p>
                <p>• Daily and weekly limits reset at midnight UTC</p>
                <p>• Withdrawal fees are deducted from the withdrawal amount</p>
                <p>• Platform revenue = 100% - withdrawal fee %</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
