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
import { Sparkles, Save, Loader2, Coins, Gift, Dices, Settings, TrendingUp, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

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

  // CRUD States for Store Items
  const [isAddStoreItemOpen, setIsAddStoreItemOpen] = useState(false)
  const [newItemId, setNewItemId] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemCost, setNewItemCost] = useState(100)
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemType, setNewItemType] = useState('conversion')

  const handleCreateStoreItem = () => {
    if (!config) return
    const cleanId = newItemId.trim()
    const cleanName = newItemName.trim()
    const cleanDesc = newItemDesc.trim()

    if (!cleanId) {
      toast({ title: 'Invalid ID', description: 'Store Item ID is required', variant: 'destructive' })
      return
    }

    if ((config.storeItems || []).some(item => item.id === cleanId)) {
      toast({ title: 'Duplicate ID', description: `An item with ID "${cleanId}" already exists`, variant: 'destructive' })
      return
    }

    if (!cleanName) {
      toast({ title: 'Invalid Name', description: 'Store Item Name is required', variant: 'destructive' })
      return
    }

    const newItem: StoreItem = {
      id: cleanId,
      name: cleanName,
      cost: newItemCost,
      description: cleanDesc,
      type: newItemType,
      enabled: true
    }

    setConfig({
      ...config,
      storeItems: [...(config.storeItems || []), newItem]
    })

    // Reset
    setNewItemId('')
    setNewItemName('')
    setNewItemCost(100)
    setNewItemDesc('')
    setNewItemType('conversion')
    setIsAddStoreItemOpen(false)

    toast({ title: 'Store item added locally', description: 'Remember to save config to write changes to DB.' })
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10 p-3 rounded-lg border border-border/40 mb-3">
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Nova Store Items</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Manage virtual store rewards purchasable with earned Nova Points.</p>
            </div>
            <Dialog open={isAddStoreItemOpen} onOpenChange={setIsAddStoreItemOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 bg-amber-500 hover:bg-amber-600 text-black shrink-0 text-xs h-8">
                  <Plus className="size-3.5" /> Add Store Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border/50 text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Create Store Reward Item</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Add a new reward package to the user store catalog.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reward ID (Unique Slug)</Label>
                    <Input
                      placeholder="e.g. custom_perk_token"
                      value={newItemId}
                      onChange={e => setNewItemId(e.target.value)}
                      className="bg-muted/50 border-border/50 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Name</Label>
                    <Input
                      placeholder="e.g. 5% Deposit Bonus Token"
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      className="bg-muted/50 border-border/50 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="e.g. Unlocks 5% extra on your next deposit"
                      value={newItemDesc}
                      onChange={e => setNewItemDesc(e.target.value)}
                      className="bg-muted/50 border-border/50 text-xs h-8"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Reward Type</Label>
                      <select
                        value={newItemType}
                        onChange={e => setNewItemType(e.target.value)}
                        className="w-full bg-muted/50 border border-border/50 text-xs rounded-md h-8 px-2 text-foreground focus:outline-none"
                      >
                        <option value="conversion">USDC Conversion</option>
                        <option value="perk">Perk/Fee Waiver</option>
                        <option value="boost">Multiplier Boost</option>
                        <option value="spin">Wheel Spin</option>
                        <option value="cosmetic">Cosmetic Customization</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cost (Nova Points)</Label>
                      <Input
                        type="number"
                        value={newItemCost}
                        onChange={e => setNewItemCost(parseInt(e.target.value) || 0)}
                        className="bg-muted/50 border-border/50 text-xs h-8"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsAddStoreItemOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreateStoreItem} className="bg-amber-500 hover:bg-amber-600 text-black text-xs">
                    Create Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {(config.storeItems || []).map((item, idx) => (
            <Card key={item.id} className={`border-border/50 relative ${item.enabled ? 'border-amber-500/20 bg-amber-500/5' : 'opacity-60'}`}>
              <CardContent className="p-4 pr-12">
                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete the store item "${item.name}"?`)) {
                      const items = (config.storeItems || []).filter((_, i) => i !== idx)
                      setConfig({ ...config, storeItems: items })
                      toast({ title: 'Item deleted locally', description: 'Save config to apply changes.' })
                    }
                  }}
                  className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded"
                >
                  <Trash2 className="size-3.5" />
                </Button>

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
                      <Badge variant="outline" className="text-[9px] mt-0.5 capitalize">{item.type}</Badge>
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
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Dices className="size-4 text-amber-400" />
                Lucky Spin Prizes
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  const prizes = [...(config.luckySpinPrizes || []), { amount: 1.0, weight: 10 }]
                  setConfig({ ...config, luckySpinPrizes: prizes })
                  toast({ title: 'Prize option added locally', description: 'Configure values and save settings.' })
                }}
                className="gap-1 bg-amber-500 hover:bg-amber-600 text-black text-xs h-7"
              >
                <Plus className="size-3" /> Add Prize
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(config.luckySpinPrizes || []).map((prize, idx) => (
                  <div key={idx} className="rounded-lg border border-border/50 p-3 space-y-2 relative bg-card/40 pr-8">
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remove this spin prize option?`)) {
                          const prizes = (config.luckySpinPrizes || []).filter((_, i) => i !== idx)
                          setConfig({ ...config, luckySpinPrizes: prizes })
                          toast({ title: 'Prize option removed locally', description: 'Save config to apply changes.' })
                        }
                      }}
                      className="absolute top-2 right-2 h-5 w-5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded"
                    >
                      <Trash2 className="size-3" />
                    </Button>

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
                      {((prize.weight / (config.luckySpinPrizes.reduce((s, p) => s + p.weight, 0) || 1)) * 100).toFixed(1)}% chance
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
