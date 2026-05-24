'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Shield, Wallet, Loader2, CheckCircle2 } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function RazorpayDepositModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('upi')

  const handleDeposit = async () => {
    if (!user?.id) return
    if (!amount) {
      toast({ title: 'Error', description: 'Please enter amount', variant: 'destructive' })
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 10) {
      toast({ title: 'Error', description: 'Minimum amount is ₹10', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      // Create Razorpay order
      const orderRes = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: amountNum,
          paymentMethod,
        }),
      })

      if (!orderRes.ok) {
        const data = await orderRes.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        setSubmitting(false)
        return
      }

      const orderData = await orderRes.json()

      // Initialize Razorpay payment
      if (window.Razorpay) {
        const razorpayOptions = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'bnfx',
          description: 'Deposit to Trading Wallet',
          order_id: orderData.orderId,
          handler: async function (response: any) {
            // Verify payment
            const verifyRes = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: orderData.receipt,
              }),
            })

            if (verifyRes.ok) {
              toast({ title: 'Deposit Successful!', description: `₹${amountNum.toFixed(2)} added to your Trading Wallet` })
              setAmount('')
              onOpenChange(false)
            } else {
              toast({ title: 'Error', description: 'Payment verification failed', variant: 'destructive' })
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false)
            },
          },
        }

        const rzp = new window.Razorpay(razorpayOptions)
        rzp.open()
      } else {
        // Fallback: Show manual payment instructions
        toast({ title: 'Razorpay not loaded', description: 'Please contact support for manual payment', variant: 'destructive' })
        setSubmitting(false)
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-cyan-400" />
            UPI / Razorpay Deposit
          </DialogTitle>
          <DialogDescription>
            Deposit funds using UPI, cards, or net banking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'upi', label: 'UPI', icon: 'UPI' },
                { id: 'card', label: 'Card', icon: '💳' },
                { id: 'netbanking', label: 'NetBanking', icon: '🏦' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    paymentMethod === method.id
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  {method.icon}
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-7"
                min="10"
                step="1"
              />
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map(val => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setAmount(val.toString())}
                >
                  ₹{val}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: ₹10 | Maximum: ₹1,00,000
            </p>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Wallet className="size-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Select payment method and enter amount</p>
                <p>2. Click "Confirm Deposit"</p>
                <p>3. Complete payment in Razorpay popup</p>
                <p>4. Funds will be credited to your Trading Wallet</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={submitting || !amount}
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
