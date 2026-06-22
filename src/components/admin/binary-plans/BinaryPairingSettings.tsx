import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { NumberField, SectionCard, HelpTooltip } from '../PlansTab'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePlan } from '../PlansTab'

export function BinaryPairingSettings({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  return (
    <SectionCard
      icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
      title="Pairing Bonus Settings"
      description="Define matched leg payouts and capping limits"
      helpContent={
        <div className="space-y-1">
          <p>• <strong>Pairing Bonus Type</strong>: Set whether pairing bonuses pay out a percentage of matched leg volume or a fixed flat cash fee.</p>
          <p>• <strong>Matching Type</strong>: Calculate pairs based on the weaker leg volume, both legs combined, or the stronger leg.</p>
          <p>• <strong>Daily/Weekly Cap</strong>: Maximum matching bonus amount a user can earn per day/week to prevent system-wide over-payout.</p>
          <p>• <strong>Carry Forward</strong>: When enabled, unmatched volume is saved and carried forward to the next period instead of being flushed.</p>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <span>Pairing Bonus Type</span>
              <HelpTooltip content="Sets whether pairing payouts are calculated as a percentage of volume or as a flat dollar rate." />
            </Label>
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
            {plan.binaryPairingBonusType === 'percent' ? (
              <NumberField
                label="Pairing Bonus %"
                suffix="%"
                value={plan.binaryPairingBonusPercent || 10}
                onChange={v => onChange('binaryPairingBonusPercent', v)}
                tooltip="The percentage of matched leg volume paid as pairing commissions."
              />
            ) : (
              <NumberField
                label="Pairing Bonus $"
                prefix="$"
                value={plan.binaryPairingBonusFixed || 0}
                onChange={v => onChange('binaryPairingBonusFixed', v)}
                tooltip="The flat dollar amount paid as pairing commissions."
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <span>Matching Type</span>
              <HelpTooltip content="Specifies which leg is used to calculate pairings. Weaker Leg pays on the lower volume leg." />
            </Label>
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
              tooltip="Maximum pairing commission amount a user can earn per day. 0 = unlimited."
            />
            <NumberField
              label="Weekly Cap ($)"
              value={plan.binaryWeeklyPairingCap || 0}
              onChange={v => onChange('binaryWeeklyPairingCap', Math.max(0, Math.round(v)))}
              hint="0 = unlimited"
              tooltip="Maximum pairing commission amount a user can earn per week. 0 = unlimited."
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
          <div>
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Carry Forward Unmatched Volume</span>
              <HelpTooltip content="If enabled, unmatched volume from the stronger leg carries over to the next calculation interval instead of flushing." />
            </p>
            <p className="text-[10px] text-muted-foreground">Unmatched volume carries forward to the next period</p>
          </div>
          <Switch
            checked={plan.binaryCarryForward !== false}
            onCheckedChange={v => onChange('binaryCarryForward', v)}
          />
        </div>
      </div>
    </SectionCard>
  )
}
