import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChevronDown, ChevronUp, Save, X, Settings } from 'lucide-react'
import { NumberField } from '../PlansTab'
import type { EditablePlan } from '../PlansTab'
import { BinaryBasicInfo } from './BinaryBasicInfo'
import { BinaryPairingSettings } from './BinaryPairingSettings'
import { BinarySpilloverSettings } from './BinarySpilloverSettings'
import { BinaryFlushSettings } from './BinaryFlushSettings'
import { BinaryCycleSettings } from './BinaryCycleSettings'
import { BinaryMlmSettings } from './BinaryMlmSettings'

export function BinaryPlanEditor({
  plan,
  saving,
  onCancel,
  onSave,
  onChange,
}: {
  plan: EditablePlan
  saving: boolean
  onCancel: () => void
  onSave: () => void
  onChange: (id: string, field: keyof EditablePlan, value: any) => void
  onRegenerateField: (id: string, field: 'earningMechanism' | 'withdrawalRule' | 'stackingRule') => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const ch = (field: keyof EditablePlan, value: any) => onChange(plan.id, field, value)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
        <div>
          <h3 className="text-base font-bold text-foreground">Editing Binary MLM Plan</h3>
          <p className="text-xs text-muted-foreground">Configure tree options, pairing rules, and advanced options</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="h-8 text-xs border-border/50 text-muted-foreground hover:text-foreground">
            <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </div>
      </div>

      <BinaryBasicInfo plan={plan} onChange={ch} />
      <BinaryMlmSettings plan={plan} onChange={ch} />
      <BinaryPairingSettings plan={plan} onChange={ch} />
      <BinarySpilloverSettings plan={plan} onChange={ch} />
      <BinaryFlushSettings plan={plan} onChange={ch} />
      <BinaryCycleSettings plan={plan} onChange={ch} />

      {/* Advanced Collapsible Section */}
      <div className="rounded-xl border border-border/50 bg-background/30 p-4 space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-sm font-semibold text-foreground"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-400" />
            <span>Advanced & Investment Settings</span>
          </div>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-border/30 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField label="Min Loss %" suffix="%" value={plan.minLossPercent || 0.1} onChange={v => ch('minLossPercent', v)} />
              <NumberField label="Max Loss %" suffix="%" value={plan.maxLossPercent || 5.0} onChange={v => ch('maxLossPercent', v)} />
              <NumberField label="Max Consecutive Loss Days" value={plan.maxConsecutiveLossDays || 3} onChange={v => ch('maxConsecutiveLossDays', Math.max(1, Math.round(v)))} />
              <NumberField label="Drawdown Limit" suffix="%" value={plan.drawdownLimit ?? 10.0} onChange={v => ch('drawdownLimit', v)} />
              <NumberField label="Profit Target" suffix="%" value={plan.profitTarget ?? 20.0} onChange={v => ch('profitTarget', v)} />
              <NumberField label="Hedging Ratio" suffix="%" value={plan.hedgingRatio ?? 0.0} onChange={v => ch('hedgingRatio', v)} />
              <NumberField label="Lock Period (Days)" suffix="days" value={plan.lockPeriodDays || 0} onChange={v => ch('lockPeriodDays', Math.max(0, Math.round(v)))} />
              <NumberField label="Early Exit Penalty" suffix="%" value={plan.earlyExitPenalty || 0} onChange={v => ch('earlyExitPenalty', v)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
                <div>
                  <p className="text-xs font-semibold">Auto-Compound</p>
                  <p className="text-[10px] text-muted-foreground">Automatically reinvest user earnings</p>
                </div>
                <Switch checked={plan.autoCompound || false} onCheckedChange={v => ch('autoCompound', v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
                <div>
                  <p className="text-xs font-semibold">Allow Negative Balance</p>
                  <p className="text-[10px] text-muted-foreground">User balance can drop below 0</p>
                </div>
                <Switch checked={plan.allowNegativeBalance || false} onCheckedChange={v => ch('allowNegativeBalance', v)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
