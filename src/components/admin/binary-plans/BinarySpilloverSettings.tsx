import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { NumberField, SectionCard } from '../PlansTab'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePlan } from '../PlansTab'

export function BinarySpilloverSettings({
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
      title="Tree Structure & Spillover Settings"
      description="Configure placement strategies and depth limitations"
    >
      {expanded && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Default Spillover Preference</Label>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'left', label: 'Left Outer Leg' },
                  { value: 'right', label: 'Right Outer Leg' },
                  { value: 'balanced', label: 'Balanced Subtrees' },
                  { value: 'cycle_fill', label: 'Level-by-Level' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange('binarySpilloverPlacement', opt.value)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all whitespace-nowrap",
                      plan.binarySpilloverPlacement === opt.value
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Binary Depth Limit</Label>
              <NumberField
                label="Maximum Tree Depth"
                value={plan.binaryDepthLimit || 0}
                onChange={v => onChange('binaryDepthLimit', Math.max(0, Math.round(v)))}
                hint="0 = infinite (no limit)"
              />
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
