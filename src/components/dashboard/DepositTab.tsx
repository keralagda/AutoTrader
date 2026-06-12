'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BankTransferModal } from './BankTransferModal'
import { MetaMaskConnect } from './MetaMaskConnect'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  CreditCard,
  DollarSign,
  Wallet,
  Bitcoin,
  Landmark,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react'
import type { PaymentGatewayType } from '@/lib/types'

interface DepositRecord {
  id: string
  amount: number
  method: string
  status: string
  createdAt: string
}

export function DepositTab() {
  const { user, updateUserWallets } = useAppStore()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [gateways, setGateways] = useState<PaymentGatewayType[]>([])
  const [deposits, setDeposits] = useState<DepositRecord[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bankTransferOpen, setBankTransferOpen] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [proofUrl, setProofUrl] = useState('')

  const parsedAmount = parseFloat(amount) || 0
  const tradingBalance = user?.tradingBalance || 0
  const withdrawalBalance = user?.withdrawalBalance || 0
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isVerificationRequired = user?.isEmailVerified === false && !isAdmin

  const fetchGateways = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-gateways?t=' + Date.now(), { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setGateways(data)
        if (data.length > 0) {
          const defaultGw = data.find((g: any) => g.isActive && g.name.toLowerCase() !== 'metamask')
            || data.find((g: any) => g.isActive)
            || data[0]
          if (defaultGw) {
            setPaymentMethod(defaultGw.id)
          }
        }
      }
    } catch {}
  }, [])

  const fetchDeposits = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/deposits/fund?userId=${user.id}`)
      if (res.ok) {
        setDeposits(await res.json())
      }
    } catch {}
  }, [user?.id])

  useEffect(() => {
    fetchGateways()
    fetchDeposits()
  }, [fetchGateways, fetchDeposits])

  const selectedGateway = gateways.find(g => g.id === paymentMethod)
  const isMetaMask = selectedGateway ? selectedGateway.name.toLowerCase() === 'metamask' : paymentMethod === 'metamask'

  const handleDeposit = async () => {
    if (!user?.id || parsedAmount <= 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/deposits/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: parsedAmount,
          method: selectedGateway?.name || paymentMethod,
          txHash: txHash || undefined,
          proofUrl: proofUrl || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        updateUserWallets(data.tradingBalance, data.withdrawalBalance)
        setSuccess(true)
        setAmount('')
        setTxHash('')
        setProofUrl('')

        if (data.status === 'pending') {
          toast({ title: 'Deposit Submitted!', description: 'Awaiting admin approval. You will be notified once confirmed.' })
        } else {
          toast({ title: 'Deposit Confirmed!', description: `$${parsedAmount.toFixed(2)} added to your Trading Wallet` })
        }
        fetchDeposits()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json()
        toast({ title: 'Deposit Failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyAddress = async () => {
    if (selectedGateway?.address) {
      await navigator.clipboard.writeText(selectedGateway.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Deposit Funds</h2>
        <p className="text-sm text-muted-foreground">Add funds to your Trading Wallet</p>
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-card">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Wallet className="size-4 text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium">Trading Wallet</p>
            </div>
            <span className="text-3xl font-bold text-emerald-400">${tradingBalance.toFixed(2)}</span>
            <p className="text-xs text-muted-foreground mt-1">Used for plan investments</p>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-card">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Wallet className="size-4 text-cyan-400" />
              <p className="text-xs text-cyan-400 font-medium">Withdrawal Wallet</p>
            </div>
            <span className="text-3xl font-bold text-cyan-400">${withdrawalBalance.toFixed(2)}</span>
            <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Form */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            Add Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVerificationRequired && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5">
              <span className="text-amber-500 text-sm">⚠️</span>
              <div className="text-xs">
                <p className="font-semibold text-amber-400">Email Verification Required</p>
                <p className="text-muted-foreground mt-0.5">Please verify your email address to unlock deposits. Use the button in the banner at the top of the page to resend the verification email.</p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gateways.length > 0 ? gateways.map(gw => {
                const isSelected = paymentMethod === gw.id
                return (
                  <button
                    key={gw.id}
                    onClick={() => setPaymentMethod(gw.id)}
                    disabled={isVerificationRequired}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    } ${isVerificationRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {gw.type === 'manual' ? (
                      <CreditCard className="size-4" />
                    ) : (
                      <Bitcoin className="size-4" />
                    )}
                    <span className="truncate">{gw.name}</span>
                  </button>
                )
              }) : (
                <>
                  <button
                    onClick={() => setPaymentMethod('metamask')}
                    disabled={isVerificationRequired}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${paymentMethod === 'metamask' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-border/50 text-muted-foreground'} ${isVerificationRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Bitcoin className="size-4" /> MetaMask
                  </button>
                  <button
                    onClick={() => setPaymentMethod('coinpayments')}
                    disabled={isVerificationRequired}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${paymentMethod === 'coinpayments' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-border/50 text-muted-foreground'} ${isVerificationRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Bitcoin className="size-4" /> CoinPayments
                  </button>
                  <button
                    onClick={() => setPaymentMethod('nowpayments')}
                    disabled={isVerificationRequired}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${paymentMethod === 'nowpayments' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-border/50 text-muted-foreground'} ${isVerificationRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Bitcoin className="size-4" /> NOWPayments
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Gateway Details (if crypto or manual and NOT MetaMask) */}
          {selectedGateway && !isMetaMask && (selectedGateway.address || selectedGateway.instructions || selectedGateway.qrImage) && (
            <div className="rounded-lg bg-muted/50 border border-border/50 p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                {selectedGateway.type === 'manual' ? 'Payment Details:' : 'Send funds to this address:'}
              </p>

              {/* QR Code */}
              {(selectedGateway.qrImage || selectedGateway.address) && (
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    {selectedGateway.qrImage ? (
                      <img
                        src={selectedGateway.qrImage}
                        alt="Payment QR Code"
                        className="size-[180px] object-contain"
                      />
                    ) : selectedGateway.address ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedGateway.address)}&bgcolor=ffffff&color=000000&margin=0`}
                        alt="Payment QR Code"
                        className="size-[180px]"
                      />
                    ) : null}
                  </div>
                </div>
              )}
              {(selectedGateway.qrImage || selectedGateway.address) && (
                <p className="text-[10px] text-center text-muted-foreground">Scan QR code or copy address below</p>
              )}

              {/* Address / Details */}
              {selectedGateway.address && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-background/50 rounded px-2 py-1.5 truncate" dir="ltr">
                    {selectedGateway.address}
                  </code>
                  <Button variant="outline" size="icon" className="shrink-0 size-8" onClick={handleCopyAddress} disabled={isVerificationRequired}>
                    {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              )}

              {/* Instructions */}
              {selectedGateway.instructions && (
                <div className="rounded-lg bg-background/30 border border-border/30 p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Instructions:</p>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{selectedGateway.instructions}</p>
                </div>
              )}

              {selectedGateway.type !== 'manual' && selectedGateway.network && (
                <p className="text-[10px] text-amber-400 text-center">⚠️ Network: {
                  selectedGateway.network === 'bsc' ? 'BNB Smart Chain (BEP-20)' :
                  selectedGateway.network === 'tron' ? 'TRON (TRC-20)' :
                  selectedGateway.network === 'ethereum' ? 'Ethereum (ERC-20)' :
                  selectedGateway.network === 'bitcoin' ? 'Bitcoin' :
                  selectedGateway.network?.toUpperCase()
                } — Send only on this network!</p>
              )}
            </div>
          )}

          {/* MetaMask Connect (when MetaMask is selected) */}
          {isMetaMask && (
            <MetaMaskConnect />
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-9"
                min="0"
                step="0.01"
                disabled={isVerificationRequired}
              />
            </div>
            <div className="flex gap-2">
              {[50, 100, 500, 1000].map(val => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setAmount(val.toString())}
                  disabled={isVerificationRequired}
                >
                  ${val}
                </Button>
              ))}
            </div>
          </div>

          {/* Proof of Deposit */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground">Proof of Deposit (Required)</p>
            <div className="space-y-2">
              <Label className="text-xs">Transaction Hash / Reference ID</Label>
              <Input
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                placeholder="0x... or UTR number or payment reference"
                className="font-mono text-xs"
                disabled={isVerificationRequired}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Payment Screenshot</Label>
              {/* File Upload */}
              <div className="space-y-2">
                {proofUrl ? (
                  <div className="relative rounded-lg border border-border/50 overflow-hidden">
                    <img src={proofUrl} alt="Proof" className="w-full max-h-48 object-contain bg-muted/20" />
                    <button
                      onClick={() => setProofUrl('')}
                      disabled={isVerificationRequired}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/30 cursor-pointer transition-colors bg-muted/10 ${isVerificationRequired ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <svg className="h-8 w-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-xs text-muted-foreground">Click to upload screenshot</span>
                    <span className="text-[10px] text-muted-foreground/60">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isVerificationRequired}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) {
                          toast({ title: 'File too large', description: 'Max 5MB allowed', variant: 'destructive' })
                          return
                        }
                        // Convert to base64 data URL for preview and storage
                        const reader = new FileReader()
                        reader.onload = () => {
                          setProofUrl(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                )}
                {/* Or paste URL */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[10px] text-muted-foreground">or paste URL</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <Input
                  value={proofUrl.startsWith('data:') ? '' : proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  placeholder="https://... image URL"
                  className="text-xs h-8"
                  disabled={isVerificationRequired}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {parsedAmount > 0 && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You deposit</span>
                <span className="font-bold text-emerald-400">${parsedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Goes to</span>
                <span className="text-emerald-400">Trading Wallet</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={submitting || parsedAmount <= 0 || isVerificationRequired}
          >
            {submitting ? (
              <><Loader2 className="size-4 animate-spin mr-2" /> Processing...</>
            ) : success ? (
              <><CheckCircle2 className="size-4 mr-2" /> Deposited!</>
            ) : (
              'Confirm Deposit'
            )}
          </Button>

          {/* Alternative: Bank Transfer */}
          <div className="text-center">
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground mb-2">Or deposit via wire transfer</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBankTransferOpen(true)}
              className="gap-2"
              disabled={isVerificationRequired}
            >
              <Landmark className="size-3.5" />
              EU/US Wire Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit History */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          {deposits.length > 0 ? (
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">${(d.amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{d.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${
                          d.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                          d.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {d.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-6">No deposits yet</p>
          )}
        </CardContent>
      </Card>

      {/* Bank Transfer Modal */}
      <BankTransferModal open={bankTransferOpen} onOpenChange={setBankTransferOpen} onSuccess={fetchDeposits} />
    </div>
  )
}
