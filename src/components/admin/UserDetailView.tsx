'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, User, Mail, Phone, Wallet, Shield, Calendar, TrendingUp,
  DollarSign, Users, Activity, Clock, Save, Loader2,
} from 'lucide-react'

interface UserDetailProps {
  userId: string
  onBack: () => void
}

export function UserDetailView({ userId, onBack }: UserDetailProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [riskCategory, setRiskCategory] = useState('medium')
  const [customWinMin, setCustomWinMin] = useState('')
  const [customWinMax, setCustomWinMax] = useState('')
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  const handleSendEmail = async (type: string) => {
    setSendingEmail(type)
    try {
      const res = await fetch('/api/admin/emails/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type,
          subject: type === 'custom' ? customSubject : undefined,
          message: type === 'custom' ? customMessage : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'Email Sent',
          description: data.message || `Successfully sent ${type} email.`,
        })
        if (type === 'custom') {
          setCustomSubject('')
          setCustomMessage('')
        }
      } else {
        toast({
          title: 'Failed to Send Email',
          description: data.error || 'An error occurred while sending the email.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Failed to connect to email API.',
        variant: 'destructive',
      })
    } finally {
      setSendingEmail(null)
    }
  }

  useEffect(() => { loadUser() }, [userId])

  const loadUser = async () => {
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setRiskCategory(data.riskCategory || 'medium')
        setCustomWinMin(data.customWinMin?.toString() || '')
        setCustomWinMax(data.customWinMax?.toString() || '')
      }
    } catch {} finally { setLoading(false) }
  }

  const handleSaveRisk = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/risk-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          riskCategory,
          customWinMin: customWinMin ? parseFloat(customWinMin) : null,
          customWinMax: customWinMax ? parseFloat(customWinMax) : null,
        }),
      })
      if (res.ok) toast({ title: 'Risk settings saved' })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!user) return <div className="text-center py-12 text-muted-foreground">User not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge className={user.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline" className="capitalize">{user.riskCategory || 'medium'} risk</Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Trading Balance', value: `$${(user.tradingBalance || 0).toFixed(2)}`, icon: Wallet, color: 'text-emerald-400' },
          { label: 'Withdrawal Balance', value: `$${(user.withdrawalBalance || 0).toFixed(2)}`, icon: DollarSign, color: 'text-cyan-400' },
          { label: 'Total Deposited', value: `$${(user.totalDeposited || 0).toFixed(2)}`, icon: TrendingUp, color: 'text-amber-400' },
          { label: 'Total Earnings', value: `$${(user.totalEarnings || 0).toFixed(2)}`, icon: Activity, color: 'text-violet-400' },
          { label: 'Referrals', value: user._count?.referrals || 0, icon: Users, color: 'text-rose-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Full Name</Label>
                <p className="text-sm font-medium">{user.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Phone</Label>
                <p className="text-sm font-medium">{user.phone || '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Wallet Address</Label>
                <p className="text-xs font-mono truncate">{user.walletAddress || '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Referral Code</Label>
                <p className="text-sm font-mono font-bold">{user.referralCode}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Joined</Label>
                <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">KYC Status</Label>
                <Badge variant="outline" className="capitalize text-[10px]">{user.kycStatus || 'none'}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">2FA</Label>
                <Badge variant="outline" className="text-[10px]">{user.twoFactorEnabled ? '✅ Enabled' : '❌ Disabled'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Level Assignment */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-amber-400" /> Risk Profile (Stackable)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Default risk for new investments */}
            <div className="space-y-2">
              <Label className="text-xs">Default Risk for New Investments</Label>
              <p className="text-[10px] text-muted-foreground">This is the default when user creates a new deposit. Each deposit can have its own risk level.</p>
              <Select value={riskCategory} onValueChange={setRiskCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low Risk (Conservative)</SelectItem>
                  <SelectItem value="medium">🟡 Medium Risk (Balanced)</SelectItem>
                  <SelectItem value="high">🔴 High Risk (Aggressive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stacked Risk Breakdown */}
            {user.deposits && user.deposits.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Active Risk Stack</Label>
                <p className="text-[10px] text-muted-foreground">This user has deposits across multiple risk levels:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(level => {
                    const deps = (user.deposits || []).filter((d: any) => (d.riskLevel || 'medium') === level && d.status === 'active')
                    const total = deps.reduce((s: number, d: any) => s + d.amount, 0)
                    const colors = { low: 'emerald', medium: 'amber', high: 'rose' }
                    const c = colors[level]
                    return (
                      <div key={level} className={`p-3 rounded-lg border border-${c}-500/20 bg-${c}-500/5 text-center`}>
                        <p className="text-[10px] text-muted-foreground capitalize">{level}</p>
                        <p className={`text-lg font-bold text-${c}-400`}>${total.toFixed(0)}</p>
                        <p className="text-[9px] text-muted-foreground">{deps.length} deposit{deps.length !== 1 ? 's' : ''}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Custom Win % Override (optional)</Label>
              <p className="text-[10px] text-muted-foreground">Overrides ALL deposits for this user regardless of risk level. Leave empty to use per-deposit risk settings.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Min Daily %</Label>
                  <Input type="number" step="0.1" value={customWinMin} onChange={e => setCustomWinMin(e.target.value)} placeholder="Auto" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Max Daily %</Label>
                  <Input type="number" step="0.1" value={customWinMax} onChange={e => setCustomWinMax(e.target.value)} placeholder="Auto" className="h-8 text-xs" />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveRisk} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Risk Settings
            </Button>
          </CardContent>
        </Card>

        {/* Manual Email Management */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-400" /> Manual Email Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendEmail('verify')}
                disabled={!!sendingEmail}
                className="w-full text-[10px] h-8 justify-center"
              >
                {sendingEmail === 'verify' && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                Resend Verification
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendEmail('reset_password')}
                disabled={!!sendingEmail}
                className="w-full text-[10px] h-8 justify-center"
              >
                {sendingEmail === 'reset_password' && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                Send Reset Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendEmail('welcome')}
                disabled={!!sendingEmail}
                className="w-full text-[10px] h-8 justify-center col-span-2"
              >
                {sendingEmail === 'welcome' && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                Send Welcome Email
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-mono text-muted-foreground">Send Custom Email Notification</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Subject Line"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="h-8 text-xs"
                  disabled={!!sendingEmail}
                />
                <textarea
                  placeholder="Write message contents here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!!sendingEmail}
                />
                <Button
                  onClick={() => handleSendEmail('custom')}
                  disabled={!!sendingEmail || !customSubject || !customMessage}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-8 text-[11px]"
                >
                  {sendingEmail === 'custom' && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Send Custom Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposits */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" /> Active Deposits ({user.deposits?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {user.deposits && user.deposits.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {user.deposits.map((dep: any) => (
                  <div key={dep.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                    <div>
                      <p className="font-medium">{dep.plan?.name || 'Plan'} — ${dep.amount.toFixed(2)}</p>
                      <p className="text-muted-foreground">{dep.status} • Earned: ${dep.earnedSoFar.toFixed(2)}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] capitalize">{dep.riskLevel || 'medium'}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No active deposits</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Earnings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-cyan-400" /> Recent Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            {user.earnings && user.earnings.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {user.earnings.slice(0, 10).map((earn: any) => (
                  <div key={earn.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                    <div>
                      <p className="font-medium capitalize">{earn.type.replace('_', ' ')}</p>
                      <p className="text-muted-foreground">{new Date(earn.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-emerald-400">+${earn.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No earnings yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
