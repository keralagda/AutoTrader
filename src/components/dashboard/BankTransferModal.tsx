'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Building2, Copy, Check, Loader2, AlertCircle, Globe } from 'lucide-react'

interface BankTransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SupportedBank {
  id: string
  name: string
  swift: string
  country: string
  flag: string
}

export function BankTransferModal({ open, onOpenChange }: BankTransferModalProps) {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [receivingBank, setReceivingBank] = useState<any>(null)
  const [supportedBanks, setSupportedBanks] = useState<{ us: SupportedBank[]; eu: SupportedBank[] }>({ us: [], eu: [] })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    amount: '',
    referenceNumber: '',
    bankName: '',
    senderName: '',
    senderIban: '',
  })

  useEffect(() => {
    if (open) {
      fetch('/api/payment/bank-transfer')
        .then(r => r.json())
        .then(data => {
          setReceivingBank(data.receivingBank)
          setSupportedBanks(data.supportedBanks || { us: [], eu: [] })
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    toast({ title: 'Copied!' })
    setTimeout(() => setCopied(''), 2000)
  }

  const handleSubmit = async () => {
    if (!form.amount || !form.referenceNumber) {
      toast({ title: 'Amount and reference number required', variant: 'destructive' })
      return
    }
    if (parseFloat(form.amount) < 10) {
      toast({ title: 'Minimum deposit is $10', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/payment/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, ...form }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Wire transfer submitted', description: 'Processing: 1-3 business days.' })
        onOpenChange(false)
        setForm({ amount: '', referenceNumber: '', bankName: '', senderName: '', senderIban: '' })
      } else {
        toast({ title: data.error || 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const CopyField = ({ label, value, field }: { label: string; value: string; field: string }) => (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="text-[10px] text-muted-foreground block">{label}</span>
        <span className="text-sm font-mono" dir="ltr">{value}</span>
      </div>
      <button onClick={() => handleCopy(value, field)} className="p-1.5 rounded hover:bg-muted">
        {copied === field ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
      </button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            EU/US Wire Transfer
          </DialogTitle>
          <DialogDescription>
            Send a wire transfer from your bank and submit the reference for verification.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {/* Receiving Bank Details */}
            {receivingBank && (
              <div className="rounded-xl bg-gradient-to-br from-emerald-500/5 to-card border border-emerald-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Send funds to:</p>
                <CopyField label="Bank" value={receivingBank.bankName} field="bank" />
                <CopyField label="Account Holder" value={receivingBank.accountHolder} field="holder" />
                {receivingBank.iban && <CopyField label="IBAN" value={receivingBank.iban} field="iban" />}
                {receivingBank.swift && <CopyField label="SWIFT/BIC" value={receivingBank.swift} field="swift" />}
                {receivingBank.routingNumber && <CopyField label="Routing Number" value={receivingBank.routingNumber} field="routing" />}
                {receivingBank.accountNumber && <CopyField label="Account Number" value={receivingBank.accountNumber} field="accnum" />}
                <div className="pt-2">
                  <span className="text-[10px] text-muted-foreground block">Reference (include in transfer)</span>
                  <span className="text-sm font-mono text-amber-400" dir="ltr">BNFX-{user?.id?.slice(0, 8)}</span>
                </div>
              </div>
            )}

            {/* Supported Banks */}
            <Tabs defaultValue="eu" className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Supported Banks</p>
                <TabsList className="h-7">
                  <TabsTrigger value="eu" className="text-[10px] h-6 px-2">🇪🇺 EU</TabsTrigger>
                  <TabsTrigger value="us" className="text-[10px] h-6 px-2">🇺🇸 US</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="eu" className="mt-1">
                <div className="flex flex-wrap gap-1.5">
                  {supportedBanks.eu.map(bank => (
                    <Badge key={bank.id} variant="outline" className="text-[9px] gap-1 cursor-pointer hover:bg-muted" onClick={() => setForm(f => ({ ...f, bankName: bank.name }))}>
                      {bank.flag} {bank.name}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="us" className="mt-1">
                <div className="flex flex-wrap gap-1.5">
                  {supportedBanks.us.map(bank => (
                    <Badge key={bank.id} variant="outline" className="text-[9px] gap-1 cursor-pointer hover:bg-muted" onClick={() => setForm(f => ({ ...f, bankName: bank.name }))}>
                      {bank.flag} {bank.name}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (USD) *</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="100.00" min="10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reference / TX ID *</Label>
                  <Input value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} placeholder="Wire reference number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Your Bank</Label>
                  <Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. Deutsche Bank" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sender Name</Label>
                  <Input value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} placeholder="Account holder name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Your IBAN / Account Number</Label>
                <Input value={form.senderIban} onChange={e => setForm({ ...form, senderIban: e.target.value })} placeholder="DE89 3704 0044 0532 0130 00" />
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="size-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-400">
                Wire transfers are verified within 1-3 business days. Include BNFX-{user?.id?.slice(0, 8)} as the payment reference. Minimum deposit: $10.
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
              {submitting ? 'Submitting...' : 'Submit Wire Transfer'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
