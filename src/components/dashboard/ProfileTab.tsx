'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, Wallet, Save, Edit2, Plus, Trash2, Check } from 'lucide-react'
import { KYCVerification } from './KYCVerification'
import { RewardsTier } from './RewardsTier'
import { MetaMaskConnect } from './MetaMaskConnect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SavedWallet {
  id: string
  label: string
  address: string
  network: string
  isDefault: boolean
}

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

  const [depositAddresses, setDepositAddresses] = useState<SavedWallet[]>([])
  const [withdrawAddresses, setWithdrawAddresses] = useState<SavedWallet[]>([])
  const [addingWallet, setAddingWallet] = useState(false)
  const [newWallet, setNewWallet] = useState({
    type: 'withdraw' as 'deposit' | 'withdraw',
    label: '',
    address: '',
    network: 'polygon',
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
        walletAddress: user.walletAddress || '',
      })
      try {
        setDepositAddresses(user.depositWallets ? JSON.parse(user.depositWallets) : [])
      } catch {
        setDepositAddresses([])
      }
      try {
        setWithdrawAddresses(user.withdrawWallets ? JSON.parse(user.withdrawWallets) : [])
      } catch {
        setWithdrawAddresses([])
      }
    }
  }, [user])

  const handleAddWallet = async () => {
    if (!user?.id) return
    if (!newWallet.label.trim() || !newWallet.address.trim()) {
      toast({ title: 'Label and address are required', variant: 'destructive' })
      return
    }

    setAddingWallet(true)
    try {
      const isDeposit = newWallet.type === 'deposit'
      const currentList = isDeposit ? depositAddresses : withdrawAddresses
      
      const updatedList = [
        ...currentList,
        {
          id: Math.random().toString(36).substring(2, 9),
          label: newWallet.label.trim(),
          address: newWallet.address.trim(),
          network: newWallet.network,
          isDefault: currentList.length === 0,
        }
      ]

      const payload = isDeposit 
        ? { depositWallets: JSON.stringify(updatedList) }
        : { withdrawWallets: JSON.stringify(updatedList) }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...payload }),
      })

      if (res.ok) {
        const data = await res.json()
        updateUserProfile(data)
        toast({ title: 'Wallet address saved successfully' })
        setNewWallet({
          ...newWallet,
          label: '',
          address: '',
        })
      } else {
        toast({ title: 'Failed to save wallet address', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setAddingWallet(false)
    }
  }

  const handleDeleteWallet = async (type: 'deposit' | 'withdraw', walletId: string) => {
    if (!user?.id) return
    try {
      const isDeposit = type === 'deposit'
      const currentList = isDeposit ? depositAddresses : withdrawAddresses
      const updatedList = currentList.filter(w => w.id !== walletId)
      
      if (currentList.find(w => w.id === walletId)?.isDefault && updatedList.length > 0) {
        updatedList[0].isDefault = true
      }

      const payload = isDeposit 
        ? { depositWallets: JSON.stringify(updatedList) }
        : { withdrawWallets: JSON.stringify(updatedList) }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...payload }),
      })

      if (res.ok) {
        const data = await res.json()
        updateUserProfile(data)
        toast({ title: 'Wallet address deleted' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    }
  }

  const handleSetDefaultWallet = async (type: 'deposit' | 'withdraw', walletId: string) => {
    if (!user?.id) return
    try {
      const isDeposit = type === 'deposit'
      const currentList = isDeposit ? depositAddresses : withdrawAddresses
      const updatedList = currentList.map(w => ({
        ...w,
        isDefault: w.id === walletId
      }))

      const payload = isDeposit 
        ? { depositWallets: JSON.stringify(updatedList) }
        : { withdrawWallets: JSON.stringify(updatedList) }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...payload }),
      })

      if (res.ok) {
        const data = await res.json()
        updateUserProfile(data)
        toast({ title: 'Default wallet address set' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    }
  }

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
                <div className="space-y-2">
                  <p className="text-sm bg-muted/50 rounded-md px-3 py-2 font-mono text-xs truncate">
                    {user?.walletAddress || 'Not connected'}
                  </p>
                  <MetaMaskConnect />
                </div>
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

      {/* Multiple Wallet Addresses Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            Saved Wallet Addresses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Manage Deposit Wallets */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center justify-between">
                <span>Deposit Wallets</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {depositAddresses.length} Saved
                </Badge>
              </h3>
              {depositAddresses.length === 0 ? (
                <p className="text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg p-4 text-center">
                  No deposit addresses configured.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {depositAddresses.map(addr => (
                    <div key={addr.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">{addr.label}</span>
                          <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {addr.network}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">{addr.address}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!addr.isDefault && (
                          <Button size="icon" variant="ghost" className="size-6 text-muted-foreground hover:text-foreground" onClick={() => handleSetDefaultWallet('deposit', addr.id)}>
                            <Check className="size-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="size-6 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => handleDeleteWallet('deposit', addr.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Manage Withdrawal Wallets */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-cyan-400 flex items-center justify-between">
                <span>Withdrawal Wallets</span>
                <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  {withdrawAddresses.length} Saved
                </Badge>
              </h3>
              {withdrawAddresses.length === 0 ? (
                <p className="text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg p-4 text-center">
                  No withdrawal addresses configured.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {withdrawAddresses.map(addr => (
                    <div key={addr.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">{addr.label}</span>
                          <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {addr.network}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">{addr.address}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!addr.isDefault && (
                          <Button size="icon" variant="ghost" className="size-6 text-muted-foreground hover:text-foreground" onClick={() => handleSetDefaultWallet('withdraw', addr.id)}>
                            <Check className="size-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="size-6 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => handleDeleteWallet('withdraw', addr.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Add Wallet Form */}
          <div className="space-y-3 bg-muted/20 border border-border/30 rounded-lg p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Wallet Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Usage Type</Label>
                <Select value={newWallet.type} onValueChange={(val: 'deposit' | 'withdraw') => setNewWallet({ ...newWallet, type: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit Wallet</SelectItem>
                    <SelectItem value="withdraw">Withdrawal Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">Network / Protocol</Label>
                <Select value={newWallet.network} onValueChange={(val) => setNewWallet({ ...newWallet, network: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polygon">Polygon (USDC)</SelectItem>
                    <SelectItem value="bsc">BSC BEP-20 (USDC)</SelectItem>
                    <SelectItem value="tron">TRON TRC-20 (USDC)</SelectItem>
                    <SelectItem value="ethereum">Ethereum ERC-20 (USDC)</SelectItem>
                    <SelectItem value="upi">UPI ID</SelectItem>
                    <SelectItem value="bank">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor="wallet-label">Label</Label>
                <Input id="wallet-label" placeholder="e.g. My Metamask" className="h-8 text-xs" value={newWallet.label} onChange={e => setNewWallet({ ...newWallet, label: e.target.value })} />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor="wallet-address">Wallet Address / Details</Label>
                <div className="flex gap-2">
                  <Input id="wallet-address" placeholder="0x... / UPI / Account" className="h-8 text-xs flex-1" value={newWallet.address} onChange={e => setNewWallet({ ...newWallet, address: e.target.value })} />
                  <Button size="sm" className="h-8 px-3 shrink-0" onClick={handleAddWallet} disabled={addingWallet}>
                    <Plus className="size-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Verification */}
      <KYCVerification />

      {/* Rewards & Tier */}
      <RewardsTier />
    </div>
  )
}
