'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { Save, Settings } from 'lucide-react'

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

interface SettingsState {
  platform_name: string
  currency: string
  min_withdrawal: string
  withdrawal_fee: string
  trading_days: string
  profit_cycle: string
  challenges_enabled: string
}

const DEFAULT_SETTINGS: SettingsState = {
  platform_name: 'Auto Trade',
  currency: 'USDC',
  min_withdrawal: '10',
  withdrawal_fee: '2',
  trading_days: 'monday,tuesday,wednesday,thursday,friday',
  profit_cycle: 'weekly',
  challenges_enabled: 'false',
}

export function SettingsTab() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSettings({ ...DEFAULT_SETTINGS, ...data })
    } catch {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Settings Saved', description: 'Platform settings have been updated' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleTradingDay = (day: string) => {
    const current = settings.trading_days.split(',').filter(Boolean)
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day]
    setSettings(prev => ({ ...prev, trading_days: updated.join(',') }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-10 bg-muted rounded w-2/3" />
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
          <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your trading platform</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-400" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Platform Name</Label>
              <Input
                value={settings.platform_name}
                onChange={e => setSettings(prev => ({ ...prev, platform_name: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Currency</Label>
              <Input
                value={settings.currency}
                onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Minimum Withdrawal Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={settings.min_withdrawal}
                  onChange={e => setSettings(prev => ({ ...prev, min_withdrawal: e.target.value }))}
                  className="bg-muted/50 border-border/50 pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Withdrawal Fee (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={settings.withdrawal_fee}
                  onChange={e => setSettings(prev => ({ ...prev, withdrawal_fee: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Days */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Trading Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map(day => {
                const isActive = settings.trading_days.split(',').includes(day.value)
                return (
                  <label
                    key={day.value}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <Checkbox
                      checked={isActive}
                      onCheckedChange={() => toggleTradingDay(day.value)}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Profit Cycle & Features */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Profit & Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Profit Cycle</Label>
              <div className="flex gap-2">
                {['weekly', 'monthly'].map(cycle => (
                  <button
                    key={cycle}
                    onClick={() => setSettings(prev => ({ ...prev, profit_cycle: cycle }))}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                      settings.profit_cycle === cycle
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Challenges</p>
                <p className="text-xs text-muted-foreground">Enable challenge features</p>
              </div>
              <Switch
                checked={settings.challenges_enabled === 'true'}
                onCheckedChange={checked =>
                  setSettings(prev => ({ ...prev, challenges_enabled: checked ? 'true' : 'false' }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
