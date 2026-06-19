import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  DollarSign,
  Percent,
  Network,
  GitFork,
  ArrowDownRight,
  RotateCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePlan } from '../PlansTab'

function StatBadge({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function BinaryPlanSummary({
  plan,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpand,
  isDeleteTarget,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  plan: EditablePlan
  onEdit: () => void
  onDelete: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  isDeleteTarget: boolean
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}) {
  const pairingText =
    plan.binaryPairingBonusType === 'percent'
      ? `${plan.binaryPairingBonusPercent || 10}%`
      : `$${plan.binaryPairingBonusFixed || 0}`

  const cycleText = plan.binaryCycleEnabled
    ? `Ratio ${plan.binaryCycleRatio || '1:1'} (Pay: ${
        plan.binaryCycleBonusType === 'fixed'
          ? `$${plan.binaryCycleBonusFixed || 0}`
          : `${plan.binaryCycleBonusPercent || 5}%`
      })`
    : 'Disabled'

  return (
    <Card
      className={cn(
        'bg-card/50 border-border/50 hover:border-emerald-500/30 transition-all duration-200',
        isExpanded && 'border-emerald-500/20'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-lg text-foreground">{plan.name || 'Untitled Binary Plan'}</CardTitle>
            <Badge
              variant={plan.isActive ? 'default' : 'secondary'}
              className={
                plan.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {plan.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30">
              <Network className="h-3 w-3 mr-1" /> Binary MLM Plan
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit} className="text-muted-foreground hover:text-emerald-400">
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog open={isDeleteTarget} onOpenChange={open => { if (!open) onDeleteCancel() }}>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onDelete} className="text-muted-foreground hover:text-rose-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{plan.name}&rdquo;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={onDeleteCancel}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <StatBadge label="Entry Fee" value={`$${plan.entryFee.toLocaleString()}`} icon={<DollarSign className="h-3 w-3" />} />
          <StatBadge label="Pairing Bonus" value={pairingText} icon={<GitFork className="h-3 w-3" />} />
          <StatBadge label="Matching Type" value={plan.binaryMatchingType?.replace('_', ' ') || 'Weaker Leg'} icon={<ArrowDownRight className="h-3 w-3" />} />
          <StatBadge label="Placement" value={plan.binarySpilloverPlacement || 'Balanced'} icon={<Network className="h-3 w-3" />} />
          <StatBadge label="Daily Yield" value={`${plan.dailyEarningPercent}%`} icon={<Percent className="h-3 w-3" />} />
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <Separator />
            {plan.description && <p className="text-sm text-muted-foreground italic">&ldquo;{plan.description}&rdquo;</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="h-4 w-4" /> MLM Commission Settings
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Carry Forward</span>
                    <span className="text-foreground font-semibold">{plan.binaryCarryForward !== false ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Depth Limit</span>
                    <span className="text-foreground font-semibold">{plan.binaryDepthLimit ? `${plan.binaryDepthLimit} Levels` : 'Unlimited'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCw className="h-4 w-4" /> Cycle Settings
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Cycle Bonus</span>
                    <span className="text-foreground font-semibold capitalize">{cycleText}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Flush Bonus</span>
                    <span className="text-foreground font-semibold">
                      {plan.binaryFlushBonusEnabled
                        ? `${plan.binaryFlushBonusPercent || 5}% above $${plan.binaryFlushBonusThreshold || 200}`
                        : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-xs space-y-1">
              <span className="font-semibold text-foreground block">Investment Limits & Advanced Rules:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                <div>Min Deposit: <strong className="text-foreground">${plan.minDeposit}</strong></div>
                <div>Max Deposit: <strong className="text-foreground">${plan.maxDeposit}</strong></div>
                <div>Lock-in Days: <strong className="text-foreground">{plan.lockPeriodDays || 0} days</strong></div>
                <div>Auto-Compound: <strong className="text-foreground">{plan.autoCompound ? 'Yes' : 'No'}</strong></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
