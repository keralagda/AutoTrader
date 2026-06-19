import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { NumberField, SectionCard } from '../PlansTab'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePlan } from '../PlansTab'

export function BinaryPairingSettings({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <SectionCard
      icon={
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4 text-emerald-400" /> : <ChevronDown className="h-4 w-4 text-emerald-400" />}
        </div>
      }
      title="Pairing Bonus Settings"
      description="Define matched leg payouts and capping limits"
    >
      {expanded && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pairing Bonus Type</Label>
              <div className="flex gap-1.5">
                {[
                  { value: 'percent', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed Amount' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange('binaryPairingBonusType', opt.value)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all",
                      plan.binaryPairingBonusType === opt.value
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "border-border/50 text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pairing Bonus Value</Label>
              {plan.binaryPairingBonusType === 'percent' ? (
                <NumberField
                  label="Pairing Bonus %"
                  suffix="%"
                  value={plan.binaryPairingBonusPercent || 10}
                  onChange={v => onChange('binaryPairingBonusPercent', v)}
                />
              ) : (
                <NumberField
                  label="Pairing Bonus $"
                  prefix="$"
                  value={plan.binaryPairingBonusFixed || 0}
                  onChange={v => onChange('binaryPairingBonusFixed', v)}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Matching Type</Label>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'weaker_leg', label: 'Weaker Leg' },
                  { value: 'both_legs', label: 'Both Legs' },
                  { value: 'stronger_leg', label: 'Stronger Leg' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange('binaryMatchingType', opt.value)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all whitespace-nowrap",
                      plan.binaryMatchingType === opt.value
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "border-border/50 text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Daily Cap ($)"
                value={plan.binaryDailyPairingCap || 0}
                onChange={v => onChange('binaryDailyPairingCap', Math.max(0, Math.round(v)))}
                hint="0 = unlimited"
              />
              <NumberField
                label="Weekly Cap ($)"
                value={plan.binaryWeeklyPairingCap || 0}
                onChange={v => onChange('binaryWeeklyPairingCap', Math.max(0, Math.round(v)))}
                hint="0 = unlimited"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
            <div>
              <p className="text-xs font-semibold text-foreground">Carry Forward Unmatched Volume</p>
              <p className="text-[10px] text-muted-foreground">Unmatched volume carries forward to the next period</p>
            </div>
            <Switch
              checked={plan.binaryCarryForward !== false}
              onCheckedChange={v => onChange('binaryCarryForward', v)}
            />
          </div>
        </div>
      )}
    </SectionCard>
  )
}
