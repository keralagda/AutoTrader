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
import {
  Save, Loader2, Layers, Zap, TrendingUp, Calendar,
  Dices, Crown, Shield, ArrowUpDown, AlertTriangle, Sparkles,
  Activity, BarChart3,
} from 'lucide-react'

interface Rule {
  id: string
  name: string
  type: string
  enabled: boolean
  priority?: number
  condition?: string
  action?: string
  value?: number
  description: string
  [key: string]: any
}

interface LogicConfig {
  variables: Rule[]
  profitRules: Rule[]
  calculatorRules: Rule[]
  stackingRules: Rule[]
  patterns: Rule[]
  depositRules: Rule[]
  riskRules: Rule[]
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  percentage: TrendingUp,
  modifier: Zap,
  schedule: Calendar,
  cap: Shield,
  display: BarChart3,
  calculation: Activity,
  stacking: Layers,
  pattern: Sparkles,
}

const TYPE_COLORS: Record<string, string> = {
  percentage: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  modifier: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  schedule: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  cap: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  display: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  calculation: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  stacking: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  pattern: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
}

function RuleCard({ rule, onToggle, onChange }: { rule: Rule; onToggle: () => void; onChange: (field: string, value: any) => void }) {
  const Icon = TYPE_ICONS[rule.type] || Zap
  const colors = TYPE_COLORS[rule.type] || 'text-muted-foreground bg-muted/30 border-border/50'

  return (
    <Card className={`border ${rule.enabled ? colors.split(' ').slice(2).join(' ') : 'border-border/30 opacity-60'} transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Switch checked={rule.enabled} onCheckedChange={onToggle} className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`size-6 rounded flex items-center justify-center ${colors.split(' ').slice(1, 2).join(' ')}`}>
                <Icon className={`size-3.5 ${colors.split(' ')[0]}`} />
              </div>
              <h4 className="text-sm font-semibold truncate">{rule.name}</h4>
              <Badge variant="outline" className="text-[9px] shrink-0">{rule.type}</Badge>
              {rule.priority && <Badge variant="outline" className="text-[9px] shrink-0">P{rule.priority}</Badge>}
              {rule.variableRef && <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30">⚡ var</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>

            {/* Editable fields */}
            {rule.enabled && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {rule.value !== undefined && rule.min !== undefined && (
                  <div className="col-span-2 md:col-span-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] text-muted-foreground">Value: {rule.value}</Label>
                      <span className="text-[9px] text-muted-foreground">{rule.min} — {rule.max}</span>
                    </div>
                    <input type="range" min={rule.min} max={rule.max} step={rule.step || 0.1} value={rule.value} onChange={e => onChange('value', parseFloat(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
                  </div>
                )}
                {rule.value !== undefined && rule.min === undefined && (
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-muted-foreground">Value</Label>
                    <Input type="number" step="0.01" value={rule.value} onChange={e => onChange('value', parseFloat(e.target.value))} className="h-7 text-xs" />
                  </div>
                )}
                {rule.chance !== undefined && (
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-muted-foreground">Chance (%)</Label>
                    <Input type="number" value={rule.chance} onChange={e => onChange('chance', parseInt(e.target.value))} className="h-7 text-xs" />
                  </div>
                )}
                {rule.minDays !== undefined && (
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-muted-foreground">Min Days</Label>
                    <Input type="number" value={rule.minDays} onChange={e => onChange('minDays', parseInt(e.target.value))} className="h-7 text-xs" />
                  </div>
                )}
                {rule.bonusPerStack !== undefined && (
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between"><Label className="text-[9px]">Bonus/Stack: {rule.bonusPerStack}%</Label><span className="text-[9px] text-muted-foreground">{rule.min || 0}—{rule.max || 5}</span></div>
                    <input type="range" min={rule.min || 0} max={rule.max || 5} step={rule.step || 0.1} value={rule.bonusPerStack} onChange={e => onChange('bonusPerStack', parseFloat(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
                  </div>
                )}
                {rule.maxStacks !== undefined && (
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-muted-foreground">Max Stacks</Label>
                    <Input type="number" value={rule.maxStacks} onChange={e => onChange('maxStacks', parseInt(e.target.value))} className="h-7 text-xs" />
                  </div>
                )}
                {rule.skewFactor !== undefined && (
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between"><Label className="text-[9px]">Skew: {rule.skewFactor}</Label><span className="text-[9px] text-muted-foreground">{rule.min || 0.1}—{rule.max || 0.9}</span></div>
                    <input type="range" min={rule.min || 0.1} max={rule.max || 0.9} step={rule.step || 0.05} value={rule.skewFactor} onChange={e => onChange('skewFactor', parseFloat(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
                  </div>
                )}
                {rule.startMultiplier !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Start Mult.</Label><Input type="number" step="0.1" value={rule.startMultiplier} onChange={e => onChange('startMultiplier', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.endMultiplier !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">End Mult.</Label><Input type="number" step="0.1" value={rule.endMultiplier} onChange={e => onChange('endMultiplier', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.rampDays !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Ramp Days</Label><Input type="number" value={rule.rampDays} onChange={e => onChange('rampDays', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.amplitude !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Amplitude</Label><Input type="number" step="0.05" value={rule.amplitude} onChange={e => onChange('amplitude', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.periodDays !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Period (days)</Label><Input type="number" value={rule.periodDays} onChange={e => onChange('periodDays', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.decayRate !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Decay Rate</Label><Input type="number" step="0.001" value={rule.decayRate} onChange={e => onChange('decayRate', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.compoundRate !== undefined && (
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between"><Label className="text-[9px]">Compound: {rule.compoundRate}x</Label><span className="text-[9px] text-muted-foreground">{rule.min || 1.0}—{rule.max || 1.2}</span></div>
                    <input type="range" min={rule.min || 1.0} max={rule.max || 1.2} step={rule.step || 0.005} value={rule.compoundRate} onChange={e => onChange('compoundRate', parseFloat(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary" />
                  </div>
                )}
                {rule.cooldownHours !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Cooldown (hrs)</Label><Input type="number" value={rule.cooldownHours} onChange={e => onChange('cooldownHours', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.maxAmount !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Max Amount ($)</Label><Input type="number" value={rule.maxAmount} onChange={e => onChange('maxAmount', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                )}
                {rule.minAmount !== undefined && (
                  <div className="space-y-0.5"><Label className="text-[9px]">Min Amount ($)</Label><Input type="number" value={rule.minAmount} onChange={e => onChange('minAmount', parseInt(e.target.value))} className="h-7 text-xs" /></div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminLogicBuilderTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<LogicConfig | null>(null)

  useEffect(() => {
    fetch('/api/admin/logic-builder')
      .then(r => r.json())
      .then(setConfig)
      .catch(() => toast({ title: 'Failed to load', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/logic-builder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) toast({ title: 'Logic rules saved' })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = (section: keyof LogicConfig, idx: number) => {
    if (!config) return
    const rules = [...config[section]]
    rules[idx] = { ...rules[idx], enabled: !rules[idx].enabled }
    setConfig({ ...config, [section]: rules })
  }

  const changeRule = (section: keyof LogicConfig, idx: number, field: string, value: any) => {
    if (!config) return
    const rules = [...config[section]]
    rules[idx] = { ...rules[idx], [field]: value }
    setConfig({ ...config, [section]: rules })
  }

  if (loading || !config) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
  }

  const enabledCount = config.profitRules.filter(r => r.enabled).length +
    config.calculatorRules.filter(r => r.enabled).length +
    config.stackingRules.filter(r => r.enabled).length +
    config.patterns.filter(r => r.enabled).length +
    (config.depositRules || []).filter((r: Rule) => r.enabled).length +
    (config.riskRules || []).filter((r: Rule) => r.enabled).length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="size-5 text-violet-400" />
            Logic Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stack rules, patterns, and modifiers to control profit distribution logic
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
            {enabledCount} rules active
          </Badge>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Rules
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">How Logic Builder Works</p>
            <p className="text-xs text-muted-foreground mt-1">
              Rules are processed in priority order during profit distribution. Enable/disable rules to stack behaviors.
              Profit Rules control the cron distribution. Calculator Rules control what users see on the landing page.
              Patterns add time-based variations to returns.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="variables" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="variables" className="gap-1.5">
            <Sparkles className="size-4" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5">
            <TrendingUp className="size-4" />
            Profit ({config.profitRules.filter(r => r.enabled).length})
          </TabsTrigger>
          <TabsTrigger value="deposit" className="gap-1.5">
            <Shield className="size-4" />
            Deposits ({(config.depositRules || []).filter(r => r.enabled).length})
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-1.5">
            <BarChart3 className="size-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="stacking" className="gap-1.5">
            <Layers className="size-4" />
            Stacking
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-1.5">
            <Activity className="size-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5">
            <Dices className="size-4" />
            Risk Engine
          </TabsTrigger>
        </TabsList>

        {/* Variables Tab */}
        <TabsContent value="variables" className="space-y-3">
          <p className="text-xs text-muted-foreground">Global variables that can be referenced by rules. Change a variable here and all linked rules update.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(config.variables || []).map((v: any, idx: number) => (
              <Card key={v.id} className="border-violet-500/20 bg-violet-500/5">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{v.name}</h4>
                    <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30">{v.type}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{v.description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Value: <strong>{v.value}</strong></span>
                      <span>{v.min} — {v.max}</span>
                    </div>
                    <input
                      type="range"
                      min={v.min}
                      max={v.max}
                      step={v.step || 0.1}
                      value={v.value}
                      onChange={e => {
                        const vars = [...(config.variables || [])]
                        vars[idx] = { ...vars[idx], value: parseFloat(e.target.value) }
                        setConfig({ ...config, variables: vars })
                      }}
                      className="w-full h-2 rounded-full appearance-none bg-violet-500/20 cursor-pointer accent-violet-500"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profit" className="space-y-3">
          <p className="text-xs text-muted-foreground">Controls how daily profits are calculated and distributed by the cron job. Rules stack in priority order.</p>
          {config.profitRules.map((rule, idx) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule('profitRules', idx)}
              onChange={(field, value) => changeRule('profitRules', idx, field, value)}
            />
          ))}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-3">
          <p className="text-xs text-muted-foreground">Controls how the landing page calculator displays estimated returns to users.</p>
          {config.calculatorRules.map((rule, idx) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule('calculatorRules', idx)}
              onChange={(field, value) => changeRule('calculatorRules', idx, field, value)}
            />
          ))}
        </TabsContent>

        <TabsContent value="stacking" className="space-y-3">
          <p className="text-xs text-muted-foreground">Controls how multiple deposits (stacks) interact and compound.</p>
          {config.stackingRules.map((rule, idx) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule('stackingRules', idx)}
              onChange={(field, value) => changeRule('stackingRules', idx, field, value)}
            />
          ))}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-3">
          <p className="text-xs text-muted-foreground">Time-based patterns that modify returns over the deposit lifecycle. Only one pattern should be active at a time.</p>
          {config.patterns.map((rule, idx) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule('patterns', idx)}
              onChange={(field, value) => changeRule('patterns', idx, field, value)}
            />
          ))}
        </TabsContent>

        {/* Deposit Rules Tab */}
        <TabsContent value="deposit" className="space-y-3">
          <p className="text-xs text-muted-foreground">Advanced deposit and earning rules — cooldowns, limits, progression, penalties, and automation.</p>
          {(config.depositRules || []).map((rule: Rule, idx: number) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule('depositRules' as keyof LogicConfig, idx)}
              onChange={(field, value) => changeRule('depositRules' as keyof LogicConfig, idx, field, value)}
            />
          ))}
        </TabsContent>

        {/* Risk Engine Tab */}
        <TabsContent value="risk" className="space-y-3">
          <p className="text-xs text-muted-foreground">Dynamic risk adjustment rules — platform-level controls that adapt returns based on conditions.</p>
          {(config.riskRules || []).map((rule: Rule, idx: number) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule('riskRules' as keyof LogicConfig, idx)}
              onChange={(field, value) => changeRule('riskRules' as keyof LogicConfig, idx, field, value)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
