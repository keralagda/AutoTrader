'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { TrendingUp, Zap, AlertTriangle, ShieldCheck } from 'lucide-react'
import type { ProfitDistributionType } from '@/lib/types'

type RiskMode = 'safe' | 'medium' | 'risk'
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
]

const RISK_CONFIG: Record<RiskMode, { label: string; color: string; bgColor: string; icon: React.ElementType; desc: string; minPct: number; maxPct: number }> = {
  safe: {
    label: 'Safe',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15 border-emerald-500/30',
    icon: ShieldCheck,
    desc: 'Conservative, steady returns',
    minPct: 1,
    maxPct: 5,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15 border-amber-500/30',
    icon: Zap,
    desc: 'Moderate risk, balanced returns',
    minPct: 5,
    maxPct: 10,
  },
  risk: {
    label: 'Risk',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/15 border-rose-500/30',
    icon: AlertTriangle,
    desc: 'Aggressive, high return potential',
    minPct: 10,
    maxPct: 20,
  },
}

interface UserOption {
  id: string
  name: string
  email: string
  balance: number
  totalEarnings: number
}

export function ProfitsTab() {
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [riskMode, setRiskMode] = useState<RiskMode>('safe')
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [profitCycle, setProfitCycle] = useState<'1week' | '1month'>('1week')
  const [distributions, setDistributions] = useState<ProfitDistributionType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' })
    }
  }, [])

  const fetchDistributions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/profits')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDistributions(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load distributions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchDistributions()
  }, [fetchUsers, fetchDistributions])

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const selectedUser = users.find(u => u.id === selectedUserId)
  const riskConfig = RISK_CONFIG[riskMode]
  const parsedAmount = parseFloat(amount) || 0
  const tradingDaysCount = selectedDays.length
  const cycleMultiplier = profitCycle === '1week' ? 1 : 4
  const estimatedEarnings = parsedAmount * tradingDaysCount * cycleMultiplier

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' })
      return
    }
    if (parsedAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' })
      return
    }
    if (selectedDays.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one trading day', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      for (const day of selectedDays) {
        const res = await fetch('/api/admin/profits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUserId,
            riskMode,
            amount: parsedAmount,
            dayOfWeek: day,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to add profit')
        }
      }
      toast({ title: 'Profit Added', description: `Successfully distributed ${parsedAmount} USDC to ${selectedUser?.name}` })
      setSelectedUserId('')
      setAmount('')
      setSelectedDays([])
      fetchDistributions()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add profit', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Add Profits</h2>
        <p className="text-sm text-muted-foreground mt-1">Distribute trading profits to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* User Selection */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-muted/50 border-border/50"
              />
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email} (Bal: ${u.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                    {selectedUser.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">Balance: ${selectedUser.balance.toFixed(2)} | Earnings: ${selectedUser.totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount and Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Amount (USDC)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="bg-muted/50 border-border/50 pl-7"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Risk Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(Object.entries(RISK_CONFIG) as [RiskMode, typeof RISK_CONFIG[RiskMode]][]).map(([mode, config]) => {
                    const Icon = config.icon
                    return (
                      <button
                        key={mode}
                        onClick={() => setRiskMode(mode)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                          riskMode === mode
                            ? config.bgColor
                            : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <div className="text-left">
                          <p className={`text-sm font-medium ${riskMode === mode ? config.color : 'text-foreground'}`}>{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Days & Cycle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Trading Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <label
                      key={day.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        selectedDays.includes(day.value)
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <Checkbox
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">{day.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profit Cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProfitCycle('1week')}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      profitCycle === '1week'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    1 Week
                  </button>
                  <button
                    onClick={() => setProfitCycle('1month')}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      profitCycle === '1month'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    1 Month
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card className="bg-card/50 border-emerald-500/20 border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount per day</span>
                  <span className="text-foreground">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Mode</span>
                  <span className={riskConfig.color}>{riskConfig.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trading Days</span>
                  <span className="text-foreground">{tradingDaysCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cycle</span>
                  <span className="text-foreground">{profitCycle === '1week' ? '1 Week' : '1 Month'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Rate</span>
                  <span className="text-foreground">{riskConfig.minPct}% - {riskConfig.maxPct}%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Estimated Total</span>
                  <span className="text-2xl font-bold text-emerald-400">${estimatedEarnings.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per {profitCycle === '1week' ? 'week' : 'month'} cycle</p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedUserId || parsedAmount <= 0 || tradingDaysCount === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {submitting ? 'Adding...' : 'Add Profit'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Distributions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Profit Distributions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : distributions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No profit distributions yet</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Risk Mode</TableHead>
                    <TableHead className="text-muted-foreground">Day</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map(dist => (
                    <TableRow key={dist.id} className="border-border/30 hover:bg-muted/30">
                      <TableCell className="text-emerald-400 font-medium">${dist.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            dist.riskMode === 'safe'
                              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              : dist.riskMode === 'medium'
                              ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                              : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                          }
                        >
                          {dist.riskMode.charAt(0).toUpperCase() + dist.riskMode.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground capitalize">{dist.dayOfWeek}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(dist.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
