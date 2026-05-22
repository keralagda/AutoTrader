'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Shield, Wallet, Copy, Check, ExternalLink, Loader2 } from 'lucide-react'

export function USDCDepositModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
  const POLYGON_EXPLORER = 'https://polygonscan.com/tx/'

  const handleDeposit = async () => {
    if (!user?.id) return
    if (!amount || !txHash) {
      toast({ title: 'Error', description: 'Please enter amount and transaction hash', variant: 'destructive' })
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: 'Error', description: 'Invalid amount', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/payment/usdc/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: amountNum,
          txHash,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Deposit Initiated', description: 'Please wait for confirmation' })
        setAmount('')
        setTxHash('')
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create deposit', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(USDC_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-400" />
            USDC (Polygon) Deposit
          </DialogTitle>
          <DialogDescription>
            Deposit USDC on Polygon network to your trading wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Address */}
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">USDC Contract Address</Label>
                <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-8 px-2">
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400 mr-1" />
                      <span className="text-xs text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                <code className="flex-1 text-xs font-mono truncate">{USDC_ADDRESS}</code>
                <a
                  href={`${POLYGON_EXPLORER}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Amount (USDC)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-7"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: $10 | Maximum: $100,000
              </p>
            </div>

            <div className="space-y-2">
              <Label>Transaction Hash (TxHash)</Label>
              <Input
                type="text"
                placeholder="0x..."
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Paste your transaction hash from Polygon Explorer
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Wallet className="size-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Send USDC (Polygon) to the address above</p>
                <p>2. Wait for network confirmation (6-10 minutes)</p>
                <p>3. Paste your transaction hash below</p>
                <p>4. Admin will verify and credit your wallet</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={submitting || !amount || !txHash}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Confirm Deposit'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
