'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { Activity, Save, RotateCcw, Shuffle, Trash2, Plus } from 'lucide-react'

interface TradingConfig {
  winStreakMin: number
  winStreakMax: number
  lossStreakMin: number
  lossStreakMax: number
  neutralStreakMin: number
  neutralStreakMax: number
  signalIntervalMin: number
  signalIntervalMax: number
  profitMultiplier: number
  maxWinRate: number
  pairs: string
}

interface WLNPatternConfig {
  mode: 'streak' | 'weighted' | 'custom'
  winWeight: number
  lossWeight: number
  neutralWeight: number
  sequences: string[]
}

const DEFAULT_CONFIG: TradingConfig = {
  winStreakMin: 3, winStreakMax: 5,
  lossStreakMin: 2, lossStreakMax: 3,
  neutralStreakMin: 3, neutralStreakMax: 4,
  signalIntervalMin: 5, signalIntervalMax: 12,
  profitMultiplier: 1.0, maxWinRate: 72,
  pairs: 'BTC/USDT,ETH/USDT,SOL/USDT,BNB/USDT,XRP/USDT,ADA/USDT,DOGE/USDT,AVAX/USDT',
}

const DEFAULT_PATTERN: WLNPatternConfig = {
  mode: 'streak',
  winWeight: 50,
  lossWeight: 25,
  neutralWeight: 25,
  sequences: [],
}

export function AdminTradingConfigTab() {
  const { toast } = useToast()
  const [config, setConfig] = useState<TradingConfig>(DEFAULT_CONFIG)
  const [pattern, setPattern] = useState<WLNPatternConfig>(DEFAULT_PATTERN)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPattern, setSavingPattern] = useState(false)
  const [newSequence, setNewSequence] = useState('')
  const [previewPattern, setPreviewPattern] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/trading-config').then(r => r.json()),
      fetch('/api/admin/wln-pattern').then(r => r.json()),
    ]).then(([cfg, pat]) => {
      setConfig({ ...DEFAULT_CONFIG, ...cfg })
      setPattern({ ...DEFAULT_PATTERN, ...pat })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/trading-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) toast({ title: 'Trading config saved!' })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleSavePattern = async () => {
    setSavingPattern(true)
    try {
      const res = await fetch('/api/admin/wln-pattern', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pattern),
      })
      if (res.ok) toast({ title: 'WLN pattern config saved!' })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSavingPattern(false) }
  }

  const handleResetPatterns = async () => {
    try {
      const res = await fetch('/api/admin/wln-pattern', { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        toast({ title: `Cleared ${data.cleared} stored patterns. Users will get fresh patterns.` })
      }
    } catch { toast({ title: 'Failed to reset', variant: 'destructive' }) }
  }

  const handlePreview = async () => {
    try {
      const res = await fetch('/api/trading-pattern?count=30')
      if (res.ok) {
        const data = await res.json()
        setPreviewPattern(data.pattern || [])
      }
    } catch {}
  }

  const addSequence = () => {
    const cleaned = newSequence.toUpperCase().replace(/[^WLN]/g, '')
    if (cleaned.length < 2) { toast({ title: 'Sequence must be at least 2 characters (W, L, N)', variant: 'destructive' }); return }
    setPattern({ ...pattern, sequences: [...pattern.sequences, cleaned] })
    setNewSequence('')
  }

  const removeSequence = (idx: number) => {
    setPattern({ ...pattern, sequences: pattern.sequences.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-6">
      {/* WLN Pattern Configuration */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shuffle className="size-4 text-primary" />
              WLN Pattern Engine
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1.5">
                <Activity className="size-3.5" /> Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetPatterns} className="gap-1.5 text-amber-400">
                <RotateCcw className="size-3.5" /> Reset All User Patterns
              </Button>
              <Button size="sm" onClick={handleSavePattern} disabled={savingPattern} className="gap-1.5">
                <Save className="size-3.5" /> {savingPattern ? 'Saving...' : 'Save Pattern'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Pattern Generation Mode</Label>
            <RadioGroup value={pattern.mode} onValueChange={(v) => setPattern({ ...pattern, mode: v as any })}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${pattern.mode === 'streak' ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                  <RadioGroupItem value="streak" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Streak-based</p>
                    <p className="text-[11px] text-muted-foreground">Generates randomized streaks using min/max ranges. Order is shuffled each cycle.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${pattern.mode === 'weighted' ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                  <RadioGroupItem value="weighted" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Weighted Random</p>
                    <p className="text-[11px] text-muted-foreground">Each signal is independently random with configurable W/L/N probability weights.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${pattern.mode === 'custom' ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                  <RadioGroupItem value="custom" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Custom Sequences</p>
                    <p className="text-[11px] text-muted-foreground">Define exact WLN sequences. A random one is picked and repeated for each user.</p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Mode-specific settings */}
          {pattern.mode === 'streak' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Streak Ranges (randomized order each cycle)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <Label className="text-xs text-emerald-400">Win Streak</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-[10px] text-muted-foreground">Min</span>
                      <Input type="number" value={config.winStreakMin} onChange={e => setConfig({ ...config, winStreakMin: parseInt(e.target.value) || 1 })} min={1} max={10} /></div>
                    <div><span className="text-[10px] text-muted-foreground">Max</span>
                      <Input type="number" value={config.winStreakMax} onChange={e => setConfig({ ...config, winStreakMax: parseInt(e.target.value) || 5 })} min={1} max={15} /></div>
                  </div>
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <Label className="text-xs text-rose-400">Loss Streak</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-[10px] text-muted-foreground">Min</span>
                      <Input type="number" value={config.lossStreakMin} onChange={e => setConfig({ ...config, lossStreakMin: parseInt(e.target.value) || 1 })} min={1} max={10} /></div>
                    <div><span className="text-[10px] text-muted-foreground">Max</span>
                      <Input type="number" value={config.lossStreakMax} onChange={e => setConfig({ ...config, lossStreakMax: parseInt(e.target.value) || 3 })} min={1} max={10} /></div>
                  </div>
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-gray-500/5 border border-gray-500/20">
                  <Label className="text-xs text-gray-400">Neutral Streak</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-[10px] text-muted-foreground">Min</span>
                      <Input type="number" value={config.neutralStreakMin} onChange={e => setConfig({ ...config, neutralStreakMin: parseInt(e.target.value) || 1 })} min={1} max={10} /></div>
                    <div><span className="text-[10px] text-muted-foreground">Max</span>
                      <Input type="number" value={config.neutralStreakMax} onChange={e => setConfig({ ...config, neutralStreakMax: parseInt(e.target.value) || 4 })} min={1} max={10} /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pattern.mode === 'weighted' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Probability Weights</h4>
              <p className="text-xs text-muted-foreground">Each signal independently rolls against these weights. Higher = more likely.</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <Label className="text-xs text-emerald-400">Win Weight</Label>
                  <Input type="number" value={pattern.winWeight} onChange={e => setPattern({ ...pattern, winWeight: parseInt(e.target.value) || 1 })} min={1} max={100} />
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <Label className="text-xs text-rose-400">Loss Weight</Label>
                  <Input type="number" value={pattern.lossWeight} onChange={e => setPattern({ ...pattern, lossWeight: parseInt(e.target.value) || 1 })} min={1} max={100} />
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-gray-500/5 border border-gray-500/20">
                  <Label className="text-xs text-gray-400">Neutral Weight</Label>
                  <Input type="number" value={pattern.neutralWeight} onChange={e => setPattern({ ...pattern, neutralWeight: parseInt(e.target.value) || 1 })} min={1} max={100} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Effective: W={((pattern.winWeight / (pattern.winWeight + pattern.lossWeight + pattern.neutralWeight)) * 100).toFixed(0)}%
                L={((pattern.lossWeight / (pattern.winWeight + pattern.lossWeight + pattern.neutralWeight)) * 100).toFixed(0)}%
                N={((pattern.neutralWeight / (pattern.winWeight + pattern.lossWeight + pattern.neutralWeight)) * 100).toFixed(0)}%
              </p>
            </div>
          )}

          {pattern.mode === 'custom' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Custom Sequences</h4>
              <p className="text-xs text-muted-foreground">Define exact patterns using W (win), L (loss), N (neutral). A random sequence is picked for each user session.</p>
              <div className="flex gap-2">
                <Input value={newSequence} onChange={e => setNewSequence(e.target.value.toUpperCase().replace(/[^WLN]/g, ''))}
                  placeholder="e.g. WWWLLNNNWWLLN" className="font-mono" />
                <Button onClick={addSequence} size="sm" className="gap-1.5 shrink-0"><Plus className="size-3.5" /> Add</Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pattern.sequences.map((seq, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex gap-0.5 flex-wrap">
                      {seq.split('').map((c, i) => (
                        <span key={i} className={`inline-block w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold ${
                          c === 'W' ? 'bg-emerald-500/30 text-emerald-400' :
                          c === 'L' ? 'bg-rose-500/30 text-rose-400' : 'bg-gray-500/30 text-gray-400'
                        }`}>{c}</span>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" className="size-7 text-rose-400" onClick={() => removeSequence(idx)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {pattern.sequences.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No custom sequences. Add one above.</p>
                )}
              </div>
            </div>
          )}

          {/* Live Preview */}
          {previewPattern.length > 0 && (
            <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Generated Pattern Preview (30 signals)</h4>
              <div className="flex flex-wrap gap-0.5">
                {previewPattern.map((c, i) => (
                  <span key={i} className={`inline-block w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold ${
                    c === 'W' ? 'bg-emerald-500/30 text-emerald-400' :
                    c === 'L' ? 'bg-rose-500/30 text-rose-400' : 'bg-gray-500/30 text-gray-400'
                  }`}>{c}</span>
                ))}
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                <span>W: {previewPattern.filter(c => c === 'W').length}</span>
                <span>L: {previewPattern.filter(c => c === 'L').length}</span>
                <span>N: {previewPattern.filter(c => c === 'N').length}</span>
                <span>Win%: {((previewPattern.filter(c => c === 'W').length / previewPattern.length) * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signal Timing & Pairs */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Signal Timing & Pairs
            </CardTitle>
            <Button size="sm" onClick={handleSaveConfig} disabled={saving} className="gap-1.5">
              <Save className="size-3.5" /> {saving ? 'Saving...' : 'Save Config'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Min Interval (seconds)</Label>
              <Input type="number" value={config.signalIntervalMin} onChange={e => setConfig({ ...config, signalIntervalMin: parseInt(e.target.value) || 3 })} min={2} max={60} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max Interval (seconds)</Label>
              <Input type="number" value={config.signalIntervalMax} onChange={e => setConfig({ ...config, signalIntervalMax: parseInt(e.target.value) || 15 })} min={3} max={120} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Profit Multiplier</Label>
              <Input type="number" step="0.1" value={config.profitMultiplier} onChange={e => setConfig({ ...config, profitMultiplier: parseFloat(e.target.value) || 1 })} min={0.1} max={5} />
              <p className="text-[10px] text-muted-foreground">Scales signal profit display</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs">Trading Pairs (comma-separated)</Label>
            <Input value={config.pairs} onChange={e => setConfig({ ...config, pairs: e.target.value })} placeholder="BTC/USDT,ETH/USDT,..." />
            <p className="text-[10px] text-muted-foreground">
              {config.pairs.split(',').length} pairs configured
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
