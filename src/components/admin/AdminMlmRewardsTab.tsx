'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Award, Trophy, Users, ShieldAlert, Sparkles, Gift, Send, 
  Search, ArrowRight, ShieldCheck, RefreshCw, Layers, Settings, Save, Trash2, Plus 
} from 'lucide-react'

// Default fallback ranks if none loaded
const defaultRanks = [
  { level: 0, name: 'Member', reqPv: 0, reqBv: 0, reqTv: 0, bonus: 0, perks: 'Access to basic plan', reqMinPersonalInvestment: 0, reqLeftVolume: 0, reqRightVolume: 0, reqWeakerLegVolume: 0, reqDirectReferrals: 0, reqActiveDirects: 0, reqDirectsWithMinRankLevel: 0, reqDirectsWithMinRankCount: 0, gift: 'None' },
  { level: 1, name: 'Executive', reqPv: 100, reqBv: 500, reqTv: 1000, bonus: 50, perks: 'Executive Badge, 5% pairing limit boost', reqMinPersonalInvestment: 100, reqLeftVolume: 500, reqRightVolume: 500, reqWeakerLegVolume: 0, reqDirectReferrals: 0, reqActiveDirects: 0, reqDirectsWithMinRankLevel: 0, reqDirectsWithMinRankCount: 0, gift: 'Nova Executive Writing Pen & Official Executive Badge' },
  { level: 2, name: 'Manager', reqPv: 500, reqBv: 2500, reqTv: 5000, bonus: 250, perks: 'Manager Badge, 10% pairing limit boost', reqMinPersonalInvestment: 250, reqLeftVolume: 2000, reqRightVolume: 2000, reqWeakerLegVolume: 0, reqDirectReferrals: 0, reqActiveDirects: 2, reqDirectsWithMinRankLevel: 0, reqDirectsWithMinRankCount: 0, gift: 'Montblanc Business Writing Set & Leadership Plaque' },
  { level: 3, name: 'Director', reqPv: 2000, reqBv: 10000, reqTv: 20000, bonus: 1000, perks: 'Director Badge, Retreat invite', reqMinPersonalInvestment: 1000, reqLeftVolume: 10000, reqRightVolume: 10000, reqWeakerLegVolume: 0, reqDirectReferrals: 0, reqActiveDirects: 4, reqDirectsWithMinRankLevel: 1, reqDirectsWithMinRankCount: 2, gift: 'Exclusive Leadership Retreat Invite & 18k Gold VIP Badge' },
  { level: 4, name: 'President', reqPv: 10000, reqBv: 50000, reqTv: 100000, bonus: 5000, perks: 'President Ring, Luxury car program', reqMinPersonalInvestment: 2500, reqLeftVolume: 50000, reqRightVolume: 50000, reqWeakerLegVolume: 0, reqDirectReferrals: 0, reqActiveDirects: 6, reqDirectsWithMinRankLevel: 2, reqDirectsWithMinRankCount: 2, gift: '18K Gold President Signet Ring & Luxury Car Program Eligibility' },
]

export function AdminMlmRewardsTab() {
  const { toast } = useToast()
  
  // Data State
  const [plans, setPlans] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [dispatchLedger, setDispatchLedger] = useState<Record<string, any>>({})
  
  // UI & Loading State
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [ranksConfig, setRanksConfig] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingLedger, setSavingLedger] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null)
  
  // Ranks configuration local edit tracking
  const [editingRanks, setEditingRanks] = useState<any[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/mlm-rewards')
      if (!res.ok) throw new Error('Failed to load MLM Ranks & Rewards data')
      const data = await res.json()
      
      setPlans(data.plans || [])
      setUsers(data.users || [])
      setDispatchLedger(data.dispatchLedger || {})
      
      // Select the first binary plan by default
      const binaryPlan = data.plans?.find((p: any) => p.isBinaryMlmEnabled)
      if (binaryPlan) {
        setSelectedPlanId(binaryPlan.id)
        parseRanksConfig(binaryPlan)
      } else if (data.plans?.length > 0) {
        setSelectedPlanId(data.plans[0].id)
        parseRanksConfig(data.plans[0])
      }
    } catch (err: any) {
      toast({ title: 'Load Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const parseRanksConfig = (plan: any) => {
    if (!plan) return
    try {
      const parsed = plan.mlmRewardsConfig ? JSON.parse(plan.mlmRewardsConfig) : defaultRanks
      setRanksConfig(parsed)
      setEditingRanks(parsed)
    } catch {
      setRanksConfig(defaultRanks)
      setEditingRanks(defaultRanks)
    }
  }

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId)
    const plan = plans.find(p => p.id === planId)
    parseRanksConfig(plan)
  }

  // Save modified ranks configs to Plan
  const handleSaveRanksConfig = async () => {
    if (!selectedPlanId) return
    setSavingConfig(true)
    try {
      // 1. Fetch current plan configuration to preserve other parameters
      const planRes = await fetch(`/api/admin/plans`)
      if (!planRes.ok) throw new Error('Failed to fetch plan list')
      const plansList = await planRes.json()
      const targetPlan = plansList.find((p: any) => p.id === selectedPlanId)
      
      if (!targetPlan) throw new Error('Plan not found')
      
      // Update plan mlmRewardsConfig field
      targetPlan.mlmRewardsConfig = JSON.stringify(editingRanks)
      
      const updateRes = await fetch(`/api/admin/plans`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan })
      })
      
      if (!updateRes.ok) throw new Error('Failed to update plan ranks config')
      
      toast({ title: 'Config Saved', description: 'Ranks requirements updated successfully.' })
      
      // Reload local data state
      loadData()
    } catch (err: any) {
      toast({ title: 'Save Config Error', description: err.message, variant: 'destructive' })
    } finally {
      setSavingConfig(false)
    }
  }

  // Add a new rank level
  const handleAddRank = () => {
    const nextLevel = editingRanks.length
    const newRank = {
      level: nextLevel,
      name: `Rank ${nextLevel}`,
      reqPv: 1000,
      reqBv: 5000,
      reqTv: 10000,
      reqLeftVolume: 0,
      reqRightVolume: 0,
      reqWeakerLegVolume: 0,
      reqMinPersonalInvestment: 0,
      reqDirectReferrals: 0,
      reqActiveDirects: 0,
      reqDirectsWithMinRankLevel: 0,
      reqDirectsWithMinRankCount: 0,
      bonus: 500,
      gift: 'Physical Gift Details',
      perks: 'Other perks...'
    }
    setEditingRanks([...editingRanks, newRank])
  }

  // Delete a rank level
  const handleDeleteRank = (idx: number) => {
    const updated = editingRanks.filter((_, i) => i !== idx).map((r, i) => ({ ...r, level: i }))
    setEditingRanks(updated)
  }

  // User rank operations (reevaluate / override)
  const handleReevaluateRank = async (userId: string) => {
    setUserActionLoading(userId)
    try {
      const res = await fetch('/api/admin/mlm-rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reevaluate', userId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to check rank')
      
      toast({ title: 'Re-evaluation Complete', description: data.message })
      loadData()
    } catch (err: any) {
      toast({ title: 'Check Failed', description: err.message, variant: 'destructive' })
    } finally {
      setUserActionLoading(null)
    }
  }

  const handleManualOverride = async (userId: string, newRankName: string, newRankLevel: number) => {
    setUserActionLoading(userId)
    try {
      const res = await fetch('/api/admin/mlm-rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'overrideRank', userId, newRankName, newRankLevel })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to override rank')
      
      toast({ title: 'Rank Overridden', description: data.message })
      loadData()
    } catch (err: any) {
      toast({ title: 'Override Failed', description: err.message, variant: 'destructive' })
    } finally {
      setUserActionLoading(null)
    }
  }

  // Dispatch Ledger status save
  const handleSaveDispatchLedger = async (userRewardKey: string, status: string, trackingNumber: string, notes: string) => {
    setSavingLedger(true)
    try {
      const updatedLedger = { ...dispatchLedger }
      updatedLedger[userRewardKey] = {
        status,
        trackingNumber: trackingNumber.trim(),
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      }
      
      const res = await fetch('/api/admin/mlm-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledger: updatedLedger })
      })
      if (!res.ok) throw new Error('Failed to save dispatch statuses')
      
      setDispatchLedger(updatedLedger)
      toast({ title: 'Ledger Updated', description: 'Dispatch state saved successfully.' })
    } catch (err: any) {
      toast({ title: 'Ledger Save Error', description: err.message, variant: 'destructive' })
    } finally {
      setSavingLedger(false)
    }
  }

  // Filtered users matching search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.mlmRank.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Generate list of unlocked rewards from users ranking history
  const activeRewardClaims: any[] = []
  users.forEach(user => {
    // Collect all levels the user has reached (everything from Level 1 up to user's mlmLevel)
    if (user.mlmLevel > 0) {
      for (let lvl = 1; lvl <= user.mlmLevel; lvl++) {
        const rank = ranksConfig.find(r => r.level === lvl)
        if (rank && rank.gift && rank.gift !== 'None') {
          const key = `${user.id}_lvl_${lvl}`
          const dispatch = dispatchLedger[key] || { status: 'Pending', trackingNumber: '', notes: '' }
          activeRewardClaims.push({
            key,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            rankName: rank.name,
            rankLevel: lvl,
            gift: rank.gift,
            bonus: rank.bonus,
            status: dispatch.status,
            trackingNumber: dispatch.trackingNumber,
            notes: dispatch.notes
          })
        }
      }
    }
  })

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading Ranks & Reward Management Console...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-emerald-400" /> MLM Leadership Ranks & Reward Management
        </h1>
        <p className="text-muted-foreground text-sm">Configure advanced rank requirements, override member ranks, and track physical gift dispatches.</p>
      </div>

      {/* Overview Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Network Members</p>
              <p className="text-xl font-bold font-mono">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Trophy className="size-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Ranked Leaders (Lvl 1+)</p>
              <p className="text-xl font-bold font-mono">{users.filter(u => u.mlmLevel > 0).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Gift className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Rewards Claimed</p>
              <p className="text-xl font-bold font-mono">{activeRewardClaims.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <ShieldAlert className="size-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Pending Dispatches</p>
              <p className="text-xl font-bold font-mono text-rose-400">{activeRewardClaims.filter(c => c.status === 'Pending').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranks Requirement Config Editor */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-1.5 text-purple-400">
                <Settings className="h-4 w-4" /> 1. Configuration: Ranks & Advanced Specifications
              </CardTitle>
              <CardDescription className="text-[11px]">Select a binary plan to edit its rank upgrade constraints.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold whitespace-nowrap text-muted-foreground">Active Plan:</Label>
              <select 
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="bg-background text-xs text-foreground h-8 rounded border border-border/50 px-2 min-w-[180px] focus:outline-none"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.isBinaryMlmEnabled ? ' (Binary Active)' : ''}</option>
                ))}
              </select>
              <Button 
                size="sm" 
                className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                onClick={handleSaveRanksConfig}
                disabled={savingConfig}
              >
                {savingConfig ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {editingRanks.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No ranks configured for this plan. Click "Add Rank" to define one.</div>
          ) : (
            <table className="w-full text-left text-[11px] min-w-[1200px]">
              <thead className="bg-muted/40 uppercase tracking-widest text-[9px] text-muted-foreground border-b border-border/40 font-mono">
                <tr>
                  <th className="p-3 w-12">Lvl</th>
                  <th className="p-3 w-28">Rank Name</th>
                  <th className="p-3">Req PV / BV / TV</th>
                  <th className="p-3">Req Leg Vol (Left / Right / Weaker)</th>
                  <th className="p-3">Req Investment (Min Active / Plan)</th>
                  <th className="p-3">Req Directs (All / Active)</th>
                  <th className="p-3">Req Directs Ranks (Min Lvl / Count)</th>
                  <th className="p-3 w-20">Cash ($)</th>
                  <th className="p-3 w-48">Physical Gift / Incentive</th>
                  <th className="p-3 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {editingRanks.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/10 align-middle">
                    {/* Level */}
                    <td className="p-2 pl-3">
                      <Input 
                        type="number" 
                        value={r.level} 
                        onChange={(e) => {
                          const val = [...editingRanks]; val[i].level = Number(e.target.value); setEditingRanks(val);
                        }} 
                        className="w-9 h-7 text-[11px] p-1 text-center bg-background/40"
                      />
                    </td>
                    
                    {/* Name */}
                    <td className="p-2">
                      <Input 
                        value={r.name} 
                        onChange={(e) => {
                          const val = [...editingRanks]; val[i].name = e.target.value; setEditingRanks(val);
                        }} 
                        className="w-24 h-7 text-[11px] p-1 font-semibold text-foreground bg-background/40"
                      />
                    </td>
                    
                    {/* Basic Volumes */}
                    <td className="p-2 space-y-1">
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-7">PV:</span>
                        <Input type="number" value={r.reqPv} onChange={e => { const u = [...editingRanks]; u[i].reqPv = Number(e.target.value); setEditingRanks(u); }} className="w-16 h-6 text-[10px] p-0.5 bg-background/40" />
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-7">BV:</span>
                        <Input type="number" value={r.reqBv} onChange={e => { const u = [...editingRanks]; u[i].reqBv = Number(e.target.value); setEditingRanks(u); }} className="w-16 h-6 text-[10px] p-0.5 bg-background/40" />
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-7">TV:</span>
                        <Input type="number" value={r.reqTv} onChange={e => { const u = [...editingRanks]; u[i].reqTv = Number(e.target.value); setEditingRanks(u); }} className="w-16 h-6 text-[10px] p-0.5 bg-background/40" />
                      </div>
                    </td>

                    {/* Binary Leg Volumes */}
                    <td className="p-2 space-y-1">
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-emerald-400 font-mono w-7">Left:</span>
                        <Input type="number" value={r.reqLeftVolume ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqLeftVolume = Number(e.target.value); setEditingRanks(u); }} className="w-16 h-6 text-[10px] p-0.5 bg-background/40" />
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-cyan-400 font-mono w-7">Right:</span>
                        <Input type="number" value={r.reqRightVolume ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqRightVolume = Number(e.target.value); setEditingRanks(u); }} className="w-16 h-6 text-[10px] p-0.5 bg-background/40" />
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-amber-400 font-mono w-7">Weak:</span>
                        <Input type="number" value={r.reqWeakerLegVolume ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqWeakerLegVolume = Number(e.target.value); setEditingRanks(u); }} className="w-16 h-6 text-[10px] p-0.5 bg-background/40" />
                      </div>
                    </td>

                    {/* Investment Plan Specifications */}
                    <td className="p-2 space-y-1">
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-9">Min Active:</span>
                        <Input type="number" value={r.reqMinPersonalInvestment ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqMinPersonalInvestment = Number(e.target.value); setEditingRanks(u); }} className="w-16 h-6 text-[10px] p-0.5 bg-background/40" />
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-9">Plan ID:</span>
                        <Input placeholder="e.g. nova-royale" value={r.reqRequiredPlanId ?? ''} onChange={e => { const u = [...editingRanks]; u[i].reqRequiredPlanId = e.target.value; setEditingRanks(u); }} className="w-20 h-6 text-[10px] p-0.5 bg-background/40 font-mono" />
                      </div>
                    </td>

                    {/* Referrals */}
                    <td className="p-2 space-y-1">
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-10">Directs:</span>
                        <Input type="number" value={r.reqDirectReferrals ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqDirectReferrals = Number(e.target.value); setEditingRanks(u); }} className="w-10 h-6 text-[10px] p-0.5 bg-background/40 text-center" />
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-10">Active Dir:</span>
                        <Input type="number" value={r.reqActiveDirects ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqActiveDirects = Number(e.target.value); setEditingRanks(u); }} className="w-10 h-6 text-[10px] p-0.5 bg-background/40 text-center" />
                      </div>
                    </td>

                    {/* Referrals Rank level requirements */}
                    <td className="p-2 space-y-1">
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-12">Min Rank Lvl:</span>
                        <Input type="number" value={r.reqDirectsWithMinRankLevel ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqDirectsWithMinRankLevel = Number(e.target.value); setEditingRanks(u); }} className="w-10 h-6 text-[10px] p-0.5 bg-background/40 text-center" />
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[9px] text-muted-foreground font-mono w-12">Required Qty:</span>
                        <Input type="number" value={r.reqDirectsWithMinRankCount ?? 0} onChange={e => { const u = [...editingRanks]; u[i].reqDirectsWithMinRankCount = Number(e.target.value); setEditingRanks(u); }} className="w-10 h-6 text-[10px] p-0.5 bg-background/40 text-center" />
                      </div>
                    </td>

                    {/* Cash Bonus */}
                    <td className="p-2">
                      <Input 
                        type="number" 
                        value={r.bonus} 
                        onChange={e => { const u = [...editingRanks]; u[i].bonus = Number(e.target.value); setEditingRanks(u); }}
                        className="w-14 h-7 text-[11px] p-1 font-mono text-emerald-400 font-bold bg-background/40"
                      />
                    </td>

                    {/* Gift Incentive */}
                    <td className="p-2 space-y-1">
                      <Input 
                        value={r.gift ?? ''} 
                        placeholder="🎁 Physical Incentive..."
                        onChange={e => { const u = [...editingRanks]; u[i].gift = e.target.value; setEditingRanks(u); }}
                        className="w-44 h-7 text-[11px] p-1 text-foreground/80 bg-background/40"
                      />
                      <Input 
                        value={r.perks ?? ''} 
                        placeholder="⚡ Extra Perks..."
                        onChange={e => { const u = [...editingRanks]; u[i].perks = e.target.value; setEditingRanks(u); }}
                        className="w-44 h-6 text-[10px] p-1 text-muted-foreground bg-background/40"
                      />
                    </td>

                    {/* Action */}
                    <td className="p-2 text-right pr-4">
                      {r.level === 0 ? (
                        <span className="text-[9px] font-mono text-muted-foreground italic px-2">Default</span>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          onClick={() => handleDeleteRank(i)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          <div className="p-3 bg-muted/20 border-t border-border/40 flex justify-start">
            <Button size="sm" variant="outline" className="h-7 text-xs text-foreground bg-background/50" onClick={handleAddRank}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add New Leadership Rank
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Rank Management and Override Grid */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-1.5 text-cyan-400">
                <Users className="h-4 w-4" /> 2. Ranks & Qualifications Console
              </CardTitle>
              <CardDescription className="text-[11px]">Monitor network members eligibility metrics, force check conditions, or manually override ranks.</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background/50 border-border/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No users matching search queries.</div>
          ) : (
            <table className="w-full text-left text-[11px] min-w-[1000px]">
              <thead className="bg-muted/40 uppercase tracking-widest text-[9px] text-muted-foreground border-b border-border/40 font-mono">
                <tr>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Current MLM Rank</th>
                  <th className="p-3">PV / BV / TV</th>
                  <th className="p-3">Leg Volumes (Left / Right)</th>
                  <th className="p-3">Min Active Investment</th>
                  <th className="p-3">Directs (Total / Active)</th>
                  <th className="p-3 text-right pr-4">Action Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 font-medium">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/10">
                    {/* User & Email */}
                    <td className="p-3">
                      <p className="font-bold text-foreground">{user.name}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{user.email}</p>
                    </td>
                    
                    {/* Current Rank */}
                    <td className="p-3">
                      <Badge className={
                        user.mlmLevel === 0 ? 'bg-secondary/50 text-muted-foreground' :
                        user.mlmLevel === 1 ? 'bg-amber-600/20 text-amber-400 border-amber-600/30' :
                        user.mlmLevel === 2 ? 'bg-slate-300/20 text-slate-300 border-slate-300/30' :
                        user.mlmLevel === 3 ? 'bg-amber-400/20 text-amber-400 border-amber-400/30' :
                        'bg-violet-500/20 text-violet-400 border-violet-500/30'
                      }>
                        {user.mlmRank || 'Member'} (Lvl {user.mlmLevel})
                      </Badge>
                    </td>

                    {/* Volumes */}
                    <td className="p-3 font-mono">
                      <div>PV: {user.personalVolume.toLocaleString()} BV</div>
                      <div>BV: {user.businessVolume.toLocaleString()} BV</div>
                      <div>TV: {user.teamVolume.toLocaleString()} BV</div>
                    </td>

                    {/* Leg Volumes */}
                    <td className="p-3 font-mono">
                      <div>Left: {user.binaryTreeLeftVolume.toLocaleString()} BV</div>
                      <div>Right: {user.binaryTreeRightVolume.toLocaleString()} BV</div>
                    </td>

                    {/* Active Investment */}
                    <td className="p-3 font-mono">
                      <span className="text-emerald-400 font-bold">${user.activeInvestment.toLocaleString()} USD</span>
                      <p className="text-[9px] text-muted-foreground uppercase font-sans mt-0.5">
                        {user.activePlanIds.length} Active Deposits
                      </p>
                    </td>

                    {/* Directs count */}
                    <td className="p-3 font-mono">
                      <div>Total Directs: {user.directsCount}</div>
                      <div>Active Directs: {user.activeDirectsCount}</div>
                    </td>

                    {/* Action Panel */}
                    <td className="p-3 text-right pr-4 space-x-1.5 flex items-center justify-end h-full">
                      {/* Override Select Dropdown */}
                      <select 
                        onChange={(e) => {
                          const val = e.target.value
                          if (!val) return
                          const [name, levelStr] = val.split(':')
                          handleManualOverride(user.id, name, Number(levelStr))
                          e.target.value = '' // Reset
                        }}
                        disabled={userActionLoading === user.id}
                        className="bg-background text-[10px] text-foreground h-7 rounded border border-border/50 px-1 focus:outline-none w-28"
                      >
                        <option value="">Manual Override...</option>
                        {ranksConfig.map((r) => (
                          <option key={r.level} value={`${r.name}:${r.level}`}>Set {r.name} (Lvl {r.level})</option>
                        ))}
                      </select>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px] font-semibold border-border/50 text-foreground bg-background/40 hover:bg-muted/20"
                        onClick={() => handleReevaluateRank(user.id)}
                        disabled={userActionLoading === user.id}
                      >
                        {userActionLoading === user.id ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Layers className="h-3 w-3 mr-1" />}
                        Re-evaluate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Gifts & Rewards Dispatch Ledger */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3 border-b border-border/40">
          <div>
            <CardTitle className="text-base flex items-center gap-1.5 text-amber-400">
              <Gift className="h-4 w-4" /> 3. Gifts & Rewards Dispatch Ledger
            </CardTitle>
            <CardDescription className="text-[11px]">Track physical awards unlocked by members when promoted. Keep record of shipment tracking IDs and logs.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {activeRewardClaims.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No physical reward claims currently generated in the ledger. Ranks Lvl 1+ will display here.</div>
          ) : (
            <table className="w-full text-left text-[11px] min-w-[900px]">
              <thead className="bg-muted/40 uppercase tracking-widest text-[9px] text-muted-foreground border-b border-border/40 font-mono">
                <tr>
                  <th className="p-3">User & Contact</th>
                  <th className="p-3">Rank Achieved</th>
                  <th className="p-3">Physical Gift Awarded</th>
                  <th className="p-3">Cash Prize</th>
                  <th className="p-3 w-28">Shipment Status</th>
                  <th className="p-3 w-36">Tracking ID / Notes</th>
                  <th className="p-3 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 align-middle font-medium">
                {activeRewardClaims.map((claim) => (
                  <tr key={claim.key} className="hover:bg-muted/10">
                    {/* User */}
                    <td className="p-2">
                      <p className="font-bold text-foreground">{claim.userName}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{claim.userEmail}</p>
                    </td>

                    {/* Rank */}
                    <td className="p-2">
                      <Badge variant="outline" className="text-[9px] border-border/50">{claim.rankName} (Lvl {claim.rankLevel})</Badge>
                    </td>

                    {/* Gift */}
                    <td className="p-2 max-w-[200px]">
                      <p className="text-foreground/90 font-semibold">{claim.gift}</p>
                    </td>

                    {/* Cash */}
                    <td className="p-2 font-mono text-emerald-400 font-bold">${claim.bonus.toLocaleString()} USD</td>

                    {/* Shipment Status Select */}
                    <td className="p-2">
                      <select 
                        id={`status-${claim.key}`}
                        defaultValue={claim.status || 'Pending'}
                        className="bg-background text-[10px] text-foreground h-7 rounded border border-border/50 px-1 focus:outline-none w-24"
                      >
                        <option value="Pending">🔴 Pending</option>
                        <option value="Dispatched">🟡 Dispatched</option>
                        <option value="Delivered">🟢 Delivered</option>
                      </select>
                    </td>

                    {/* Tracking ID & Notes */}
                    <td className="p-2 space-y-1">
                      <Input 
                        id={`tracking-${claim.key}`}
                        placeholder="Tracking Number" 
                        defaultValue={claim.trackingNumber || ''} 
                        className="h-6 text-[10px] p-1 font-mono bg-background/50"
                      />
                      <Input 
                        id={`notes-${claim.key}`}
                        placeholder="Delivery Notes" 
                        defaultValue={claim.notes || ''} 
                        className="h-5 text-[9px] p-1 bg-background/50"
                      />
                    </td>

                    {/* Save Dispatch Action */}
                    <td className="p-2 text-right pr-4">
                      <Button 
                        size="sm" 
                        className="h-7 text-[10px] bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                        onClick={() => {
                          const status = (document.getElementById(`status-${claim.key}`) as HTMLSelectElement).value
                          const tracking = (document.getElementById(`tracking-${claim.key}`) as HTMLInputElement).value
                          const notes = (document.getElementById(`notes-${claim.key}`) as HTMLInputElement).value
                          handleSaveDispatchLedger(claim.key, status, tracking, notes)
                        }}
                        disabled={savingLedger}
                      >
                        <Send className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
