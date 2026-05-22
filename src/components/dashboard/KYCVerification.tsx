'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, FileText, AlertCircle, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react'

interface KYCData {
  status: string
  verification: {
    documentType: string
    documentNumber: string
    status: string
    rejectionReason: string | null
    submittedAt: string
    reviewedAt: string | null
  } | null
}

export function KYCVerification() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [kycData, setKycData] = useState<KYCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [documentType, setDocumentType] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')

  useEffect(() => {
    if (!user?.id) return
    loadKYCStatus()
  }, [user?.id])

  const loadKYCStatus = async () => {
    try {
      const res = await fetch(`/api/kyc?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setKycData(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!documentType || !documentNumber) {
      toast({ title: 'Please fill all fields', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          documentType,
          documentNumber,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'KYC submitted successfully. Awaiting review.' })
        loadKYCStatus()
      } else {
        toast({ title: data.error || 'Submission failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const status = kycData?.status || 'none'

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          KYC Verification
        </CardTitle>
        <CardDescription>
          Complete identity verification to unlock full withdrawal access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {status === 'approved' && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </Badge>
          )}
          {status === 'pending' && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
              <Clock className="h-3 w-3" /> Under Review
            </Badge>
          )}
          {status === 'rejected' && (
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 gap-1">
              <XCircle className="h-3 w-3" /> Rejected
            </Badge>
          )}
          {status === 'none' && (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <AlertCircle className="h-3 w-3" /> Not Submitted
            </Badge>
          )}
        </div>

        {/* Rejection Reason */}
        {status === 'rejected' && kycData?.verification?.rejectionReason && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-400">
              <strong>Reason:</strong> {kycData.verification.rejectionReason}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Please resubmit with correct documents.</p>
          </div>
        )}

        {/* Approved State */}
        {status === 'approved' && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-400">Identity Verified</p>
            <p className="text-xs text-muted-foreground mt-1">
              Document: {kycData?.verification?.documentType?.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        )}

        {/* Pending State */}
        {status === 'pending' && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <Clock className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-400">Under Review</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your documents are being reviewed. This usually takes 24-48 hours.
            </p>
          </div>
        )}

        {/* Submission Form */}
        {(status === 'none' || status === 'rejected') && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                  <SelectItem value="pan">PAN Card</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Number</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Enter document number"
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
