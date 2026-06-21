'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  Percent, 
  TrendingUp, 
  PiggyBank, 
  Search, 
  RefreshCw,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface AutoUpgradeUser {
  id: string
  name: string
  email: string
  autoUpgradeEnabled: boolean
  autoUpgradePercent: number
  autoUpgradeAccumulated: number
  autoUpgradeTargetPlanId: string | null
  autoInvestmentEnabled: boolean
  tradingBalance: number
  targetPlanName: string
  targetPlanFee: number
  createdAt: string
}

interface Stats {
  totalUsersCount: number
  totalAccumulated: number
  averagePercent: number
}

export function AdminAutoUpgradeTab() {
  const [users, setUsers] = useState<AutoUpgradeUser[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsersCount: 0,
    totalAccumulated: 0,
    averagePercent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auto-upgrade')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setStats(data.stats || { totalUsersCount: 0, totalAccumulated: 0, averagePercent: 0 })
      } else {
        toast({ title: 'Failed to fetch upgrade stats', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.targetPlanName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      
      {/* Header section with Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Users */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Auto-Upgrades</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.totalUsersCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Users accumulating upgrade funds</p>
            </div>
            <div className="size-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Users className="size-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Deduction Percentage */}
        <Card className="bg-gradient-to-br from-cyan-500/10 via-card to-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Avg. Deduction Cut</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-1">{stats.averagePercent.toFixed(1)}%</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Weighted average user deduction</p>
            </div>
            <div className="size-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
              <Percent className="size-5 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Accumulated Funds */}
        <Card className="bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Accumulated</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1">${stats.totalAccumulated.toFixed(2)}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Aggregated pending upgrade capital</p>
            </div>
            <div className="size-10 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <PiggyBank className="size-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main monitoring table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-primary animate-pulse" />
            Auto-Upgrade User Directory
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search name, email, target plan..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 h-8 w-60 rounded-md border border-border/40 bg-background text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <Button 
              size="icon" 
              variant="outline" 
              className="size-8 shrink-0 border-border/50" 
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`size-3.5 text-foreground ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-border/30 rounded-lg bg-muted/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground uppercase font-bold bg-muted/40">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Target Plan</th>
                  <th className="py-3 px-4">Selected Cut</th>
                  <th className="py-3 px-4">Accumulated vs Target</th>
                  <th className="py-3 px-4">Auto Investment</th>
                  <th className="py-3 px-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const progress = u.targetPlanFee > 0 
                    ? Math.min((u.autoUpgradeAccumulated / u.targetPlanFee) * 100, 100) 
                    : 0
                  
                  return (
                    <tr key={u.id} className="border-b border-border/20 hover:bg-muted/20 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                          {u.targetPlanName}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <span className="text-primary">{u.autoUpgradePercent}%</span> of profits
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        <span>${u.autoUpgradeAccumulated.toFixed(2)}</span>
                        <span className="text-muted-foreground font-normal text-[10px]"> / ${u.targetPlanFee.toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.autoInvestmentEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                            <ToggleRight className="size-4 text-emerald-400" />
                            ON (Compounding)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted border border-border/30 px-2 py-0.5 rounded-full font-medium">
                            <ToggleLeft className="size-4 text-muted-foreground" />
                            OFF (Liquid)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="font-bold font-mono text-[10px] text-right w-8 text-foreground">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                      {loading ? 'Fetching upgrade database records...' : 'No users currently utilizing auto-upgrade settings.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
