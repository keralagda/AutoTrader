import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { NumberField, SectionCard } from '../PlansTab'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePlan } from '../PlansTab'

export function BinaryCycleSettings({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <SectionCard
      icon={
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4 text-emerald-400" /> : <ChevronDown className="h-4 w-4 text-emerald-400" />}
        </div>
      }
      title="Cycle Payout Settings"
      description="Configure recurring ratios and completions"
    >
      {expanded && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
            <div>
              <p className="text-xs font-semibold text-foreground">Enable Binary Cycles</p>
              <p className="text-[10px] text-muted-foreground">Trigger cycle bonuses when specific leg ratios are met</p>
            </div>
            <Switch
              checked={plan.binaryCycleEnabled || false}
              onCheckedChange={v => onChange('binaryCycleEnabled', v)}
            />
          </div>

          {plan.binaryCycleEnabled && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Required Ratio (Left:Right)</Label>
                  <Input
                    value={plan.binaryCycleRatio || '1:1'}
                    onChange={e => onChange('binaryCycleRatio', e.target.value)}
                    placeholder="e.g. 1:1, 2:1, 1:2"
                    className="bg-muted/50 border-border/50 text-sm h-[38px] mt-1.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cycle Bonus Type</Label>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'percent', label: 'Percentage' },
                      { value: 'fixed', label: 'Fixed Amount' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange('binaryCycleBonusType', opt.value)}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all",
                          plan.binaryCycleBonusType === opt.value
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "border-border/50 text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cycle Bonus Value</Label>
                  {plan.binaryCycleBonusType === 'fixed' ? (
                    <NumberField
                      label="Cycle Bonus ($)"
                      prefix="$"
                      value={plan.binaryCycleBonusFixed || 0}
                      onChange={v => onChange('binaryCycleBonusFixed', v)}
                    />
                  ) : (
                    <NumberField
                      label="Cycle Bonus %"
                      suffix="%"
                      value={plan.binaryCycleBonusPercent || 5}
                      onChange={v => onChange('binaryCycleBonusPercent', v)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}
