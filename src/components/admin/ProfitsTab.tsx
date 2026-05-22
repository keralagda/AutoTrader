'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Eye,
  ArrowLeftRight,
  FileText,
  History,
  User,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import type { ProfitDistributionType } from '@/lib/types'

type RiskMode = 'safe' | 'medium' | 'risk'
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
type Operation = 'add' | 'subtract'

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
]

const RISK_CONFIG: Record<RiskMode, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ElementType
  desc: string
  minPct: number
  maxPct: number
}> = {
  safe: {
    label: 'Safe',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    icon: ShieldCheck,
    desc: 'Conservative, steady returns',
    minPct: 1,
    maxPct: 5,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    icon: Zap,
    desc: 'Moderate risk, balanced returns',
    minPct: 5,
    maxPct: 10,
  },
  risk: {
    label: 'Risk',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30',
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
  tradingBalance: number
  totalEarnings: number
  referredById?: string | null
}

export function ProfitsTab() {
  // Form state
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [riskMode, setRiskMode] = useState<RiskMode>('safe')
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [profitCycle, setProfitCycle] = useState<'1week' | '1month'>('1week')
  const [operation, setOperation] = useState<Operation>('add')
  const [reason, setReason] = useState('')

  // Data state
  const [distributions, setDistributions] = useState<ProfitDistributionType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isSubtract = operation === 'subtract'
  const accentColor = isSubtract ? 'rose' : 'emerald'
  const accentTextClass = isSubtract ? 'text-rose-400' : 'text-emerald-400'
  const accentBgClass = isSubtract ? 'bg-rose-500/15' : 'bg-emerald-500/15'
  const accentBorderClass = isSubtract ? 'border-rose-500/30' : 'border-emerald-500/30'
  const accentBtnClass = isSubtract
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : 'bg-emerald-600 hover:bg-emerald-700 text-white'

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
  const profitSharePercent = 30
  const profitShareAmount = (parsedAmount * profitSharePercent) / 100

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isFormValid =
    selectedUserId &&
    parsedAmount > 0 &&
    selectedDays.length > 0 &&
    reason.trim().length > 0

  const handleOpenConfirm = () => {
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
    if (!reason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason for this operation', variant: 'destructive' })
      return
    }
    if (isSubtract && selectedUser && parsedAmount > selectedUser.tradingBalance) {
      toast({
        title: 'Warning',
        description: `Subtract amount ($${parsedAmount.toFixed(2)}) exceeds user's trading balance ($${selectedUser.tradingBalance.toFixed(2)})`,
        variant: 'destructive',
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false)
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
            operation,
            reason: reason.trim(),
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `Failed to ${operation} profit`)
        }
      }
      toast({
        title: isSubtract ? 'Profit Subtracted' : 'Profit Added',
        description: `Successfully ${isSubtract ? 'subtracted' : 'added'} $${parsedAmount.toFixed(2)} ${isSubtract ? 'from' : 'to'} ${selectedUser?.name}`,
      })
      setSelectedUserId('')
      setAmount('')
      setSelectedDays([])
      setReason('')
      fetchDistributions()
      fetchUsers()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || `Failed to ${operation} profit`,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalAddAmount = distributions
    .filter(d => d.operation === 'add')
    .reduce((sum, d) => sum + d.amount, 0)
  const totalSubtractAmount = distributions
    .filter(d => d.operation === 'subtract')
    .reduce((sum, d) => sum + Math.abs(d.amount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profit Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add or subtract trading profits for users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Stats:</span>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            +{formatCurrency(totalAddAmount)} added
          </Badge>
          <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10">
            -{formatCurrency(totalSubtractAmount)} subtracted
          </Badge>
        </div>
      </div>

      {/* Operation Toggle */}
      <Card className={`bg-card/50 border ${accentBorderClass} transition-colors duration-300`}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Operation Mode
            </Label>
            <div className="flex w-full sm:w-auto rounded-lg border border-border/50 overflow-hidden">
              <button
                onClick={() => setOperation('add')}
                className={`flex-1 sm:flex-none flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all ${
                  operation === 'add'
                    ? 'bg-emerald-500/15 text-emerald-400 border-r border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Add Profit
              </button>
              <button
                onClick={() => setOperation('subtract')}
                className={`flex-1 sm:flex-none flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all ${
                  operation === 'subtract'
                    ? 'bg-rose-500/15 text-rose-400 border-l border-rose-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Subtract Profit
              </button>
            </div>
            {isSubtract && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" />
                Subtraction will reverse profit share to upline
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* User Selection */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Select User
              </CardTitle>
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
                      {u.name} — {u.email} (Bal: {formatCurrency(u.tradingBalance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser && (
                <div className={`flex items-center gap-3 p-3 rounded-lg ${accentBgClass} border ${accentBorderClass}`}>
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${accentBgClass} ${accentTextClass}`}>
                    {selectedUser.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Trading Balance</p>
                    <p className={`text-sm font-semibold ${accentTextClass}`}>
                      {formatCurrency(selectedUser.tradingBalance)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount and Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Amount (USDC)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className={`bg-muted/50 border-border/50 pl-7 ${isSubtract && parsedAmount > 0 ? 'border-rose-500/40 focus-visible:border-rose-500/60' : ''}`}
                  />
                </div>
                {isSubtract && selectedUser && parsedAmount > selectedUser.tradingBalance && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Exceeds trading balance ({formatCurrency(selectedUser.tradingBalance)})
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Risk Mode
                </CardTitle>
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
                            ? `${config.bgColor} ${config.borderColor}`
                            : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <div className="text-left flex-1">
                          <p className={`text-sm font-medium ${riskMode === mode ? config.color : 'text-foreground'}`}>
                            {config.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{config.desc}</p>
                        </div>
                        <span className={`text-xs font-mono ${config.color}`}>
                          {config.minPct}-{config.maxPct}%
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Days, Cycle, and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Trading Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => {
                    const isSelected = selectedDays.includes(day.value)
                    return (
                      <label
                        key={day.value}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? `${accentBgClass} ${accentBorderClass} ${accentTextClass}`
                            : 'border-border/50 text-muted-foreground hover:border-border'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDay(day.value)}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </label>
                    )
                  })}
                </div>
                {tradingDaysCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {tradingDaysCount} day{tradingDaysCount > 1 ? 's' : ''} selected
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
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
                          ? `${accentBgClass} ${accentBorderClass} ${accentTextClass}`
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      1 Week
                    </button>
                    <button
                      onClick={() => setProfitCycle('1month')}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        profitCycle === '1month'
                          ? `${accentBgClass} ${accentBorderClass} ${accentTextClass}`
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      1 Month
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Reason / Notes
                    <span className="text-rose-400 text-xs">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={
                      isSubtract
                        ? 'e.g., Correction for overpayment, Admin adjustment...'
                        : 'e.g., Daily profit distribution, Bonus allocation...'
                    }
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="bg-muted/50 border-border/50 min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Required — this will be recorded in the operation history
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Column - Preview Panel */}
        <div className="space-y-4">
          <Card className={`bg-card/50 border ${accentBorderClass} transition-colors duration-300`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className={`h-4 w-4 ${accentTextClass}`} />
                Operation Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Operation Type Indicator */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${accentBgClass}`}>
                {isSubtract ? (
                  <TrendingDown className={`h-5 w-5 ${accentTextClass}`} />
                ) : (
                  <TrendingUp className={`h-5 w-5 ${accentTextClass}`} />
                )}
                <div>
                  <p className={`text-sm font-semibold ${accentTextClass}`}>
                    {isSubtract ? 'SUBTRACT' : 'ADD'} PROFIT
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isSubtract ? 'Reduce balance & reverse upline share' : 'Increase balance & distribute upline share'}
                  </p>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User</span>
                  <span className="text-foreground font-medium truncate ml-2 max-w-[140px]">
                    {selectedUser?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount per day</span>
                  <span className={`font-medium ${accentTextClass}`}>{formatCurrency(parsedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Mode</span>
                  <span className={riskConfig.color}>{riskConfig.label} ({riskConfig.minPct}-{riskConfig.maxPct}%)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trading Days</span>
                  <span className="text-foreground">{tradingDaysCount} day{tradingDaysCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cycle</span>
                  <span className="text-foreground">{profitCycle === '1week' ? '1 Week' : '1 Month'}</span>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit Share ({profitSharePercent}%)</span>
                  <span className="text-foreground">{formatCurrency(profitShareAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Holder (50%)</span>
                  <span className="text-foreground">{formatCurrency(parsedAmount * 0.5)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rewards (15%)</span>
                  <span className="text-foreground">{formatCurrency(parsedAmount * 0.15)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee (5%)</span>
                  <span className="text-foreground">{formatCurrency(parsedAmount * 0.05)}</span>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Estimated Total */}
              <div className="pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Estimated Total
                  </span>
                  <span className={`text-2xl font-bold ${accentTextClass}`}>
                    {isSubtract ? '-' : '+'}{formatCurrency(estimatedEarnings)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per {profitCycle === '1week' ? 'week' : 'month'} cycle ({tradingDaysCount} days × {cycleMultiplier} {profitCycle === '1month' ? 'weeks' : 'week'})
                </p>
              </div>

              {/* Subtract Warning */}
              {isSubtract && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xs text-rose-300 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      This will <strong>SUBTRACT {formatCurrency(parsedAmount)}</strong> from the user&apos;s
                      trading balance and <strong>reverse {profitSharePercent}% profit share</strong> to upline
                      ({formatCurrency(profitShareAmount)} per day).
                    </span>
                  </p>
                </div>
              )}

              {/* Add Info */}
              {!isSubtract && parsedAmount > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-300 flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      This will <strong>ADD {formatCurrency(parsedAmount)}</strong> to the user&apos;s
                      trading balance and <strong>distribute {profitSharePercent}% profit share</strong> to upline
                      ({formatCurrency(profitShareAmount)} per day).
                    </span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleOpenConfirm}
                disabled={submitting || !isFormValid}
                className={`w-full gap-2 ${accentBtnClass}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isSubtract ? (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    Subtract Profit
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Add Profit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isSubtract ? (
                <>
                  <TrendingDown className="h-5 w-5 text-rose-400" />
                  Confirm Profit Subtraction
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Confirm Profit Addition
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <div className={`p-4 rounded-lg border ${accentBgClass} ${accentBorderClass}`}>
                  <p className={`text-sm font-semibold ${accentTextClass} mb-2`}>
                    {isSubtract ? '⚠️ This will SUBTRACT' : '✅ This will ADD'} profit
                  </p>
                  <div className="space-y-1.5 text-sm text-foreground">
                    <p>
                      <span className="text-muted-foreground">User:</span>{' '}
                      <strong>{selectedUser?.name}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Amount per day:</span>{' '}
                      <strong className={accentTextClass}>{formatCurrency(parsedAmount)}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Days:</span>{' '}
                      <strong>{selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Total:</span>{' '}
                      <strong className={accentTextClass}>
                        {isSubtract ? '-' : '+'}{formatCurrency(estimatedEarnings)}
                      </strong>
                    </p>
                  </div>
                </div>

                {isSubtract ? (
                  <p className="text-sm text-rose-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      This will reduce the user&apos;s trading balance by <strong>{formatCurrency(estimatedEarnings)}</strong> and
                      reverse <strong>{profitSharePercent}% profit share</strong> ({formatCurrency(profitShareAmount * tradingDaysCount * cycleMultiplier)} total)
                      back from upline referees.
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      This will increase the user&apos;s trading balance by <strong>{formatCurrency(estimatedEarnings)}</strong> and
                      distribute <strong>{profitSharePercent}% profit share</strong> ({formatCurrency(profitShareAmount * tradingDaysCount * cycleMultiplier)} total)
                      to upline referees.
                    </span>
                  </p>
                )}

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Reason:</p>
                  <p className="text-sm text-foreground">{reason}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  This action cannot be undone. Please verify all details before confirming.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              className={accentBtnClass}
            >
              {isSubtract ? (
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Confirm Subtraction
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Confirm Addition
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recent Distributions History */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Recent Profit Distributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No profit distributions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Distributions will appear here after the first operation
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Operation</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Risk Mode</TableHead>
                    <TableHead className="text-muted-foreground">Day</TableHead>
                    <TableHead className="text-muted-foreground">Reason</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map(dist => {
                    const isAdd = dist.operation === 'add'
                    const distAmount = Math.abs(dist.amount)
                    return (
                      <TableRow key={dist.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell>
                          {isAdd ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Add
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/20">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Subtract
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`font-medium ${isAdd ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isAdd ? '+' : '-'}{formatCurrency(distAmount)}
                        </TableCell>
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
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {dist.reason || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDate(dist.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
