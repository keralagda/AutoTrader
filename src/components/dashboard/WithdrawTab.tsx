'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { WithdrawalType, PaymentGatewayType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Wallet, AlertCircle, Loader2, ArrowRightLeft, Bitcoin, Landmark } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ALL_PAYMENT_METHODS } from '@/lib/types'

const NETWORK_FEE_PERCENT = 2

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'approved':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'rejected':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getMethodLabel(method: string) {
  const found = ALL_PAYMENT_METHODS.find(m => m.value === method)
  return found ? found.label : method
}

export function WithdrawTab() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [withdrawals, setWithdrawals] = useState<WithdrawalType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '')
  const [paymentMethod, setPaymentMethod] = useState('crypto_usdc')
  const [gateways, setGateways] = useState<PaymentGatewayType[]>([])

  const withdrawalBalance = user?.withdrawalBalance || 0
  const tradingBalance = user?.tradingBalance || 0
  const parsedAmount = parseFloat(amount) || 0
  const networkFee = parsedAmount * (NETWORK_FEE_PERCENT / 100)
  const youReceive = parsedAmount - networkFee

  const fetchWithdrawals = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/withdrawals?userId=${user.id}`)
      if (res.ok) {
        const json = await res.json()
        setWithdrawals(json)
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchGateways = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-gateways')
      if (res.ok) {
        const data = await res.json()
        setGateways(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchWithdrawals()
    fetchGateways()
  }, [fetchWithdrawals, fetchGateways])

  useEffect(() => {
    if (user?.walletAddress) {
      setWalletAddress(user.walletAddress)
    }
  }, [user?.walletAddress])

  const handleQuickSelect = (value: number) => {
    if (value >= withdrawalBalance) {
      setAmount(withdrawalBalance.toFixed(2))
    } else {
      setAmount(value.toFixed(2))
    }
  }

  const handleSubmit = async () => {
    if (!user?.id) return
    if (parsedAmount < 10) {
      toast({ title: 'Minimum withdrawal is $10', variant: 'destructive' })
      return
    }
    if (parsedAmount > withdrawalBalance) {
      toast({
        title: 'Insufficient withdrawal balance',
        description: `You have $${withdrawalBalance.toFixed(2)} in your Withdrawal Wallet. Transfer funds from your Trading Wallet first.`,
        variant: 'destructive',
      })
      return
    }
    if (!walletAddress.trim()) {
      toast({ title: 'Wallet address required', variant: 'destructive' })
      return
    }

    // Basic wallet address validation
    const addr = walletAddress.trim()
    const isCrypto = paymentMethod.startsWith('crypto_') || paymentMethod === 'metamask'
    if (isCrypto) {
      // Ethereum/ERC-20 address validation
      if (paymentMethod.includes('ethereum') || paymentMethod.includes('erc') || paymentMethod === 'metamask') {
        if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
          toast({ title: 'Invalid Ethereum address', description: 'Must start with 0x followed by 40 hex characters', variant: 'destructive' })
          return
        }
      }
      // Bitcoin address validation (basic)
      if (paymentMethod.includes('bitcoin') || paymentMethod.includes('btc')) {
        if (!/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(addr)) {
          toast({ title: 'Invalid Bitcoin address', variant: 'destructive' })
          return
        }
      }
      // TRON/TRC-20 validation
      if (paymentMethod.includes('tron') || paymentMethod.includes('trc')) {
        if (!/^T[a-zA-Z0-9]{33}$/.test(addr)) {
          toast({ title: 'Invalid TRON address', description: 'Must start with T followed by 33 characters', variant: 'destructive' })
          return
        }
      }
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: parsedAmount,
          walletAddress: walletAddress.trim(),
          paymentMethod,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Withdrawal submitted!',
          description: `${formatCurrency(parsedAmount)} withdrawal request has been submitted via ${getMethodLabel(paymentMethod)}.`,
        })
        setAmount('')
        fetchWithdrawals()
      } else {
        const json = await res.json()
        toast({ title: 'Withdrawal failed', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', description: 'Please try again later', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Dual Wallet Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-card backdrop-blur-sm">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <TrendingUpIcon className="size-4 text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium">Trading Wallet</p>
            </div>
            <span className="text-3xl font-bold text-emerald-400">{tradingBalance.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground ml-1">USDC</span>
            <p className="text-xs text-muted-foreground mt-1">For deposits & earning</p>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-card backdrop-blur-sm">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Wallet className="size-4 text-cyan-400" />
              <p className="text-xs text-cyan-400 font-medium">Withdrawal Wallet</p>
            </div>
            <span className="text-3xl font-bold text-cyan-400">{withdrawalBalance.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground ml-1">USDC</span>
            <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Form */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            Withdraw Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.isEmailVerified === false && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5">
              <span className="text-amber-500 text-sm">⚠️</span>
              <div className="text-xs">
                <p className="font-semibold text-amber-400">Email Verification Required</p>
                <p className="text-muted-foreground mt-0.5">Please verify your email address to unlock withdrawals. Use the button in the banner at the top of the page to resend the verification email.</p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gateways.length > 0 ? gateways.map(gw => (
                <button
                  key={gw.id}
                  onClick={() => {
                    setPaymentMethod(gw.type === 'crypto' ? `crypto_${gw.network || 'usdc'}` : gw.name.toLowerCase().replace(/\s+/g, '_'))
                    setWalletAddress('')
                  }}
                  disabled={user?.isEmailVerified === false}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    paymentMethod === (gw.type === 'crypto' ? `crypto_${gw.network || 'usdc'}` : gw.name.toLowerCase().replace(/\s+/g, '_'))
                      ? gw.type === 'crypto'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  } ${user?.isEmailVerified === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {gw.type === 'crypto' ? (
                    <Bitcoin className="size-4" />
                  ) : (
                    <Landmark className="size-4" />
                  )}
                  <span className="truncate">{gw.name}</span>
                </button>
              )) : (
                ALL_PAYMENT_METHODS.map(method => (
                  <button
                    key={method.value}
                    onClick={() => { setPaymentMethod(method.value); setWalletAddress('') }}
                    disabled={user?.isEmailVerified === false}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      paymentMethod === method.value
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    } ${user?.isEmailVerified === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>{method.icon}</span>
                    <span className="truncate">{method.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                min="0"
                step="0.01"
                disabled={user?.isEmailVerified === false}
              />
            </div>
            <div className="flex gap-2">
              {[10, 50, 100].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(val)}
                  className="flex-1 text-xs"
                  disabled={user?.isEmailVerified === false}
                >
                  ${val}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(withdrawalBalance)}
                className="flex-1 text-xs text-primary"
                disabled={user?.isEmailVerified === false}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Wallet Address / UPI ID */}
          <div className="space-y-2">
            <Label htmlFor="wallet">
              {paymentMethod.startsWith('crypto') ? 'Wallet Address' :
               paymentMethod === 'upi' ? 'UPI ID' :
               paymentMethod === 'razorpay' ? 'Registered Email / Phone' :
               'Account Details'}
            </Label>
            <Input
              id="wallet"
              placeholder={
                paymentMethod.startsWith('crypto') ? 'Enter your wallet address' :
                paymentMethod === 'upi' ? 'yourname@upi' :
                paymentMethod === 'razorpay' ? 'email@example.com' :
                'Enter your account details'
              }
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              disabled={user?.isEmailVerified === false}
            />
          </div>

          {/* Fee Summary */}
          <div className="rounded-lg bg-muted/50 border border-border/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span>{formatCurrency(parsedAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee ({NETWORK_FEE_PERCENT}%)</span>
              <span className="text-amber-400">-{formatCurrency(networkFee)}</span>
            </div>
            <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-medium">
              <span>You&apos;ll Receive</span>
              <span className="text-emerald-400">{formatCurrency(Math.max(0, youReceive))}</span>
            </div>
          </div>

          {parsedAmount > withdrawalBalance && parsedAmount > 0 && (
            <div className="flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="size-4" />
              <span>Insufficient withdrawal balance. Transfer funds from Trading Wallet.</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || parsedAmount <= 0 || parsedAmount > withdrawalBalance || !walletAddress.trim() || user?.isEmailVerified === false}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Withdrawal'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Withdrawals */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : withdrawals.length > 0 ? (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Method</TableHead>
                    <TableHead className="hidden md:table-cell">Wallet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">TX Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(w.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(w.amount)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getMethodLabel(w.paymentMethod || 'crypto_usdc')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-32 truncate">
                        {w.walletAddress}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(w.status)}`}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground max-w-24 truncate">
                        {(w as any).txHash ? (
                          <span className="text-emerald-400" title={(w as any).txHash}>
                            {(w as any).txHash.substring(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No withdrawals yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
