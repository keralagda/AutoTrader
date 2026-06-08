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

  // Network and address states
  const [network, setNetwork] = useState<'bsc' | 'tron'>('bsc')
  const [bscAddress, setBscAddress] = useState(user?.usdcBscAddress || '')
  const [tronAddress, setTronAddress] = useState(user?.usdcTronAddress || '')
  const [loadingAddress, setLoadingAddress] = useState(false)

  // Standard config limits
  const [limits, setLimits] = useState({
    minAmount: 10,
    maxAmount: 100000,
  })

  useEffect(() => {
    if (!open || !user?.id) return

    // Load gateway limits if custom gateways are configured
    fetch('/api/payment-gateways')
      .then(res => res.json())
      .then(data => {
        const bscGateway = data.find((g: any) => 
          g.name.toLowerCase().includes('bep-20') || 
          g.name.toLowerCase().includes('bep20') || 
          (g.network && g.network.toLowerCase() === 'bsc') ||
          g.name.toLowerCase().includes('usdc')
        )
        if (bscGateway) {
          setLimits({
            minAmount: bscGateway.minAmount || 10,
            maxAmount: bscGateway.maxAmount || 100000,
          })
        }
      })
      .catch(err => console.error('Failed to load limits:', err))

    // Trigger address generation/derivation automatically for user
    const deriveAddresses = async () => {
      setLoadingAddress(true)
      try {
        const res = await fetch('/api/payment/usdc/generate-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        if (res.ok) {
          const data = await res.json()
          setBscAddress(data.bscAddress)
          setTronAddress(data.tronAddress)
        }
      } catch (err) {
        console.error('Failed to generate USDC addresses:', err)
      } finally {
        setLoadingAddress(false)
      }
    }

    deriveAddresses()
  }, [open, user?.id])

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

    if (amountNum < limits.minAmount || amountNum > limits.maxAmount) {
      toast({ 
        title: 'Limit Check Failed', 
        description: `Amount must be between $${limits.minAmount} and $${limits.maxAmount.toLocaleString()}`, 
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
          method: network === 'bsc' ? 'crypto_usdc_bsc' : 'crypto_usdc_tron',
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
    const addressToCopy = network === 'bsc' ? bscAddress : tronAddress
    if (!addressToCopy) return
    await navigator.clipboard.writeText(addressToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-400" />
            USDC Deposit
          </DialogTitle>
          <DialogDescription>
            Choose your network and send USDC to the generated address below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Network Selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-semibold">Select Network</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNetwork('bsc')}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  network === 'bsc'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                BSC (BEP-20)
              </button>
              <button
                onClick={() => setNetwork('tron')}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  network === 'tron'
                    ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                    : 'border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                TRON (TRC-20)
              </button>
            </div>
          </div>

          {/* Wallet Address */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground font-semibold">
                  USDC {network === 'bsc' ? 'BEP-20' : 'TRC-20'} Receive Address
                </Label>
                <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-8 px-2" disabled={loadingAddress}>
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
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50 min-h-[38px] justify-center">
                {loadingAddress ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (network === 'bsc' ? bscAddress : tronAddress) ? (
                  <code className="flex-1 text-xs font-mono truncate text-center select-all">
                    {network === 'bsc' ? bscAddress : tronAddress}
                  </code>
                ) : (
                  <span className="text-xs text-muted-foreground">Deriving address...</span>
                )}
              </div>
              
              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                <span>Token Contract:</span>
                <span className="font-mono text-foreground font-medium select-all">
                  {network === 'bsc'
                    ? '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'.slice(0, 8) + '...' + '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'.slice(-8)
                    : 'TEv8pB3VkvE3pZg55j2VdbT1777d137777'.slice(0, 8) + '...' + 'TEv8pB3VkvE3pZg55j2VdbT1777d137777'.slice(-8)}
                </span>
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
                Minimum: ${limits.minAmount} | Maximum: ${limits.maxAmount.toLocaleString()}
              </p>
            </div>
 
            <div className="space-y-2">
              <Label>Transaction Hash (TxHash)</Label>
              <Input
                type="text"
                placeholder={network === 'bsc' ? "0x..." : "Enter TRON Transaction ID"}
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Paste your transaction hash from {network === 'bsc' ? 'BSC Explorer (BscScan)' : 'TRON Explorer (TronScan)'}
              </p>
            </div>
          </div>
 
          {/* Info */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Wallet className="size-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Send USDC ({network === 'bsc' ? 'BEP-20' : 'TRC-20'}) to the address above on {network === 'bsc' ? 'BSC' : 'TRON'} network</p>
                <p>2. Wait for network confirmations (usually 1-3 minutes)</p>
                <p>3. Paste your transaction hash/ID below</p>
                <p>4. Admin will verify and credit your wallet</p>
              </div>
            </div>
          </div>
 
          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={submitting || !amount || !txHash || loadingAddress || !(network === 'bsc' ? bscAddress : tronAddress)}
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
