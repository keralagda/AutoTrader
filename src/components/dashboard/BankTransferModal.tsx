'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Building2, Copy, Check, Loader2, AlertCircle } from 'lucide-react'

interface BankDetails {
  bankName: string
  accountNumber: string
  ifscCode: string
  accountHolder: string
  branch: string
}

interface BankTransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BankTransferModal({ open, onOpenChange }: BankTransferModalProps) {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    amount: '',
    referenceNumber: '',
    bankName: '',
    accountHolder: '',
  })

  useEffect(() => {
    if (open) {
      loadBankDetails()
    }
  }, [open])

  const loadBankDetails = async () => {
    try {
      const res = await fetch('/api/payment/bank-transfer')
      if (res.ok) {
        const data = await res.json()
        setBankDetails(data.bankDetails)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleSubmit = async () => {
    if (!form.amount || !form.referenceNumber) {
      toast({ title: 'Amount and reference number are required', variant: 'destructive' })
      return
    }

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount < 10) {
      toast({ title: 'Minimum deposit is $10', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/payment/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount: form.amount,
          referenceNumber: form.referenceNumber,
          bankName: form.bankName,
          accountHolder: form.accountHolder,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Bank transfer submitted', description: 'Awaiting admin verification.' })
        onOpenChange(false)
        setForm({ amount: '', referenceNumber: '', bankName: '', accountHolder: '' })
      } else {
        toast({ title: data.error || 'Submission failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Bank Transfer Deposit
          </DialogTitle>
          <DialogDescription>
            Transfer funds to our bank account and submit the reference number for verification.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bank Details */}
            {bankDetails && (
              <div className="rounded-lg bg-muted/30 border border-border/50 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Transfer to:</p>
                <div className="space-y-2">
                  {[
                    { label: 'Bank', value: bankDetails.bankName, key: 'bank' },
                    { label: 'Account', value: bankDetails.accountNumber, key: 'account' },
                    { label: 'IFSC', value: bankDetails.ifscCode, key: 'ifsc' },
                    { label: 'Name', value: bankDetails.accountHolder, key: 'name' },
                    { label: 'Branch', value: bankDetails.branch, key: 'branch' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">{item.label}: </span>
                        <span className="text-sm font-mono">{item.value}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(item.value, item.key)}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        {copied === item.key ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Submission Form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Deposit Amount (USD)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="100.00"
                  min="10"
                />
              </div>

              <div className="space-y-2">
                <Label>Transaction Reference / UTR Number *</Label>
                <Input
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                  placeholder="Enter bank reference number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Your Bank Name</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="e.g. SBI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder</Label>
                  <Input
                    value={form.accountHolder}
                    onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-400">
                Deposits are verified manually within 24 hours. Ensure the reference number is correct.
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit Bank Transfer'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
