'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, Wallet, Save, Edit2 } from 'lucide-react'

export function ProfileTab() {
  const { user, updateUserProfile } = useAppStore()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    walletAddress: user?.walletAddress || '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
        walletAddress: user.walletAddress || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...form }),
      })

      if (res.ok) {
        const data = await res.json()
        updateUserProfile(data)
        toast({ title: 'Profile updated successfully' })
        setEditing(false)
      } else {
        const data = await res.json()
        toast({ title: 'Update failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your account details</p>
        </div>
        <Button
          variant={editing ? 'default' : 'outline'}
          size="sm"
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
        >
          {editing ? (
            <><Save className="size-4 mr-2" />{saving ? 'Saving...' : 'Save'}</>
          ) : (
            <><Edit2 className="size-4 mr-2" />Edit Profile</>
          )}
        </Button>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="size-3.5" /> Full Name
              </Label>
              {editing ? (
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              ) : (
                <p className="text-sm bg-muted/50 rounded-md px-3 py-2">{user?.name || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="size-3.5" /> Email
              </Label>
              {editing ? (
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                />
              ) : (
                <p className="text-sm bg-muted/50 rounded-md px-3 py-2">{user?.email || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="size-3.5" /> Phone
              </Label>
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              ) : (
                <p className="text-sm bg-muted/50 rounded-md px-3 py-2">{(user as any)?.phone || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wallet className="size-3.5" /> Wallet Address
              </Label>
              {editing ? (
                <Input
                  value={form.walletAddress}
                  onChange={e => setForm({ ...form, walletAddress: e.target.value })}
                  placeholder="0x..."
                />
              ) : (
                <p className="text-sm bg-muted/50 rounded-md px-3 py-2 font-mono text-xs truncate">
                  {user?.walletAddress || 'Not set'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info (read-only) */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Referral Code</p>
              <p className="text-sm font-mono font-bold mt-1">{user?.referralCode}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Trading Balance</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">${(user?.tradingBalance || 0).toFixed(2)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Withdrawal Balance</p>
              <p className="text-sm font-bold text-cyan-400 mt-1">${(user?.withdrawalBalance || 0).toFixed(2)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Total Earnings</p>
              <p className="text-sm font-bold text-amber-400 mt-1">${(user?.totalEarnings || 0).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
