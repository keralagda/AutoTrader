'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Shield, Key, Smartphone, History, Monitor, Globe, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface LoginEntry {
  id: string
  ipAddress: string | null
  userAgent: string | null
  device: string | null
  location: string | null
  createdAt: string
}

export function SecurityTab() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [setting2FA, setSetting2FA] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [show2FASetup, setShow2FASetup] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadLoginHistory()
    check2FAStatus()
  }, [user?.id])

  const loadLoginHistory = async () => {
    try {
      const res = await fetch(`/api/auth/login-history?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setLoginHistory(data)
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false)
    }
  }

  const check2FAStatus = async () => {
    try {
      const res = await fetch(`/api/auth/me?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setTwoFAEnabled(data.twoFactorEnabled || false)
      }
    } catch {
      // ignore
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'All fields are required', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'New password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Password changed successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast({ title: data.error || 'Failed to change password', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSetup2FA = async () => {
    setSetting2FA(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setQrCodeUrl(data.qrCodeUrl || data.otpauthUrl)
        setShow2FASetup(true)
      } else {
        toast({ title: data.error || 'Failed to setup 2FA', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSetting2FA(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast({ title: 'Enter a valid 6-digit code', variant: 'destructive' })
      return
    }
    setSetting2FA(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, token: totpCode }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: '2FA enabled successfully' })
        setTwoFAEnabled(true)
        setShow2FASetup(false)
        setTotpCode('')
      } else {
        toast({ title: data.error || 'Invalid code', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSetting2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    setSetting2FA(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (res.ok) {
        toast({ title: '2FA disabled' })
        setTwoFAEnabled(false)
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed to disable 2FA', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSetting2FA(false)
    }
  }

  const getDeviceIcon = (device: string | null) => {
    if (device === 'mobile') return <Smartphone className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Password Change */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password. Use a strong password with at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} className="gap-2">
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account using TOTP authenticator app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Authenticator App</p>
                <p className="text-xs text-muted-foreground">Google Authenticator, Authy, etc.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {twoFAEnabled ? (
                <>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Enabled
                  </Badge>
                  <Button variant="destructive" size="sm" onClick={handleDisable2FA} disabled={setting2FA}>
                    Disable
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="text-muted-foreground">
                    <XCircle className="h-3 w-3 mr-1" /> Disabled
                  </Badge>
                  <Button size="sm" onClick={handleSetup2FA} disabled={setting2FA}>
                    {setting2FA ? 'Setting up...' : 'Enable'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {show2FASetup && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Enter 6-digit code from your app</Label>
                <div className="flex gap-2">
                  <Input
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="font-mono text-center text-lg tracking-widest max-w-[200px]"
                  />
                  <Button onClick={handleVerify2FA} disabled={setting2FA || totpCode.length !== 6}>
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Login History
          </CardTitle>
          <CardDescription>Recent login activity on your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : loginHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No login history available</p>
          ) : (
            <div className="space-y-3">
              {loginHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(entry.device)}
                    <div>
                      <p className="text-sm font-medium">{entry.device || 'Unknown Device'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {entry.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {entry.ipAddress}
                          </span>
                        )}
                        {entry.location && <span>• {entry.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
