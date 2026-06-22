import { Label } from '@/components/ui/label'
import { NumberField, SectionCard, HelpTooltip } from '../PlansTab'
import { Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePlan } from '../PlansTab'

export function BinarySpilloverSettings({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  return (
    <SectionCard
      icon={<Network className="h-4 w-4 text-emerald-400" />}
      title="Tree Structure & Spillover Settings"
      description="Configure placement strategies and depth limitations"
      helpContent={
        <div className="space-y-1">
          <p>• <strong>Spillover Placement</strong>: Determines where newly sponsored users are placed in the binary tree if not manually specified (e.g. Left Outer Leg, Right Outer Leg, Balanced Subtrees, or Level-by-Level Cycle Fill).</p>
          <p>• <strong>Maximum Tree Depth</strong>: The maximum level depth downline calculations will scan and pay matching volume on (0 = infinite).</p>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <span>Default Spillover Preference</span>
              <HelpTooltip content="Determine where newly sponsored users are placed in the binary tree if placement is not manually specified." />
            </Label>
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
            <NumberField
              label="Maximum Tree Depth"
              value={plan.binaryDepthLimit || 0}
              onChange={v => onChange('binaryDepthLimit', Math.max(0, Math.round(v)))}
              hint="0 = infinite (no limit)"
              tooltip="The maximum level depth downline calculations will scan and pay matching volume on (0 = infinite)."
            />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
