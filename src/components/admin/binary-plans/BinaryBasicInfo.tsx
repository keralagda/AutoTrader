import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { NumberField, SectionCard } from '../PlansTab'
import { Info } from 'lucide-react'
import type { EditablePlan } from '../PlansTab'

export function BinaryBasicInfo({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  return (
    <SectionCard icon={<Info className="h-4 w-4 text-emerald-400" />} title="Binary Plan Basic Info">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Plan Name</Label>
          <Input
            value={plan.name}
            onChange={e => onChange('name', e.target.value)}
            placeholder="e.g. Binary Gold, Binary VIP..."
            className="bg-muted/50 border-border/50 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sort Order</Label>
          <Input
            type="number"
            value={plan.sortOrder || 0}
            onChange={e => onChange('sortOrder', Number(e.target.value))}
            className="bg-muted/50 border-border/50 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
        <Textarea
          value={plan.description || ''}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Enter a description for the Binary MLM plan..."
          className="bg-muted/50 border-border/50 text-sm min-h-[60px]"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NumberField label="Entry Fee" prefix="$" value={plan.entryFee} onChange={v => onChange('entryFee', v)} />
        <NumberField label="Min Deposit" prefix="$" value={plan.minDeposit} onChange={v => onChange('minDeposit', v)} />
        <NumberField label="Max Deposit" prefix="$" value={plan.maxDeposit} onChange={v => onChange('maxDeposit', v)} />
        <NumberField label="Daily Earning %" suffix="%" value={plan.dailyEarningPercent} onChange={v => onChange('dailyEarningPercent', v)} />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/20">
        <div>
          <p className="text-xs font-semibold text-foreground">Plan Status</p>
          <p className="text-[10px] text-muted-foreground">Toggle plan active state</p>
        </div>
        <Switch checked={plan.isActive} onCheckedChange={v => onChange('isActive', v)} />
      </div>
    </SectionCard>
  )
}
