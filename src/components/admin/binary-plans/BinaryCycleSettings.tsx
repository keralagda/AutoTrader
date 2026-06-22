import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { NumberField, SectionCard, HelpTooltip } from '../PlansTab'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePlan } from '../PlansTab'

export function BinaryCycleSettings({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  return (
    <SectionCard
      icon={<RefreshCw className="h-4 w-4 text-emerald-400" />}
      title="Cycle Payout Settings"
      description="Configure recurring ratios and completions"
      helpContent={
        <div className="space-y-1">
          <p>• <strong>Binary Cycles</strong>: Pays out structured bonuses when a set ratio of volume is reached on Left vs Right legs (e.g. 1:1, 2:1), instead of standard linear volume pairing.</p>
          <p>• <strong>Cycle Bonus Value</strong>: The percentage rate or fixed amount paid to the user when a cycle is completed.</p>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
          <div>
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Enable Binary Cycles</span>
              <HelpTooltip content="Enable cycle bonus payments when set volume matching ratios are hit." />
            </p>
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
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <span>Required Ratio (Left:Right)</span>
                  <HelpTooltip content="The volume proportions required to qualify for cycle completions (e.g. 1:1, 2:1)." />
                </Label>
                <Input
                  value={plan.binaryCycleRatio || '1:1'}
                  onChange={e => onChange('binaryCycleRatio', e.target.value)}
                  placeholder="e.g. 1:1, 2:1, 1:2"
                  className="bg-muted/50 border-border/50 text-sm h-[38px] mt-1.5"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <span>Cycle Bonus Type</span>
                  <HelpTooltip content="Determine if cycle completion payouts are calculated as a percentage or a flat dollar rate." />
                </Label>
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
                {plan.binaryCycleBonusType === 'fixed' ? (
                  <NumberField
                    label="Cycle Bonus ($)"
                    prefix="$"
                    value={plan.binaryCycleBonusFixed || 0}
                    onChange={v => onChange('binaryCycleBonusFixed', v)}
                    tooltip="Flat dollar amount paid upon completing a cycle."
                  />
                ) : (
                  <NumberField
                    label="Cycle Bonus %"
                    suffix="%"
                    value={plan.binaryCycleBonusPercent || 5}
                    onChange={v => onChange('binaryCycleBonusPercent', v)}
                    tooltip="The percentage paid on cycle volume."
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
