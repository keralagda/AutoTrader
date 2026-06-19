'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Search, Eye, UserCheck, UserX, DollarSign, Users as UsersIcon, ChevronRight, Trash2, MonitorPlay, Pencil, KeyRound } from 'lucide-react'
import { UserDetailView } from './UserDetailView'

interface UserRecord {
  id: string
  name: string
  email: string
  referralCode: string
  tradingBalance: number
  withdrawalBalance: number
  totalEarnings: number
  totalDeposited: number
  isActive: boolean
  createdAt: string
  referredById: string | null
  riskCategory?: string
  phone?: string | null
  walletAddress?: string | null
  personalVolume?: number
  businessVolume?: number
  teamVolume?: number
  mlmRank?: string
  mlmLevel?: number
  _count: {
    deposits: number
    referrals: number
    withdrawals: number
  }
}

interface UserDeposit {
  id: string
  amount: number
  status: string
  earnedSoFar: number
  createdAt: string
  plan?: { name: string }
}

interface UserEarning {
  id: string
  amount: number
  type: string
  level?: number | null
  createdAt: string
}

interface UserDetail extends UserRecord {
  deposits: UserDeposit[]
  earnings: UserEarning[]
  referredBy: { id: string; name: string; email: string } | null
  referrals: { id: string; name: string; email: string }[]
}

export function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [balanceAdjustUserId, setBalanceAdjustUserId] = useState<string | null>(null)
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('')
  const [balanceAdjustLoading, setBalanceAdjustLoading] = useState(false)
  const [balanceAdjustWallet, setBalanceAdjustWallet] = useState<'trading' | 'withdrawal' | 'pv' | 'bv' | 'tv'>('trading')
  const [balanceAdjustRemarks, setBalanceAdjustRemarks] = useState('')
  const [balanceAdjustType, setBalanceAdjustType] = useState<'add' | 'subtract'>('add')
  const isVolumeAdjust = ['pv', 'bv', 'tv'].includes(balanceAdjustWallet)
  // Edit profile state
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editSaving, setEditSaving] = useState(false)
  // Password reset state
  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null)
  const [resetPwValue, setResetPwValue] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleToggleActive = async (user: UserRecord) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'User Updated', description: `${user.name} is now ${user.isActive ? 'inactive' : 'active'}` })
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' })
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete "${userName}"? This will deactivate the account and wipe personal data. This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast({ title: 'User Deleted', description: `${userName} has been removed` })
      fetchUsers()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete user', variant: 'destructive' })
    }
  }

  const handleSpectate = async (userId: string) => {
    // Create a spectate session — admin views the dashboard as this user
    try {
      const res = await fetch('/api/admin/spectate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const data = await res.json()
        // Open user dashboard in new tab with spectate token
        window.open(`/dashboard?spectate=${data.token}`, '_blank')
      } else {
        toast({ title: 'Failed to start spectate', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    }
  }

  const handleEditUser = (user: UserRecord) => {
    setEditUserId(user.id)
    setEditForm({ name: user.name, email: user.email, riskCategory: user.riskCategory || 'medium' })
  }

  const handleSaveEdit = async () => {
    if (!editUserId) return
    setEditSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editUserId, editProfile: editForm }),
      })
      if (res.ok) {
        toast({ title: 'User profile updated' })
        setEditUserId(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setEditSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPwUserId) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetPwUserId, resetPassword: true, newPassword: resetPwValue || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Password Reset', description: data.message })
        setResetPwUserId(null)
        setResetPwValue('')
      } else {
        toast({ title: 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    }
  }

  const handleAdjustBalance = async () => {
    if (!balanceAdjustUserId || !balanceAdjustAmount) return
    const amount = parseFloat(balanceAdjustAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Enter a valid positive amount', variant: 'destructive' })
      return
    }

    setBalanceAdjustLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: balanceAdjustUserId,
          adjustBalance: true,
          amount: balanceAdjustType === 'subtract' ? -amount : amount,
          wallet: balanceAdjustWallet,
          remarks: balanceAdjustRemarks || `Admin ${balanceAdjustType} ${isVolumeAdjust ? 'volume' : 'balance'}`,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      const formattedValue = isVolumeAdjust ? `${amount.toFixed(2)} Vol` : `$${amount.toFixed(2)}`
      toast({
        title: isVolumeAdjust ? 'Volume Updated' : 'Balance Updated',
        description: `${balanceAdjustType === 'add' ? '+' : '-'}${formattedValue} to ${balanceAdjustWallet.toUpperCase()}`
      })
      setBalanceAdjustUserId(null)
      setBalanceAdjustAmount('')
      setBalanceAdjustRemarks('')
      setBalanceAdjustType('add')
      fetchUsers()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to adjust balance', variant: 'destructive' })
    } finally {
      setBalanceAdjustLoading(false)
    }
  }

  const handleViewDetails = async (user: UserRecord) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    try {
      // Fetch user deposits
      const depositsRes = await fetch(`/api/deposits?userId=${user.id}`)
      const deposits = depositsRes.ok ? await depositsRes.json() : []

      // Fetch user earnings (API returns { earnings: [...], summary: {...} })
      const earningsRes = await fetch(`/api/earnings?userId=${user.id}`)
      const earningsData = earningsRes.ok ? await earningsRes.json() : { earnings: [] }
      const earnings = earningsData.earnings || []

      // Find referrer
      let referredBy: { id: string; name: string; email: string } | null = null
      if (user.referredById) {
        const referrer = users.find(u => u.id === user.referredById)
        if (referrer) {
          referredBy = { id: referrer.id, name: referrer.name, email: referrer.email }
        }
      }

      // Find referrals
      const referrals = users
        .filter(u => u.referredById === user.id)
        .map(u => ({ id: u.id, name: u.name, email: u.email }))

      setSelectedUser({
        ...user,
        deposits,
        earnings,
        referredBy,
        referrals,
      })
    } catch {
      toast({ title: 'Error', description: 'Failed to load user details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive)
    return matchSearch && matchStatus
  })

  // Show full-page user detail view
  if (viewingUserId) {
    return <UserDetailView userId={viewingUserId} onBack={() => setViewingUserId(null)} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage and monitor platform users</p>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or referral code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-muted/50 border-border/50 pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as const).map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No users found</p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Balance</TableHead>
                    <TableHead className="text-muted-foreground">Earnings</TableHead>
                    <TableHead className="text-muted-foreground">Deposits</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id} className="border-border/30 hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.referralCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm text-foreground font-medium">${(user.tradingBalance || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-emerald-400">${(user.totalEarnings || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-foreground">${(user.totalDeposited || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.isActive
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                            : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                          }
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSpectate(user.id)}
                            className="text-violet-400 hover:text-violet-300 h-8 w-8 p-0"
                            title="Spectate (View as User)"
                          >
                            <MonitorPlay className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingUserId(user.id)}
                            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(user)}
                            className={user.isActive ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUser(user)}
                            className="text-cyan-400 hover:text-cyan-300 h-8 w-8 p-0"
                            title="Edit Profile"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setBalanceAdjustUserId(user.id)}
                            className="text-amber-400 hover:text-amber-300 h-8 w-8 p-0"
                            title="Adjust Balance"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setResetPwUserId(user.id); setResetPwValue('') }}
                            className="text-orange-400 hover:text-orange-300 h-8 w-8 p-0"
                            title="Reset Password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-rose-400/60 hover:text-rose-400 h-8 w-8 p-0"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Adjust Dialog */}
      <Dialog open={!!balanceAdjustUserId} onOpenChange={() => { setBalanceAdjustUserId(null); setBalanceAdjustAmount(''); setBalanceAdjustRemarks(''); setBalanceAdjustType('add') }}>
        <DialogContent className="bg-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Adjust User Balance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* User info */}
            {balanceAdjustUserId && (() => {
              const u = users.find(x => x.id === balanceAdjustUserId)
              return u ? (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-xs">
                    <span className="text-emerald-400">Trading: ${(u.tradingBalance || 0).toFixed(2)}</span>
                    <span className="text-cyan-400">Withdrawal: ${(u.withdrawalBalance || 0).toFixed(2)}</span>
                    <span className="text-purple-400">PV: {(u.personalVolume || 0).toFixed(2)} Vol</span>
                    <span className="text-orange-400">BV: {(u.businessVolume || 0).toFixed(2)} Vol</span>
                    <span className="text-amber-400 col-span-2">TV: {(u.teamVolume || 0).toFixed(2)} Vol</span>
                  </div>
                </div>
              ) : null
            })()}

            {/* Add or Subtract */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Action</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBalanceAdjustType('add')}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    balanceAdjustType === 'add'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  ➕ Add Balance/Vol
                </button>
                <button
                  onClick={() => setBalanceAdjustType('subtract')}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    balanceAdjustType === 'subtract'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  ➖ Subtract Balance/Vol
                </button>
              </div>
            </div>

            {/* Wallet Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Wallet / Parameter</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setBalanceAdjustWallet('trading')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                    balanceAdjustWallet === 'trading'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  💹 Trading
                </button>
                <button
                  onClick={() => setBalanceAdjustWallet('withdrawal')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                    balanceAdjustWallet === 'withdrawal'
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  💰 Withdrawal
                </button>
                <button
                  onClick={() => setBalanceAdjustWallet('pv')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                    balanceAdjustWallet === 'pv'
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  ⚡ PV Vol
                </button>
                <button
                  onClick={() => setBalanceAdjustWallet('bv')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                    balanceAdjustWallet === 'bv'
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  🔥 BV Vol
                </button>
                <button
                  onClick={() => setBalanceAdjustWallet('tv')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                    balanceAdjustWallet === 'tv'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  👑 TV Vol
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {isVolumeAdjust ? 'Amount (Volume)' : 'Amount (USD)'}
              </Label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold ${isVolumeAdjust ? 'text-purple-400' : 'text-emerald-400'}`}>
                  {isVolumeAdjust ? 'VOL' : '$'}
                </span>
                <Input
                  type="number"
                  value={balanceAdjustAmount}
                  onChange={e => setBalanceAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className={`bg-muted/50 border-border/50 ${isVolumeAdjust ? 'pl-12' : 'pl-7'}`}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2">
                {[10, 50, 100, 500, 1000].map(val => (
                  <Button key={val} variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => setBalanceAdjustAmount(val.toString())}>
                    {isVolumeAdjust ? `${val} Vol` : `$${val}`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Remarks / Reason *</Label>
              <Input
                value={balanceAdjustRemarks}
                onChange={e => setBalanceAdjustRemarks(e.target.value)}
                placeholder="e.g. Bonus credit, Refund, Correction, Promotion reward..."
                className="bg-muted/50 border-border/50"
              />
              <p className="text-[10px] text-muted-foreground">This will be recorded in the transaction log and activity history</p>
            </div>

            {/* Summary */}
            {balanceAdjustAmount && parseFloat(balanceAdjustAmount) > 0 && (
              <div className={`p-3 rounded-lg border ${balanceAdjustType === 'add' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <p className="text-sm font-medium">
                  {balanceAdjustType === 'add' ? '➕' : '➖'} {balanceAdjustType === 'add' ? 'Adding' : 'Subtracting'}{' '}
                  <span className={balanceAdjustType === 'add' ? 'text-emerald-400' : 'text-rose-400'}>
                    {isVolumeAdjust ? `${parseFloat(balanceAdjustAmount).toFixed(2)} Vol` : `$${parseFloat(balanceAdjustAmount).toFixed(2)}`}
                  </span>{' '}
                  {balanceAdjustType === 'add' ? 'to' : 'from'} <span className="font-bold uppercase text-primary">{balanceAdjustWallet}</span>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setBalanceAdjustUserId(null); setBalanceAdjustAmount(''); setBalanceAdjustRemarks('') }}>
                Cancel
              </Button>
              <Button
                onClick={handleAdjustBalance}
                disabled={balanceAdjustLoading || !balanceAdjustAmount || parseFloat(balanceAdjustAmount) <= 0}
                className={balanceAdjustType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
              >
                {balanceAdjustLoading ? 'Processing...' : balanceAdjustType === 'add' ? 'Add Balance' : 'Subtract Balance'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold shrink-0">
                  {selectedUser.name[0]}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={selectedUser.isActive
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                        : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                      }
                    >
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Ref: {selectedUser.referralCode}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold text-foreground">${((selectedUser?.tradingBalance || 0) + (selectedUser?.withdrawalBalance || 0)).toFixed(2)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="text-lg font-bold text-emerald-400">${(selectedUser?.totalEarnings || 0).toFixed(2)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Deposited</p>
                  <p className="text-lg font-bold text-foreground">${(selectedUser?.totalDeposited || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Referral Tree */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-emerald-400" />
                  Referral Tree
                </h4>
                <div className="space-y-2">
                  {selectedUser.referredBy ? (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-muted-foreground rotate-180" />
                      <div>
                        <p className="text-sm text-muted-foreground">Referred by</p>
                        <p className="text-sm font-medium text-foreground">{selectedUser.referredBy.name} ({selectedUser.referredBy.email})</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">No referrer (direct signup)</p>
                  )}
                  {selectedUser.referrals.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Referred users ({selectedUser.referrals.length})</p>
                      {selectedUser.referrals.map(ref => (
                        <div key={ref.id} className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg mb-1">
                          <ChevronRight className="h-4 w-4 text-emerald-400" />
                          <p className="text-sm text-foreground">{ref.name} ({ref.email})</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Deposit History */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Deposit History</h4>
                {selectedUser.deposits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No deposits</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedUser.deposits.map((dep: UserDeposit) => (
                      <div key={dep.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm text-foreground">{dep.plan?.name || 'Plan'} — ${(dep.amount || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(dep.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            dep.status === 'active'
                              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              : dep.status === 'completed'
                              ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                              : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                          }
                        >
                          {dep.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Earnings History */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Earnings History</h4>
                {selectedUser.earnings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No earnings</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedUser.earnings.slice(0, 20).map((earn: UserEarning) => (
                      <div key={earn.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm text-foreground">
                            {earn.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {earn.level ? ` (Level ${earn.level})` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(earn.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-medium text-emerald-400">+${(earn.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={!!editUserId} onOpenChange={() => setEditUserId(null)}>
        <DialogContent className="bg-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Name</label>
              <input className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Email</label>
              <input className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Phone</label>
              <input className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Wallet Address</label>
              <input className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={editForm.walletAddress || ''} onChange={e => setEditForm({ ...editForm, walletAddress: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Risk Category</label>
              <select className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm" value={editForm.riskCategory || 'medium'} onChange={e => setEditForm({ ...editForm, riskCategory: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditUserId(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!resetPwUserId} onOpenChange={() => setResetPwUserId(null)}>
        <DialogContent className="bg-card border-border/50 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Set a new password for this user. Leave blank to use default: <code className="bg-muted px-1 rounded">Bnfx@2026</code></p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">New Password</label>
              <input type="text" className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm font-mono" value={resetPwValue} onChange={e => setResetPwValue(e.target.value)} placeholder="Bnfx@2026" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setResetPwUserId(null)}>Cancel</Button>
              <Button onClick={handleResetPassword} className="bg-orange-600 hover:bg-orange-700 text-white">Reset Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
