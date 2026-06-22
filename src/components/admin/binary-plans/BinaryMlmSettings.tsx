import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Award, Sparkles, Flame, Zap } from 'lucide-react'
import { NumberField, SectionCard } from '../PlansTab'
import type { EditablePlan } from '../PlansTab'

const getDefaultLocalRanks = () => [
  { level: 0, name: 'Member', reqPv: 0, reqBv: 0, reqTv: 0, bonus: 0, perks: 'Access to basic plan' },
  { level: 1, name: 'Executive', reqPv: 100, reqBv: 500, reqTv: 1000, bonus: 50, perks: 'Executive Badge, 5% pairing limit boost' },
  { level: 2, name: 'Manager', reqPv: 500, reqBv: 2500, reqTv: 5000, bonus: 250, perks: 'Manager Badge, 10% pairing limit boost' },
  { level: 3, name: 'Director', reqPv: 2000, reqBv: 10000, reqTv: 20000, bonus: 1000, perks: 'Director Badge, Retreat invite' },
  { level: 4, name: 'President', reqPv: 10000, reqBv: 50000, reqTv: 100000, bonus: 5000, perks: 'President Ring, Luxury car program' },
]

const getDefaultLocalPools = () => [
  { name: 'Leadership Pool', percent: 1, eligibilityMinLevel: 2, enabled: true },
  { name: 'Presidential Pool', percent: 2, eligibilityMinLevel: 4, enabled: true },
]

export function BinaryMlmSettings({
  plan,
  onChange,
}: {
  plan: EditablePlan
  onChange: (field: keyof EditablePlan, value: any) => void
}) {
  const [ranks, setRanks] = useState<any[]>([])
  const [pools, setPools] = useState<any[]>([])
  const [pairingRules, setPairingRules] = useState<any[]>([])

  useEffect(() => {
    try {
      setRanks(plan.mlmRewardsConfig ? JSON.parse(plan.mlmRewardsConfig) : getDefaultLocalRanks())
    } catch {
      setRanks(getDefaultLocalRanks())
    }
    try {
      setPools(plan.mlmPoolsConfig ? JSON.parse(plan.mlmPoolsConfig) : getDefaultLocalPools())
    } catch {
      setPools(getDefaultLocalPools())
    }
    setPairingRules(plan.pairingRules || [])
  }, [plan.mlmRewardsConfig, plan.mlmPoolsConfig, plan.pairingRules])

  const updateRanks = (newRanks: any[]) => {
    setRanks(newRanks)
    onChange('mlmRewardsConfig', JSON.stringify(newRanks))
  }

  const updatePools = (newPools: any[]) => {
    setPools(newPools)
    onChange('mlmPoolsConfig', JSON.stringify(newPools))
  }

  const updatePairingRules = (newRules: any[]) => {
    setPairingRules(newRules)
    onChange('pairingRules', newRules)
  }

  return (
    <SectionCard 
      icon={<Award className="h-4 w-4 text-emerald-400" />} 
      title="Advanced Dual-Team Synergy Leadership & Volume Ratios"
      helpContent={
        <div className="space-y-1">
          <p>• <strong>PV, BV, TV Ratios</strong>: Point multiplier factors per dollar invested. PV (Personal Volume), BV (Business/Direct Sponsor Volume), and TV (Team downline Volume).</p>
          <p>• <strong>Leadership Ranks</strong>: Set volume thresholds (PV, BV, TV) required to rank up, and define the rank bonus cash reward and custom perks.</p>
          <p>• <strong>Bonus Pools</strong>: Configure company profit sharing pools that distribute global volume percentages to qualified rank tiers.</p>
          <p>• <strong>Pairing Rules</strong>: Setup level-by-level pair bonuses, requirements, and ratios.</p>
        </div>
      }
    >
      {/* Ratios */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 rounded-lg bg-muted/20 border border-border/40">
        <NumberField label="PV Ratio (Personal Volume)" value={plan.binaryPvRatio ?? 1.0} onChange={v => onChange('binaryPvRatio', v)} />
        <NumberField label="BV Ratio (Business Volume)" value={plan.binaryBvRatio ?? 1.0} onChange={v => onChange('binaryBvRatio', v)} />
        <NumberField label="TV Ratio (Team Volume)" value={plan.binaryTvRatio ?? 1.0} onChange={v => onChange('binaryTvRatio', v)} />
      </div>

      {/* Level Pairing Rules */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-400" /> LEVEL-BY-LEVEL PAIR BONUSES
          </Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-muted-foreground select-none">
              <input 
                type="checkbox" 
                checked={!!plan.showPairingRulesInPlanDetails} 
                onChange={e => onChange('showPairingRulesInPlanDetails', e.target.checked)} 
                className="rounded border-border/40 text-emerald-500 bg-background/50 h-3.5 w-3.5"
              />
              Show in public plan cards
            </label>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updatePairingRules([...pairingRules, { levelRange: `${pairingRules.length + 1}`, ratio: '100:100', bonusType: 'percent', bonusValue: 10.0, minDirectLeft: 0, minDirectRight: 0, minPersonalIv: 0.0, minTeamTv: 0.0, perks: '' }])}>
              <Plus className="h-3 w-3 mr-1" /> Add Rule
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border border-border/40 rounded-lg">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border/40">
              <tr>
                <th className="p-2">Lvl Range</th>
                <th className="p-2">Ratio</th>
                <th className="p-2">Type</th>
                <th className="p-2">Bonus</th>
                <th className="p-2">Min Direct L/R</th>
                <th className="p-2">Min Personal IV</th>
                <th className="p-2">Min Team TV</th>
                <th className="p-2">Perks</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {pairingRules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-muted-foreground italic">
                    No custom pairing rules configured. System will use standard plan settings.
                  </td>
                </tr>
              ) : (
                pairingRules.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="p-1.5">
                      <Input className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.levelRange} onChange={e => { const u = [...pairingRules]; u[i].levelRange = e.target.value; updatePairingRules(u); }} placeholder="e.g. 1" />
                    </td>
                    <td className="p-1.5">
                      <select className="h-7 text-[11px] bg-background/50 border border-border rounded p-1 text-foreground" value={r.ratio} onChange={e => { const u = [...pairingRules]; u[i].ratio = e.target.value; updatePairingRules(u); }}>
                        <option value="100:100">100:100</option>
                        <option value="100:200">100:200</option>
                        <option value="200:100">200:100</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <select className="h-7 text-[11px] bg-background/50 border border-border rounded p-1 text-foreground" value={r.bonusType} onChange={e => { const u = [...pairingRules]; u[i].bonusType = e.target.value; updatePairingRules(u); }}>
                        <option value="percent">Percent (%)</option>
                        <option value="fixed">Fixed ($)</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.bonusValue} onChange={e => { const u = [...pairingRules]; u[i].bonusValue = Number(e.target.value); updatePairingRules(u); }} />
                    </td>
                    <td className="p-1.5">
                      <div className="flex gap-1 items-center">
                        <Input type="number" className="w-10 h-7 text-[11px] p-1 bg-background/50" value={r.minDirectLeft} onChange={e => { const u = [...pairingRules]; u[i].minDirectLeft = Number(e.target.value); updatePairingRules(u); }} placeholder="L" />
                        <Input type="number" className="w-10 h-7 text-[11px] p-1 bg-background/50" value={r.minDirectRight} onChange={e => { const u = [...pairingRules]; u[i].minDirectRight = Number(e.target.value); updatePairingRules(u); }} placeholder="R" />
                      </div>
                    </td>
                    <td className="p-1.5">
                      <Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.minPersonalIv} onChange={e => { const u = [...pairingRules]; u[i].minPersonalIv = Number(e.target.value); updatePairingRules(u); }} />
                    </td>
                    <td className="p-1.5">
                      <Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.minTeamTv} onChange={e => { const u = [...pairingRules]; u[i].minTeamTv = Number(e.target.value); updatePairingRules(u); }} />
                    </td>
                    <td className="p-1.5">
                      <Input className="min-w-[100px] h-7 text-[11px] p-1 bg-background/50" value={r.perks} onChange={e => { const u = [...pairingRules]; u[i].perks = e.target.value; updatePairingRules(u); }} placeholder="e.g. VIP Badge" />
                    </td>
                    <td className="p-1.5 text-right">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300" onClick={() => updatePairingRules(pairingRules.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranks table */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-purple-400" /> LEADERSHIP RANKS & REWARDS</Label>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateRanks([...ranks, { level: ranks.length, name: `Rank ${ranks.length}`, reqPv: 1000, reqBv: 5000, reqTv: 10000, bonus: 500, perks: 'Extra perks' }])}>
            <Plus className="h-3 w-3 mr-1" /> Add Rank
          </Button>
        </div>
        <div className="overflow-x-auto border border-border/40 rounded-lg">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border/40">
              <tr>
                <th className="p-2">Lvl</th><th className="p-2">Rank Name</th><th className="p-2">Req PV</th><th className="p-2">Req BV</th><th className="p-2">Req TV</th><th className="p-2">Bonus ($)</th><th className="p-2">Perks</th><th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {ranks.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="p-1.5"><Input type="number" className="w-10 h-7 text-[11px] p-1 bg-background/50" value={r.level} onChange={e => { const u = [...ranks]; u[i].level = Number(e.target.value); updateRanks(u); }} /></td>
                  <td className="p-1.5"><Input className="w-20 h-7 text-[11px] p-1 bg-background/50" value={r.name} onChange={e => { const u = [...ranks]; u[i].name = e.target.value; updateRanks(u); }} /></td>
                  <td className="p-1.5"><Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.reqPv} onChange={e => { const u = [...ranks]; u[i].reqPv = Number(e.target.value); updateRanks(u); }} /></td>
                  <td className="p-1.5"><Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.reqBv} onChange={e => { const u = [...ranks]; u[i].reqBv = Number(e.target.value); updateRanks(u); }} /></td>
                  <td className="p-1.5"><Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.reqTv} onChange={e => { const u = [...ranks]; u[i].reqTv = Number(e.target.value); updateRanks(u); }} /></td>
                  <td className="p-1.5"><Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={r.bonus} onChange={e => { const u = [...ranks]; u[i].bonus = Number(e.target.value); updateRanks(u); }} /></td>
                  <td className="p-1.5"><Input className="min-w-[120px] h-7 text-[11px] p-1 bg-background/50" value={r.perks} onChange={e => { const u = [...ranks]; u[i].perks = e.target.value; updateRanks(u); }} /></td>
                  <td className="p-1.5 text-right"><Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300" onClick={() => updateRanks(ranks.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pools table */}
      <div className="space-y-2 pt-2 border-t border-border/30">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-amber-400" /> LEADERSHIP BONUS POOLS</Label>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updatePools([...pools, { name: `Pool ${pools.length + 1}`, percent: 1, eligibilityMinLevel: 1, enabled: true }])}>
            <Plus className="h-3 w-3 mr-1" /> Add Pool
          </Button>
        </div>
        <div className="overflow-x-auto border border-border/40 rounded-lg">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[9px] tracking-wider border-b border-border/40">
              <tr>
                <th className="p-2">Pool Name</th><th className="p-2">Alloc (%)</th><th className="p-2">Min Rank Lvl</th><th className="p-2">Enabled</th><th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {pools.map((p, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="p-1.5"><Input className="w-40 h-7 text-[11px] p-1 bg-background/50" value={p.name} onChange={e => { const u = [...pools]; u[i].name = e.target.value; updatePools(u); }} /></td>
                  <td className="p-1.5"><Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={p.percent} onChange={e => { const u = [...pools]; u[i].percent = Number(e.target.value); updatePools(u); }} /></td>
                  <td className="p-1.5"><Input type="number" className="w-16 h-7 text-[11px] p-1 bg-background/50" value={p.eligibilityMinLevel} onChange={e => { const u = [...pools]; u[i].eligibilityMinLevel = Number(e.target.value); updatePools(u); }} /></td>
                  <td className="p-1.5">
                    <input type="checkbox" checked={p.enabled} onChange={e => { const u = [...pools]; u[i].enabled = e.target.checked; updatePools(u); }} className="rounded border-border/40 text-emerald-500 bg-background/50 h-3.5 w-3.5" />
                  </td>
                  <td className="p-1.5 text-right"><Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300" onClick={() => updatePools(pools.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  )
}
