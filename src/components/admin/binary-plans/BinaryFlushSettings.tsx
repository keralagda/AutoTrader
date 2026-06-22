import { Switch } from '@/components/ui/switch'
import { NumberField, SectionCard, HelpTooltip } from '../PlansTab'
import { Flame } from 'lucide-react'
import type { EditablePlan } from '../PlansTab'

export function BinaryFlushSettings({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  return (
    <SectionCard
      icon={<Flame className="h-4 w-4 text-emerald-400" />}
      title="Flush & Volume Balancing Rules"
      description="Configure flush penalties for high leg imbalances"
      helpContent={
        <div className="space-y-1">
          <p>• <strong>Volume Flush Bonus</strong>: Triggers a volume reset when leg imbalances become too wide. This protects the system from holding excessive payout liabilities while awarding a small balancing percentage bonus to the user.</p>
          <p>• <strong>Imbalance Threshold</strong>: The volume difference in USD between left and right legs required to trigger a flush event.</p>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
          <div>
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Enable Volume Flush Bonus</span>
              <HelpTooltip content="If active, excessive leg volume imbalances will be flushed and user will get a smaller payout." />
            </p>
            <p className="text-[10px] text-muted-foreground">Flushes excessive imbalanced volume and awards a smaller payout</p>
          </div>
          <Switch
            checked={plan.binaryFlushBonusEnabled || false}
            onCheckedChange={v => onChange('binaryFlushBonusEnabled', v)}
          />
        </div>

        {plan.binaryFlushBonusEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            <NumberField
              label="Flush Bonus Percentage"
              suffix="%"
              value={plan.binaryFlushBonusPercent || 5}
              onChange={v => onChange('binaryFlushBonusPercent', v)}
              hint="Percentage paid on flushed volume"
              tooltip="The percentage yield paid to the user on flushed volume."
            />
            <NumberField
              label="Imbalance Threshold ($)"
              value={plan.binaryFlushBonusThreshold || 200}
              onChange={v => onChange('binaryFlushBonusThreshold', Math.max(0, Math.round(v)))}
              hint="Trigger flush when difference exceeds this"
              tooltip="The volume discrepancy threshold in USD required between left and right legs to trigger a volume flush."
            />
          </div>
        )}
      </div>
    </SectionCard>
  )
}
