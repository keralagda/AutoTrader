'use client'

import { useState, useEffect } from 'react'
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

  // Dynamic config loaded from DB setup (with BSC fallbacks)
  const [gatewayConfig, setGatewayConfig] = useState({
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    contractAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    explorerUrl: 'https://bscscan.com/tx/',
    minAmount: 10,
    maxAmount: 100000,
  })

  useEffect(() => {
    if (!open) return
    fetch('/api/payment-gateways')
      .then(res => res.json())
      .then(data => {
        // Find gateway matching BEP-20 or network bsc
        const bscGateway = data.find((g: any) => 
          g.name.toLowerCase().includes('bep-20') || 
          g.name.toLowerCase().includes('bep20') || 
          (g.network && g.network.toLowerCase() === 'bsc')
        )
        if (bscGateway) {
          setGatewayConfig({
            address: bscGateway.address || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            contractAddress: bscGateway.apiSecret || '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
            explorerUrl: bscGateway.webhookUrl || 'https://bscscan.com/tx/',
            minAmount: bscGateway.minAmount || 10,
            maxAmount: bscGateway.maxAmount || 100000,
          })
        }
      })
      .catch(err => console.error('Failed to load active BEP-20 gateway configuration:', err))
  }, [open])

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

    if (amountNum < gatewayConfig.minAmount || amountNum > gatewayConfig.maxAmount) {
      toast({ 
        title: 'Limit Check Failed', 
        description: `Amount must be between $${gatewayConfig.minAmount} and $${gatewayConfig.maxAmount.toLocaleString()}`, 
        variant: 'destructive' 
      })
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
    await navigator.clipboard.writeText(gatewayConfig.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-400" />
            USDC (BEP-20) Deposit
          </DialogTitle>
          <DialogDescription>
            Deposit USDC on BSC (Binance Smart Chain) network to your trading wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Address */}
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground font-semibold">USDC BEP-20 Receive Address</Label>
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
                <code className="flex-1 text-xs font-mono truncate">{gatewayConfig.address}</code>
              </div>
              
              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                <span>Contract Address:</span>
                <span className="font-mono text-foreground font-medium select-all">{gatewayConfig.contractAddress.slice(0, 8)}...{gatewayConfig.contractAddress.slice(-8)}</span>
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
                Minimum: ${gatewayConfig.minAmount} | Maximum: ${gatewayConfig.maxAmount.toLocaleString()}
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
                Paste your transaction hash from BSC Explorer (BscScan)
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Wallet className="size-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Send USDC (BEP-20) to the address above on BSC network</p>
                <p>2. Wait for network confirmations (usually 1-3 minutes)</p>
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
