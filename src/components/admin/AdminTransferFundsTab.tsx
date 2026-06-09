'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowRightLeft, Search, User, Wallet, CheckCircle2,
  AlertCircle, Loader2, RefreshCw, History, ArrowRight,
  X, TrendingUp, TrendingDown, ShieldCheck, DollarSign,
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

interface UserResult {
  id: string
  name: string
  email: string
  referralCode: string
  tradingBalance: number
  withdrawalBalance: number
  isActive: boolean
}

interface TransferRecord {
  id: string
  timestamp: string
  fromName: string
  toName: string
  amount: number
  fromWallet: string
  toWallet: string
  notes: string
}

// ─── User Picker sub-component ────────────────────────────────────────────────
function UserPicker({
  label,
  placeholder,
  selected,
  onSelect,
  onClear,
  exclude,
}: {
  label: string
  placeholder: string
  selected: UserResult | null
  onSelect: (u: UserResult) => void
  onClear: () => void
  exclude?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/transfer-funds?search=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        const filtered = (data.users || []).filter((u: UserResult) => u.id !== exclude)
        setResults(filtered)
        setOpen(true)
      }
    } finally { setLoading(false) }
  }, [exclude])

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(t)
  }, [query, doSearch])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (selected) {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase">{label}</Label>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <div className="size-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {selected.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{selected.name}</p>
            <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">ID: {selected.id.slice(0, 12)}...</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-emerald-400">${selected.tradingBalance.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Trading</p>
            <p className="text-xs font-bold text-cyan-400 mt-0.5">${selected.withdrawalBalance.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Withdrawal</p>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-400 shrink-0" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2" ref={ref}>
      <Label className="text-xs font-semibold text-muted-foreground uppercase">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9 bg-muted/30 border-border/50 focus:border-primary/50"
          onFocus={() => results.length > 0 && setOpen(true)}
        />

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden">
            {results.map(u => (
              <button
                key={u.id}
                onClick={() => { onSelect(u); setQuery(''); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {u.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    {!u.isActive && <Badge className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/20 px-1 py-0">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground/50 font-mono">{u.id}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-emerald-400">${u.tradingBalance.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Trading</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {open && query && results.length === 0 && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border/50 rounded-xl shadow-2xl p-4 text-center">
            <p className="text-xs text-muted-foreground">No users found matching "{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AdminTransferFundsTab() {
  const { toast } = useToast()

  const [sender, setSender] = useState<UserResult | null>(null)
  const [receiver, setReceiver] = useState<UserResult | null>(null)
  const [fromWallet, setFromWallet] = useState<'trading' | 'withdrawal'>('trading')
  const [toWallet, setToWallet] = useState<'trading' | 'withdrawal'>('trading')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [history, setHistory] = useState<TransferRecord[]>([])
  const [showConfirm, setShowConfirm] = useState(false)

  // Load local history from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('adminTransferHistory')
    if (stored) setHistory(JSON.parse(stored))
  }, [])

  const senderBalance = sender
    ? (fromWallet === 'trading' ? sender.tradingBalance : sender.withdrawalBalance)
    : 0

  const parsedAmount = parseFloat(amount)
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const isInsufficientBalance = isValidAmount && parsedAmount > senderBalance
  const canPreview = sender && receiver && isValidAmount && !isInsufficientBalance

  const handleReset = () => {
    setSender(null)
    setReceiver(null)
    setFromWallet('trading')
    setToWallet('trading')
    setAmount('')
    setNotes('')
    setShowConfirm(false)
    setConfirmed(false)
  }

  const handleTransfer = async () => {
    if (!sender || !receiver || !isValidAmount) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/transfer-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: sender.id,
          toUserId: receiver.id,
          fromWallet,
          toWallet,
          amount: parsedAmount,
          notes,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ title: 'Transfer Successful', description: data.message })
        setConfirmed(true)
        setShowConfirm(false)

        // Append to local history
        const record: TransferRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          fromName: sender.name,
          toName: receiver.name,
          amount: parsedAmount,
          fromWallet,
          toWallet,
          notes,
        }
        const updated = [record, ...history].slice(0, 20)
        setHistory(updated)
        sessionStorage.setItem('adminTransferHistory', JSON.stringify(updated))

        // Update local balances for UI
        if (data.sender) {
          setSender(prev => prev ? { ...prev, tradingBalance: data.sender.wallet === 'trading' ? data.sender.balanceAfter : prev.tradingBalance, withdrawalBalance: data.sender.wallet === 'withdrawal' ? data.sender.balanceAfter : prev.withdrawalBalance } : prev)
        }
        if (data.receiver) {
          setReceiver(prev => prev ? { ...prev, tradingBalance: data.receiver.wallet === 'trading' ? data.receiver.balanceAfter : prev.tradingBalance, withdrawalBalance: data.receiver.wallet === 'withdrawal' ? data.receiver.balanceAfter : prev.withdrawalBalance } : prev)
        }
      } else {
        toast({ title: 'Transfer Failed', description: data.error || 'Unknown error', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network Error', description: 'Could not reach the server.', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" /> Transfer Funds
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Move balances between user accounts instantly. All transfers are logged and audited.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 border-border/50">
          <RefreshCw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Transfer Form ── */}
        <div className="lg:col-span-3 space-y-5">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Select Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Sender */}
              <UserPicker
                label="From (Sender)"
                placeholder="Search by name, email, or user ID..."
                selected={sender}
                onSelect={u => { setSender(u); setConfirmed(false) }}
                onClear={() => { setSender(null); setConfirmed(false) }}
                exclude={receiver?.id}
              />

              {/* Arrow divider */}
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <Separator className="flex-1" />
              </div>

              {/* Receiver */}
              <UserPicker
                label="To (Receiver)"
                placeholder="Search by name, email, or user ID..."
                selected={receiver}
                onSelect={u => { setReceiver(u); setConfirmed(false) }}
                onClear={() => { setReceiver(null); setConfirmed(false) }}
                exclude={sender?.id}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Wallet selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Wallet</Label>
                  <Select value={fromWallet} onValueChange={v => { setFromWallet(v as any); setConfirmed(false) }}>
                    <SelectTrigger className="bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trading">
                        <span className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Trading Wallet</span>
                      </SelectItem>
                      <SelectItem value="withdrawal">
                        <span className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-cyan-400" /> Withdrawal Wallet</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {sender && (
                    <p className="text-[11px] text-muted-foreground">
                      Balance: <span className={`font-bold ${isInsufficientBalance ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ${senderBalance.toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">To Wallet</Label>
                  <Select value={toWallet} onValueChange={v => { setToWallet(v as any); setConfirmed(false) }}>
                    <SelectTrigger className="bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trading">
                        <span className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Trading Wallet</span>
                      </SelectItem>
                      <SelectItem value="withdrawal">
                        <span className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-cyan-400" /> Withdrawal Wallet</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {receiver && (
                    <p className="text-[11px] text-muted-foreground">
                      Balance: <span className="font-bold text-cyan-400">
                        ${(toWallet === 'trading' ? receiver.tradingBalance : receiver.withdrawalBalance).toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setConfirmed(false) }}
                    placeholder="0.00"
                    className={`pl-9 bg-muted/30 border-border/50 text-lg font-bold ${
                      isInsufficientBalance ? 'border-rose-500/50 focus:border-rose-500' : ''
                    }`}
                  />
                </div>
                {isInsufficientBalance && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient balance — sender only has ${senderBalance.toFixed(2)} in {fromWallet} wallet.
                  </p>
                )}
                {/* Quick amount buttons */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[10, 50, 100, 250, 500, 1000].map(v => (
                    <button
                      key={v}
                      onClick={() => { setAmount(String(v)); setConfirmed(false) }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/50 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                    >
                      ${v}
                    </button>
                  ))}
                  {sender && senderBalance > 0 && (
                    <button
                      onClick={() => { setAmount(senderBalance.toFixed(2)); setConfirmed(false) }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      Max (${senderBalance.toFixed(2)})
                    </button>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Notes / Reason (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter reason for this transfer, e.g. Bonus credit, Compensation, etc."
                  rows={2}
                  className="bg-muted/30 border-border/50 text-sm resize-none"
                />
              </div>

              {/* Preview / Confirm */}
              {canPreview && !confirmed && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Transfer Preview — Please review before proceeding
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">From</p>
                      <p className="font-semibold text-foreground">{sender?.name}</p>
                      <p className="text-muted-foreground/70">{fromWallet} wallet</p>
                      <p className="text-rose-400 font-bold">-${parsedAmount.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">To</p>
                      <p className="font-semibold text-foreground">{receiver?.name}</p>
                      <p className="text-muted-foreground/70">{toWallet} wallet</p>
                      <p className="text-emerald-400 font-bold">+${parsedAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  {notes && <p className="text-xs text-muted-foreground italic">Note: {notes}</p>}
                  <Button
                    className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                    onClick={() => setShowConfirm(true)}
                    disabled={loading}
                  >
                    <ArrowRightLeft className="h-4 w-4" /> Confirm Transfer
                  </Button>
                </div>
              )}

              {confirmed && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Transfer Completed Successfully</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ${parsedAmount.toFixed(2)} moved from {sender?.name} to {receiver?.name}. Both users notified.
                    </p>
                  </div>
                </div>
              )}

              {!canPreview && !confirmed && (
                <Button className="w-full gap-2" disabled>
                  <ArrowRightLeft className="h-4 w-4" />
                  {!sender ? 'Select Sender' : !receiver ? 'Select Receiver' : !isValidAmount ? 'Enter Amount' : 'Fix Errors to Continue'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Info Panel ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-5 w-5 text-rose-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Today's Transfers</p>
                <p className="text-lg font-bold text-foreground">{history.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString()).length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Total Moved</p>
                <p className="text-lg font-bold text-foreground">
                  ${history.reduce((sum, h) => sum + h.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transfer History (session-scoped) */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Session Transfer History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No transfers made in this session</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                  {history.map(record => (
                    <div key={record.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <span className="truncate max-w-[80px]">{record.fromName}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[80px]">{record.toName}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 shrink-0">${record.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          {record.fromWallet} → {record.toWallet}
                          {record.notes && ` · ${record.notes.slice(0, 30)}${record.notes.length > 30 ? '...' : ''}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(record.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety notes */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Transfer Safeguards
              </p>
              <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>All transfers are atomic — either fully completed or fully rolled back.</li>
                <li>Both users receive in-app notifications automatically.</li>
                <li>Every transfer is recorded in the 5W1H Financial Ledger.</li>
                <li>Sender must have sufficient balance before transfer proceeds.</li>
                <li>Same-user transfers are blocked at API level.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-[420px] max-w-[95vw] p-6 space-y-5">
            <div className="text-center">
              <div className="size-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                <ArrowRightLeft className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold">Confirm Transfer</h3>
              <p className="text-sm text-muted-foreground mt-1">This action is irreversible. Funds will move immediately.</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-semibold">{sender?.name} ({fromWallet})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-semibold">{receiver?.name} ({toWallet})</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg text-primary">${parsedAmount.toFixed(2)}</span>
              </div>
              {notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Note</span>
                  <span className="text-foreground text-right max-w-[220px]">{notes}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={loading}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2 bg-primary" onClick={handleTransfer} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? 'Processing...' : 'Transfer Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
