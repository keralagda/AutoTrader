'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Save, Loader2, Layers, Zap, TrendingUp, Calendar,
  Dices, Crown, Shield, ArrowUpDown, AlertTriangle, Sparkles,
  Activity, BarChart3, Plus, Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

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
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  // Add Variable Dialog States
  const [isAddVarOpen, setIsAddVarOpen] = useState(false)
  const [newVarId, setNewVarId] = useState('var_')
  const [newVarName, setNewVarName] = useState('')
  const [newVarDesc, setNewVarDesc] = useState('')
  const [newVarType, setNewVarType] = useState('slider')
  const [newVarValue, setNewVarValue] = useState(0.5)
  const [newVarMin, setNewVarMin] = useState(0)
  const [newVarMax, setNewVarMax] = useState(1)
  const [newVarStep, setNewVarStep] = useState(0.05)

  const handleAddVariable = () => {
    if (!config) return
    const cleanId = newVarId.trim()
    const cleanName = newVarName.trim()
    const cleanDesc = newVarDesc.trim()

    if (!cleanId.startsWith('var_') || cleanId === 'var_') {
      toast({ title: 'Invalid ID', description: 'Variable ID must start with "var_"', variant: 'destructive' })
      return
    }

    if (!/^[a-z0-9_]+$/.test(cleanId)) {
      toast({ title: 'Invalid ID', description: 'Variable ID must contain only lowercase letters, numbers, or underscores', variant: 'destructive' })
      return
    }

    if (!cleanName) {
      toast({ title: 'Invalid Name', description: 'Variable Name is required', variant: 'destructive' })
      return
    }

    if ((config.variables || []).some((v: any) => v.id === cleanId)) {
      toast({ title: 'Duplicate ID', description: `A variable with ID "${cleanId}" already exists`, variant: 'destructive' })
      return
    }

    const newVar = {
      id: cleanId,
      name: cleanName,
      description: cleanDesc,
      type: newVarType,
      value: newVarValue,
      ...(newVarType !== 'number' ? {
        min: newVarMin,
        max: newVarMax,
        step: newVarStep,
      } : {}),
      enabled: true,
    }

    setConfig({
      ...config,
      variables: [...(config.variables || []), newVar],
    })

    // Reset fields
    setNewVarId('var_')
    setNewVarName('')
    setNewVarDesc('')
    setNewVarType('slider')
    setNewVarValue(0.5)
    setNewVarMin(0)
    setNewVarMax(1)
    setNewVarStep(0.05)
    setIsAddVarOpen(false)

    toast({ title: 'Variable added', description: `Successfully added variable "${cleanName}"` })
  }

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim() || !config) return
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, currentConfig: config }),
      })
      if (!res.ok) throw new Error('AI generation failed')
      const data = await res.json()
      setConfig(data)
      toast({ title: 'AI Generation Successful', description: 'Logic rules configuration updated.' })
    } catch (error) {
      toast({ title: 'AI Generation Failed', description: 'Could not generate logic rules from prompt.', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

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

      {/* AI Logic Assistant */}
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">AI Logic Assistant</h4>
            <p className="text-[11px] text-muted-foreground">Describe how you want to adjust the platform logic (e.g., "Enable weekend reduced returns to 15% and increase base skew power to 4")</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Describe your rules modifications..."
            className="bg-muted/50 border-border/50 resize-none h-16 text-xs flex-1 text-foreground"
          />
          <Button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={generating || !aiPrompt.trim()}
            className="sm:self-end bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs h-9"
          >
            {generating ? 'Updating...' : 'Generate with AI'}
          </Button>
        </div>
      </div>

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10 p-3 rounded-lg border border-border/40">
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Logic Variables</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Global variables referenced by rules. Change here, and all linked rules update instantly.</p>
            </div>
            <Dialog open={isAddVarOpen} onOpenChange={setIsAddVarOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700 text-white shrink-0 text-xs h-8">
                  <Plus className="size-3.5" /> Add Variable
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border/50 text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Create Logic Variable</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Define a new parameter to use in platform logic rules or calculations.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Variable ID (Unique Name Slug)</Label>
                    <Input
                      placeholder="e.g. var_custom_multiplier"
                      value={newVarId}
                      onChange={e => setNewVarId(e.target.value)}
                      className="bg-muted/50 border-border/50 text-xs h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Must start with <code className="text-violet-400">var_</code> and contain only lowercase letters, numbers, or underscores.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Name</Label>
                    <Input
                      placeholder="e.g. Custom Multiplier"
                      value={newVarName}
                      onChange={e => setNewVarName(e.target.value)}
                      className="bg-muted/50 border-border/50 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      placeholder="Describe what this variable controls or affects..."
                      value={newVarDesc}
                      onChange={e => setNewVarDesc(e.target.value)}
                      className="bg-muted/50 border-border/50 text-xs resize-none h-16"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Input Type</Label>
                      <select
                        value={newVarType}
                        onChange={e => setNewVarType(e.target.value)}
                        className="w-full bg-muted/50 border border-border/50 text-xs rounded-md h-8 px-2 text-foreground focus:outline-none"
                      >
                        <option value="slider">Slider / Range</option>
                        <option value="number">Direct Number Input</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Initial Value</Label>
                      <Input
                        type="number"
                        step="any"
                        value={newVarValue}
                        onChange={e => setNewVarValue(parseFloat(e.target.value) || 0)}
                        className="bg-muted/50 border-border/50 text-xs h-8"
                      />
                    </div>
                  </div>

                  {newVarType !== 'number' && (
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-muted/30 border border-border/40 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          step="any"
                          value={newVarMin}
                          onChange={e => setNewVarMin(parseFloat(e.target.value) || 0)}
                          className="bg-muted/50 border-border/50 text-[10px] h-7 px-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          step="any"
                          value={newVarMax}
                          onChange={e => setNewVarMax(parseFloat(e.target.value) || 0)}
                          className="bg-muted/50 border-border/50 text-[10px] h-7 px-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Step</Label>
                        <Input
                          type="number"
                          step="any"
                          value={newVarStep}
                          onChange={e => setNewVarStep(parseFloat(e.target.value) || 0.1)}
                          className="bg-muted/50 border-border/50 text-[10px] h-7 px-1.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsAddVarOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddVariable} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                    Create Variable
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(config.variables || []).map((v: any, idx: number) => (
              <Card key={v.id} className={`transition-all duration-200 ${v.enabled !== false ? 'border-violet-500/20 bg-violet-500/5' : 'border-border/30 opacity-60'}`}>
                <CardContent className="p-4 space-y-2 relative">
                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the variable "${v.name}"? Rules depending on this variable might revert to default values.`)) {
                        const vars = (config.variables || []).filter((_: any, i: number) => i !== idx)
                        setConfig({ ...config, variables: vars })
                        toast({ title: 'Variable deleted locally', description: 'Save rules to apply this change to the database.' })
                      }
                    }}
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>

                  <div className="flex items-center justify-between pr-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={v.enabled !== false}
                        onCheckedChange={checked => {
                          const vars = [...(config.variables || [])]
                          vars[idx] = { ...vars[idx], enabled: checked }
                          setConfig({ ...config, variables: vars })
                        }}
                      />
                      <h4 className="text-sm font-semibold">{v.name}</h4>
                    </div>
                    <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30 capitalize">{v.type}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground pr-6">{v.description}</p>
                  
                  <div className="space-y-1 pt-1">
                    {v.min !== undefined && v.max !== undefined && v.type !== 'number' ? (
                      <>
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
                          disabled={v.enabled === false}
                          onChange={e => {
                            const vars = [...(config.variables || [])]
                            vars[idx] = { ...vars[idx], value: parseFloat(e.target.value) || 0 }
                            setConfig({ ...config, variables: vars })
                          }}
                          className="w-full h-2 rounded-full appearance-none bg-violet-500/20 cursor-pointer accent-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px]">Direct Value:</span>
                        <Input
                          type="number"
                          step={v.step || 0.01}
                          value={v.value}
                          disabled={v.enabled === false}
                          onChange={e => {
                            const vars = [...(config.variables || [])]
                            vars[idx] = { ...vars[idx], value: parseFloat(e.target.value) || 0 }
                            setConfig({ ...config, variables: vars })
                          }}
                          className="h-7 text-xs bg-muted/40 border-border/40 w-24 text-right pr-2"
                        />
                      </div>
                    )}
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
