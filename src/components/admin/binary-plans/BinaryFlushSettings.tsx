import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { NumberField, SectionCard } from '../PlansTab'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { EditablePlan } from '../PlansTab'

export function BinaryFlushSettings({
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
      title="Flush & Volume Balancing Rules"
      description="Configure flush penalties for high leg imbalances"
    >
      {expanded && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
            <div>
              <p className="text-xs font-semibold text-foreground">Enable Volume Flush Bonus</p>
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
              />
              <NumberField
                label="Imbalance Threshold ($)"
                value={plan.binaryFlushBonusThreshold || 200}
                onChange={v => onChange('binaryFlushBonusThreshold', Math.max(0, Math.round(v)))}
                hint="Trigger flush when difference exceeds this"
              />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}
