'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ScrollText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  User,
  Wallet,
  HelpCircle,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Coins,
  ShieldAlert
} from 'lucide-react'

interface UserDetails {
  id: string
  name: string
  email: string
  role: string
  referredBy?: {
    id: string
    name: string
    email: string
  } | null
}

interface FinancialLog {
  id: string
  userId: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  wallet: string
  description: string | null
  referenceId: string | null
  status: string
  createdAt: string
  user: UserDetails
}

export function AdminFinancialLogsTab() {
  const [logs, setLogs] = useState<FinancialLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Statistics summaries
  const [stats, setStats] = useState({
    totalCount: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalProfits: 0,
    totalReferrals: 0
  })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/financial-logs?page=${page}&limit=${limit}&type=${type}&search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        
        // Calculate stats for the current page/visible dataset
        const currentLogs: FinancialLog[] = data.logs || []
        const deposits = currentLogs.filter(l => l.type === 'deposit').reduce((sum, l) => sum + l.amount, 0)
        const withdrawals = currentLogs.filter(l => l.type === 'withdrawal').reduce((sum, l) => sum + l.amount, 0)
        const profits = currentLogs.filter(l => l.type === 'profit' || l.type === 'daily').reduce((sum, l) => sum + l.amount, 0)
        const referrals = currentLogs.filter(l => l.type === 'referral').reduce((sum, l) => sum + l.amount, 0)

        setStats({
          totalCount: data.total || 0,
          totalDeposits: deposits,
          totalWithdrawals: withdrawals,
          totalProfits: profits,
          totalReferrals: referrals
        })
      }
    } catch (error) {
      console.error('Failed to fetch financial logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, type, search])

  const handleReset = () => {
    setSearch('')
    setType('all')
    setPage(1)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1"><ArrowUpRight className="size-3" />Deposit</Badge>
      case 'withdrawal':
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1"><ArrowDownLeft className="size-3" />Withdrawal</Badge>
      case 'investment':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1"><Coins className="size-3" />Investment</Badge>
      case 'reinvest':
        return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 gap-1"><RefreshCw className="size-3" />Reinvestment</Badge>
      case 'profit':
      case 'daily':
        return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 gap-1"><TrendingUp className="size-3" />Profit</Badge>
      case 'referral':
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1"><User className="size-3" />Referral</Badge>
      case 'bonus':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1">Bonus</Badge>
      case 'capital_return':
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 gap-1">Capital Return</Badge>
      case 'fee':
        return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 gap-1">Fee</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getAmountColor = (type: string) => {
    const positiveTypes = ['deposit', 'profit', 'daily', 'referral', 'bonus', 'capital_return']
    return positiveTypes.includes(type) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-medium'
  }

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Decompose 5W1H details for narrative display
  const getNarrative5W1H = (log: FinancialLog) => {
    const who = `${log.user.name} (${log.user.email}, Role: ${log.user.role})`
    const sponsor = log.user.referredBy ? ` (Sponsor: ${log.user.referredBy.name})` : ''
    
    let whatAction = ''
    let whereWallet = log.wallet === 'trading' ? 'Trading Wallet' : 'Withdrawal Wallet'
    let howProcessed = ''
    let whyReason = log.description || 'System transaction'

    const amountStr = `${log.amount > 0 ? '+' : ''}${formatCurrency(log.amount)}`

    switch (log.type) {
      case 'deposit':
        whatAction = `credited a deposit of ${amountStr}`
        howProcessed = log.referenceId ? `via verified gateway payment reference (${log.referenceId})` : 'via manual admin approval'
        break
      case 'withdrawal':
        whatAction = `initiated a withdrawal of ${amountStr}`
        howProcessed = `processed via blockchain / gateway target address`
        break
      case 'investment':
        whatAction = `invested ${amountStr} to subscribe to a trading plan`
        howProcessed = `debited from active balance via plan builder action`
        break
      case 'reinvest':
        whatAction = `reinvested ${amountStr} into a trading plan`
        howProcessed = `compounded directly within active plans`
        break
      case 'profit':
      case 'daily':
        whatAction = `received ${amountStr} daily trading profit share`
        howProcessed = `distributed automatically by the system cron profit job`
        break
      case 'referral':
        whatAction = `earned ${amountStr} upline referral profit commission`
        howProcessed = `credited from downstream affiliate trading activity`
        break
      case 'bonus':
        whatAction = `received a bonus of ${amountStr}`
        howProcessed = `granted by administration or daily check-in rewards`
        break
      case 'capital_return':
        whatAction = `received a principal return of ${amountStr}`
        howProcessed = `credited back upon plan maturity or cancellation`
        break
      case 'fee':
        whatAction = `charged a transaction / service fee of ${amountStr}`
        howProcessed = `levied automatically by platform protocol`
        break
      default:
        whatAction = `performed a transaction of ${amountStr}`
        howProcessed = `completed via generic status updates`
    }

    return {
      who: `${who}${sponsor}`,
      what: `${whatAction}. Balance shifted from ${formatCurrency(log.balanceBefore)} to ${formatCurrency(log.balanceAfter)}.`,
      where: `Targeted ${whereWallet} inside the user account database.`,
      when: formatDate(log.createdAt),
      why: whyReason,
      how: `Executed as a ${log.status} operation ${howProcessed}. Transaction ID: ${log.id}.`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">5W1H Financial Ledger</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Decomposed audit trail of deposits, investments, earnings, and referrals
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2 border-border/50 bg-card/40 hover:bg-muted/40 text-foreground">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Bento Stats Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="cyber-card bg-emerald-500/5 hover:border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="size-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Page Inflows (Deposits)</p>
              <p className="text-sm font-bold text-emerald-400 truncate">{formatCurrency(stats.totalDeposits)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cyber-card bg-rose-500/5 hover:border-rose-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400">
              <ArrowDownLeft className="size-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Page Outflows (Withdrawals)</p>
              <p className="text-sm font-bold text-rose-400 truncate">{formatCurrency(stats.totalWithdrawals)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cyber-card bg-cyan-500/5 hover:border-cyan-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Page Profit Shares</p>
              <p className="text-sm font-bold text-cyan-400 truncate">{formatCurrency(stats.totalProfits)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cyber-card bg-purple-500/5 hover:border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
              <User className="size-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Page Referral Payouts</p>
              <p className="text-sm font-bold text-purple-400 truncate">{formatCurrency(stats.totalReferrals)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name, email, transaction ID, reference hash..."
              className="pl-9 bg-muted/30 border-border/50"
            />
          </div>

          {/* Type Select Dropdown */}
          <div className="w-full md:w-56 flex gap-2">
            <div className="flex-1">
              <Select value={type} onValueChange={(val) => { setType(val); setPage(1) }}>
                <SelectTrigger className="bg-muted/30 border-border/50">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="investment">Investments</SelectItem>
                  <SelectItem value="reinvest">Reinvestments</SelectItem>
                  <SelectItem value="profit">Profits</SelectItem>
                  <SelectItem value="referral">Referrals</SelectItem>
                  <SelectItem value="bonus">Bonuses</SelectItem>
                  <SelectItem value="capital_return">Capital Returns</SelectItem>
                  <SelectItem value="fee">Fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={handleReset} className="border-border/50 bg-muted/20 hover:bg-muted/40 shrink-0">
              <Filter className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Table */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground py-3">WHO</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground py-3">WHAT</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground py-3">WHERE</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground py-3">WHEN</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground py-3">WHY</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground py-3 text-right">HOW (STATUS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center py-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="size-6 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Loading ledger records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center py-6 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="size-8 opacity-25" />
                      <span className="text-sm">No transaction records match the search filter</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedId === log.id
                  const narrative = getNarrative5W1H(log)
                  
                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className={`border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        {/* Expand collapse chevron */}
                        <TableCell className="p-3 text-center shrink-0">
                          {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                        </TableCell>

                        {/* WHO */}
                        <TableCell className="p-3 py-4">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {log.user.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{log.user.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{log.user.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* WHAT */}
                        <TableCell className="p-3 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {getTypeBadge(log.type)}
                              <span className={`text-xs ${getAmountColor(log.type)}`}>
                                {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                              </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-mono">
                              {formatCurrency(log.balanceBefore)} ➔ {formatCurrency(log.balanceAfter)}
                            </p>
                          </div>
                        </TableCell>

                        {/* WHERE */}
                        <TableCell className="p-3 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] text-foreground font-medium">
                              <Wallet className="size-3 text-muted-foreground" />
                              <span className="capitalize">{log.wallet} Wallet</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {log.referenceId ? `Ref: ${log.referenceId.slice(0, 12)}...` : 'System / Manual'}
                            </p>
                          </div>
                        </TableCell>

                        {/* WHEN */}
                        <TableCell className="p-3 py-4">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3 shrink-0" />
                            <span>{formatDate(log.createdAt).split(',')[0]}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground/60 block mt-0.5">
                            {formatDate(log.createdAt).split(',')[1]}
                          </span>
                        </TableCell>

                        {/* WHY */}
                        <TableCell className="p-3 py-4">
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]" title={log.description || ''}>
                            {log.description || '—'}
                          </p>
                        </TableCell>

                        {/* HOW / STATUS */}
                        <TableCell className="p-3 py-4 text-right">
                          <Badge
                            className={`text-[10px] border capitalize ${
                              log.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : log.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                            variant="outline"
                          >
                            {log.status}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground/60 font-mono block mt-1">
                            ID: {log.id.slice(0, 8)}...
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Collapsible 5W1H Narrative details */}
                      {isExpanded && (
                        <TableRow className="bg-primary/5 border-b border-primary/20 hover:bg-primary/5">
                          <TableCell colSpan={7} className="p-4 pt-1 bg-background/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-primary/20 rounded-xl p-4 bg-muted/20">
                              {/* Left Column: Core 5W1H Decomposed Narrative */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                  <FileText className="size-3.5" />
                                  5W1H Audit Narrative
                                </h4>
                                <div className="space-y-2 text-xs">
                                  <p className="leading-relaxed">
                                    <span className="font-semibold text-primary uppercase text-[10px] w-12 inline-block">WHO:</span>
                                    <span className="text-foreground">{narrative.who}</span>
                                  </p>
                                  <p className="leading-relaxed">
                                    <span className="font-semibold text-primary uppercase text-[10px] w-12 inline-block">WHAT:</span>
                                    <span className="text-foreground">{narrative.what}</span>
                                  </p>
                                  <p className="leading-relaxed">
                                    <span className="font-semibold text-primary uppercase text-[10px] w-12 inline-block">WHERE:</span>
                                    <span className="text-foreground">{narrative.where}</span>
                                  </p>
                                  <p className="leading-relaxed">
                                    <span className="font-semibold text-primary uppercase text-[10px] w-12 inline-block">WHEN:</span>
                                    <span className="text-foreground">{narrative.when}</span>
                                  </p>
                                  <p className="leading-relaxed">
                                    <span className="font-semibold text-primary uppercase text-[10px] w-12 inline-block">WHY:</span>
                                    <span className="text-foreground">{narrative.why}</span>
                                  </p>
                                  <p className="leading-relaxed">
                                    <span className="font-semibold text-primary uppercase text-[10px] w-12 inline-block">HOW:</span>
                                    <span className="text-foreground">{narrative.how}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Right Column: Technical Details / Metadata JSON */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                  <ScrollText className="size-3.5" />
                                  Technical Transaction Ledger metadata
                                </h4>
                                <pre className="p-3 bg-black/40 border border-border/40 rounded-lg text-[10px] text-emerald-400/90 font-mono overflow-auto max-h-[160px]">
                                  {JSON.stringify({
                                    transactionId: log.id,
                                    userId: log.userId,
                                    transactionType: log.type,
                                    walletTarget: log.wallet,
                                    amount: log.amount,
                                    balanceBefore: log.balanceBefore,
                                    balanceAfter: log.balanceAfter,
                                    referenceId: log.referenceId,
                                    status: log.status,
                                    recordedAt: log.createdAt,
                                    user: {
                                      id: log.user.id,
                                      name: log.user.name,
                                      email: log.user.email,
                                      role: log.user.role,
                                      sponsor: log.user.referredBy ? log.user.referredBy.email : null
                                    }
                                  }, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        {total > limit && (
          <div className="flex justify-center items-center gap-3 p-4 border-t border-border/50 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="border-border/50"
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / limit) || loading}
              onClick={() => setPage(p => p + 1)}
              className="border-border/50"
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
