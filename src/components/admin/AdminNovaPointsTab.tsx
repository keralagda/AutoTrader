'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Save, Loader2, Coins, Gift, Dices, Settings, TrendingUp, AlertTriangle } from 'lucide-react'

interface StoreItem {
  id: string
  name: string
  cost: number
  description: string
  type: string
  enabled: boolean
}

interface SpinPrize {
  amount: number
  weight: number
}

interface NPConfig {
  conversionRate: number
  xpPerLevel: number
  challengeMultiplier: number
  checkin: {
    baseNP: number
    streak3NP: number
    streak5NP: number
    streak7NP: number
    streak3Bonus: number
    streak5Bonus: number
    streak7Bonus: number
    milestone7NP: number
    milestone7Bonus: number
    milestone30NP: number
    milestone30Bonus: number
  }
  gamification: {
    checkinBaseNP: number
    checkinStreakBonus: number
    streakUsdcDay: number
    streakUsdcAmount: number
  }
  storeItems: StoreItem[]
  luckySpinPrizes: SpinPrize[]
}

export function AdminNovaPointsTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<NPConfig | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/nova-points')
      .then(r => r.json())
      .then(data => {
        setConfig(data.config)
        setStats(data.stats)
      })
      .catch(() => toast({ title: 'Failed to load', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/nova-points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) toast({ title: 'Nova Points config saved' })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-amber-400" />
            Nova Points Reward Pool
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure NP earning rates, store items, and conversion</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Config
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 text-center">
              <Sparkles className="size-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-amber-400">{stats.totalNPInCirculation?.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">NP in Circulation</p>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="p-4 text-center">
              <TrendingUp className="size-5 text-violet-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-violet-400">{stats.totalNPEverEarned?.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total NP Issued</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4 text-center">
              <Coins className="size-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-400">${stats.estimatedLiability}</p>
              <p className="text-[10px] text-muted-foreground">Est. Liability</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardContent className="p-4 text-center">
              <Gift className="size-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-cyan-400">{stats.totalUsers}</p>
              <p className="text-[10px] text-muted-foreground">Users with NP</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rates" className="gap-1.5"><Settings className="size-4" />Earning Rates</TabsTrigger>
          <TabsTrigger value="store" className="gap-1.5"><Gift className="size-4" />Store Items</TabsTrigger>
          <TabsTrigger value="spin" className="gap-1.5"><Dices className="size-4" />Lucky Spin</TabsTrigger>
        </TabsList>

        {/* Earning Rates */}
        <TabsContent value="rates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Global Settings */}
            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Global Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Conversion Rate (NP per $1)</Label>
                    <Input type="number" value={config.conversionRate} onChange={e => setConfig({ ...config, conversionRate: parseInt(e.target.value) || 1000 })} /></div>
                  <div className="space-y-1"><Label className="text-xs">NP per Level</Label>
                    <Input type="number" value={config.xpPerLevel} onChange={e => setConfig({ ...config, xpPerLevel: parseInt(e.target.value) || 1000 })} /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Challenge Reward Multiplier</Label>
                  <Input type="number" step="0.05" value={config.challengeMultiplier} onChange={e => setConfig({ ...config, challengeMultiplier: parseFloat(e.target.value) || 0.25 })} />
                  <p className="text-[10px] text-muted-foreground">Challenges pay this × configured NP (0.25 = 25%)</p></div>
              </CardContent>
            </Card>

            {/* Daily Check-in Rewards */}
            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Daily Check-in Rewards</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-[10px]">Base NP</Label>
                    <Input type="number" value={config.checkin.baseNP} onChange={e => setConfig({ ...config, checkin: { ...config.checkin, baseNP: parseInt(e.target.value) || 0 } })} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">3-Day Streak NP</Label>
                    <Input type="number" value={config.checkin.streak3NP} onChange={e => setConfig({ ...config, checkin: { ...config.checkin, streak3NP: parseInt(e.target.value) || 0 } })} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">5-Day Streak NP</Label>
                    <Input type="number" value={config.checkin.streak5NP} onChange={e => setConfig({ ...config, checkin: { ...config.checkin, streak5NP: parseInt(e.target.value) || 0 } })} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">7-Day Streak NP</Label>
                    <Input type="number" value={config.checkin.streak7NP} onChange={e => setConfig({ ...config, checkin: { ...config.checkin, streak7NP: parseInt(e.target.value) || 0 } })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-[10px]">3-Day $ Bonus</Label>
                    <Input type="number" step="0.01" value={config.checkin.streak3Bonus} onChange={e => setConfig({ ...config, checkin: { ...config.checkin, streak3Bonus: parseFloat(e.target.value) || 0 } })} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">5-Day $ Bonus</Label>
                    <Input type="number" step="0.01" value={config.checkin.streak5Bonus} onChange={e => setConfig({ ...config, checkin: { ...config.checkin, streak5Bonus: parseFloat(e.target.value) || 0 } })} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">7-Day $ Bonus</Label>
                    <Input type="number" step="0.01" value={config.checkin.streak7Bonus} onChange={e => setConfig({ ...config, checkin: { ...config.checkin, streak7Bonus: parseFloat(e.target.value) || 0 } })} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">Gamification Base NP</Label>
                    <Input type="number" value={config.gamification.checkinBaseNP} onChange={e => setConfig({ ...config, gamification: { ...config.gamification, checkinBaseNP: parseInt(e.target.value) || 0 } })} /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Store Items */}
        <TabsContent value="store" className="space-y-3">
          {config.storeItems.map((item, idx) => (
            <Card key={item.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={v => {
                      const items = [...config.storeItems]
                      items[idx] = { ...items[idx], enabled: v }
                      setConfig({ ...config, storeItems: items })
                    }}
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <Badge variant="outline" className="text-[9px] mt-0.5">{item.type}</Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Cost (NP)</Label>
                      <Input
                        type="number"
                        value={item.cost}
                        onChange={e => {
                          const items = [...config.storeItems]
                          items[idx] = { ...items[idx], cost: parseInt(e.target.value) || 0 }
                          setConfig({ ...config, storeItems: items })
                        }}
                        className="h-8"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px]">Description</Label>
                      <Input
                        value={item.description}
                        onChange={e => {
                          const items = [...config.storeItems]
                          items[idx] = { ...items[idx], description: e.target.value }
                          setConfig({ ...config, storeItems: items })
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Lucky Spin */}
        <TabsContent value="spin" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Dices className="size-4 text-amber-400" />Lucky Spin Prizes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {config.luckySpinPrizes.map((prize, idx) => (
                  <div key={idx} className="rounded-lg border border-border/50 p-3 space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Prize ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={prize.amount}
                        onChange={e => {
                          const prizes = [...config.luckySpinPrizes]
                          prizes[idx] = { ...prizes[idx], amount: parseFloat(e.target.value) || 0 }
                          setConfig({ ...config, luckySpinPrizes: prizes })
                        }}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Weight</Label>
                      <Input
                        type="number"
                        value={prize.weight}
                        onChange={e => {
                          const prizes = [...config.luckySpinPrizes]
                          prizes[idx] = { ...prizes[idx], weight: parseInt(e.target.value) || 1 }
                          setConfig({ ...config, luckySpinPrizes: prizes })
                        }}
                        className="h-8"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-center">
                      {((prize.weight / config.luckySpinPrizes.reduce((s, p) => s + p.weight, 0)) * 100).toFixed(1)}% chance
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                <p className="text-xs text-muted-foreground">Higher weight = more likely to win. Total weight: {config.luckySpinPrizes.reduce((s, p) => s + p.weight, 0)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
