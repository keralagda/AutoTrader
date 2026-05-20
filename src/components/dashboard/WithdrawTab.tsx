'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { WithdrawalType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { DollarSign, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

export function WithdrawTab() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [withdrawals, setWithdrawals] = useState<WithdrawalType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '')

  const balance = user?.balance || 0
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

  useEffect(() => {
    fetchWithdrawals()
  }, [fetchWithdrawals])

  useEffect(() => {
    if (user?.walletAddress) {
      setWalletAddress(user.walletAddress)
    }
  }, [user?.walletAddress])

  const handleQuickSelect = (value: number) => {
    if (value >= balance) {
      setAmount(balance.toFixed(2))
    } else {
      setAmount(value.toFixed(2))
    }
  }

  const handleSubmit = async () => {
    if (!user?.id) return
    if (parsedAmount < 10) {
      toast({
        title: 'Minimum withdrawal is $10',
        variant: 'destructive',
      })
      return
    }
    if (parsedAmount > balance) {
      toast({
        title: 'Insufficient balance',
        variant: 'destructive',
      })
      return
    }
    if (!walletAddress.trim()) {
      toast({
        title: 'Wallet address required',
        variant: 'destructive',
      })
      return
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
        }),
      })

      if (res.ok) {
        toast({
          title: 'Withdrawal submitted!',
          description: `${formatCurrency(parsedAmount)} withdrawal request has been submitted.`,
        })
        setAmount('')
        fetchWithdrawals()
      } else {
        const json = await res.json()
        toast({
          title: 'Withdrawal failed',
          description: json.error || 'Something went wrong',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Network error',
        description: 'Please try again later',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Balance Display */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-card backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="size-8 text-primary" />
            <span className="text-4xl font-bold text-primary">{balance.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground ml-1">USDC</span>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            Withdraw Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                >
                  ${val}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(balance)}
                className="flex-1 text-xs text-primary"
              >
                Max
              </Button>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input
              id="wallet"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
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

          {parsedAmount > balance && parsedAmount > 0 && (
            <div className="flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="size-4" />
              <span>Insufficient balance</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || parsedAmount <= 0 || parsedAmount > balance || !walletAddress.trim()}
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
                    <TableHead className="hidden sm:table-cell">Wallet</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(w.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(w.amount)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-32 truncate">
                        {w.walletAddress}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(w.status)}`}
                        >
                          {w.status}
                        </Badge>
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
