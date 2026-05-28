'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Users, Save, Loader2, Percent, DollarSign, Layers } from 'lucide-react'

interface ReferralConfig {
  maxLevels: number
  depositCommission: { enabled: boolean; levels: number[] }
  profitShare: { enabled: boolean; levels: number[] }
  subscriptionFeeShare: { enabled: boolean; levels: number[] }
  qualificationRules: Record<string, number>
  bonusMultipliers: { vipTierMultiplier: Record<string, number>; contestMultiplier: number }
  signupBonus: { enabled: boolean; amount: number }
}

export function AdminReferralConfigTab() {
  const { toast } = useToast()
  const [config, setConfig] = useState<ReferralConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/referral-config')
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/referral-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) toast({ title: 'Referral config saved!' })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const updateLevel = (type: 'depositCommission' | 'profitShare' | 'subscriptionFeeShare', index: number, value: number) => {
    if (!config) return
    const updated = { ...config }
    updated[type] = { ...updated[type], levels: [...updated[type].levels] }
    updated[type].levels[index] = value
    setConfig(updated)
  }

  if (loading || !config) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Referral System Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure multi-level referral commissions, profit sharing, and qualification rules</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Config
        </Button>
      </div>

      {/* Deposit Commission */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Deposit Commission
              <Badge variant="outline" className="text-[9px]">On each referral deposit</Badge>
            </CardTitle>
            <Switch checked={config.depositCommission.enabled} onCheckedChange={v => setConfig({ ...config, depositCommission: { ...config.depositCommission, enabled: v } })} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {config.depositCommission.levels.map((pct, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-[9px] text-center block">L{i + 1}</Label>
                <Input type="number" step="0.1" className="h-8 text-xs text-center" value={pct} onChange={e => updateLevel('depositCommission', i, parseFloat(e.target.value) || 0)} />
                <p className="text-[8px] text-muted-foreground text-center">{pct}%</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Total: {config.depositCommission.levels.reduce((s, v) => s + v, 0)}% of each deposit distributed across {config.maxLevels} levels</p>
        </CardContent>
      </Card>

      {/* Profit Share */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4 text-cyan-400" /> Daily Profit Share
              <Badge variant="outline" className="text-[9px]">From referral's daily earnings</Badge>
            </CardTitle>
            <Switch checked={config.profitShare.enabled} onCheckedChange={v => setConfig({ ...config, profitShare: { ...config.profitShare, enabled: v } })} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {config.profitShare.levels.map((pct, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-[9px] text-center block">L{i + 1}</Label>
                <Input type="number" step="1" className="h-8 text-xs text-center" value={pct} onChange={e => updateLevel('profitShare', i, parseFloat(e.target.value) || 0)} />
                <p className="text-[8px] text-muted-foreground text-center">{pct}%</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Total: {config.profitShare.levels.reduce((s, v) => s + v, 0)}% of profit share pool distributed across levels</p>
        </CardContent>
      </Card>

      {/* Subscription Fee Share */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" /> Subscription Fee Share
              <Badge variant="outline" className="text-[9px]">From plan entry fees</Badge>
            </CardTitle>
            <Switch checked={config.subscriptionFeeShare.enabled} onCheckedChange={v => setConfig({ ...config, subscriptionFeeShare: { ...config.subscriptionFeeShare, enabled: v } })} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {config.subscriptionFeeShare.levels.map((pct, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-[9px] text-center block">L{i + 1}</Label>
                <Input type="number" step="1" className="h-8 text-xs text-center" value={pct} onChange={e => updateLevel('subscriptionFeeShare', i, parseFloat(e.target.value) || 0)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Qualification Rules */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Qualification Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Minimum direct referrals needed to earn from each level</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[2, 3, 4, 5, 6, 7].map(level => (
              <div key={level} className="space-y-1">
                <Label className="text-xs">Level {level} requires</Label>
                <div className="flex items-center gap-1">
                  <Input type="number" className="h-8 text-xs" value={config.qualificationRules[`level${level}MinReferrals`] || 0} onChange={e => setConfig({ ...config, qualificationRules: { ...config.qualificationRules, [`level${level}MinReferrals`]: parseInt(e.target.value) || 0 } })} />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">referrals</span>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs">Minimum own deposit to earn referral income</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input type="number" className="h-8 text-xs max-w-32" value={config.qualificationRules.minDepositToEarn || 0} onChange={e => setConfig({ ...config, qualificationRules: { ...config.qualificationRules, minDepositToEarn: parseInt(e.target.value) || 0 } })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Multipliers */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bonus Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(config.bonusMultipliers.vipTierMultiplier).map(([tier, mult]) => (
              <div key={tier} className="space-y-1">
                <Label className="text-xs">{tier} Tier</Label>
                <Input type="number" step="0.1" className="h-8 text-xs" value={mult} onChange={e => setConfig({ ...config, bonusMultipliers: { ...config.bonusMultipliers, vipTierMultiplier: { ...config.bonusMultipliers.vipTierMultiplier, [tier]: parseFloat(e.target.value) || 1 } } })} />
                <p className="text-[9px] text-muted-foreground">{mult}x earnings</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Contest/Promotion Multiplier</Label>
              <p className="text-[10px] text-muted-foreground">Set to 2 during referral contests</p>
            </div>
            <Input type="number" step="0.5" className="h-8 text-xs w-20" value={config.bonusMultipliers.contestMultiplier} onChange={e => setConfig({ ...config, bonusMultipliers: { ...config.bonusMultipliers, contestMultiplier: parseFloat(e.target.value) || 1 } })} />
          </div>
        </CardContent>
      </Card>

      {/* Signup Bonus */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Signup Referral Bonus</CardTitle>
            <Switch checked={config.signupBonus.enabled} onCheckedChange={v => setConfig({ ...config, signupBonus: { ...config.signupBonus, enabled: v } })} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input type="number" className="h-8 text-xs max-w-32" value={config.signupBonus.amount} onChange={e => setConfig({ ...config, signupBonus: { ...config.signupBonus, amount: parseFloat(e.target.value) || 0 } })} />
            <span className="text-xs text-muted-foreground">credited to referrer when someone signs up with their code</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
