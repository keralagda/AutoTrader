'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, Trash2, Edit2, Save, Loader2, UserPlus, AlertTriangle } from 'lucide-react'

interface FakeProfile {
  id: string
  name: string
  email: string
  phone: string | null
  fakeAvatar: string | null
  tradingBalance: number
  withdrawalBalance: number
  totalEarnings: number
  totalDeposited: number
  isActive: boolean
  createdAt: string
  isBinary?: boolean
}

export function AdminFakeProfilesTab() {
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<FakeProfile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [page, setPage] = useState(1)
  const [profileTypeFilter, setProfileTypeFilter] = useState<'all' | 'standard' | 'binary'>('all')
  const [genProfileType, setGenProfileType] = useState<'standard' | 'binary'>('standard')

  // Generation form
  const [genCount, setGenCount] = useState(25)
  const [genMinBalance, setGenMinBalance] = useState(500)
  const [genMaxBalance, setGenMaxBalance] = useState(50000)
  const [genMinEarnings, setGenMinEarnings] = useState(100)
  const [genMaxEarnings, setGenMaxEarnings] = useState(25000)
  const [genMinDeposited, setGenMinDeposited] = useState(500)
  const [genMaxDeposited, setGenMaxDeposited] = useState(100000)

  // Edit
  const [editProfile, setEditProfile] = useState<FakeProfile | null>(null)
  const [editForm, setEditForm] = useState<any>({
    name: '',
    email: '',
    phone: '',
    tradingBalance: 0,
    totalEarnings: 0,
    totalDeposited: 0,
    isActive: true,
    referredById: null,
    binaryTreeParentId: null,
    binaryTreePositionLeg: 'left'
  })

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/fake-profiles?page=${page}&limit=50&type=${profileTypeFilter}`)
      if (res.ok) {
        const data = await res.json()
        setProfiles(data.profiles)
        setTotal(data.total)
      }
    } catch {}
    finally { setLoading(false) }
  }, [page, profileTypeFilter])

  const [realUsers, setRealUsers] = useState<any[]>([])

  const fetchRealUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setRealUsers(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
    fetchRealUsers()
  }, [fetchProfiles, fetchRealUsers])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/fake-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: genCount,
          minBalance: genMinBalance,
          maxBalance: genMaxBalance,
          minEarnings: genMinEarnings,
          maxEarnings: genMaxEarnings,
          minDeposited: genMinDeposited,
          maxDeposited: genMaxDeposited,
          profileType: genProfileType,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: `${data.count} fake profiles generated!` })
        fetchProfiles()
      } else {
        const data = await res.json()
        toast({ title: 'Generation failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/fake-profiles?id=${id}`, { method: 'DELETE' })
      setProfiles(prev => prev.filter(p => p.id !== id))
      setTotal(prev => prev - 1)
      toast({ title: 'Profile deleted' })
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/admin/fake-profiles?all=true', { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        toast({ title: `${data.count} fake profiles deleted` })
        setProfiles([])
        setTotal(0)
      }
    } catch {
      toast({ title: 'Failed to delete all', variant: 'destructive' })
    }
  }

  const handleEdit = (profile: FakeProfile) => {
    setEditProfile(profile)
    setEditForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      tradingBalance: profile.tradingBalance,
      totalEarnings: profile.totalEarnings,
      totalDeposited: profile.totalDeposited,
      isActive: profile.isActive,
      referredById: (profile as any).referredById || null,
      binaryTreeParentId: (profile as any).binaryTreeParentId || null,
      binaryTreePositionLeg: (profile as any).binaryTreePosition ? ((profile as any).binaryTreePosition.endsWith('R') ? 'right' : 'left') : 'left'
    })
  }

  const handleSaveEdit = async () => {
    if (!editProfile) return
    try {
      const res = await fetch('/api/admin/fake-profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editProfile.id, ...editForm }),
      })
      if (res.ok) {
        toast({ title: 'Profile updated' })
        setEditProfile(null)
        fetchProfiles()
      }
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="size-5 text-violet-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total Fake Profiles</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{profiles.filter(p => p.isActive).length}</p>
            <p className="text-xs text-muted-foreground">Active (this page)</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">
              ${profiles.reduce((s, p) => s + p.totalDeposited, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">Total Fake Deposits</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">
              ${profiles.reduce((s, p) => s + p.totalEarnings, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">Total Fake Earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Mass Generation */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Mass Generate Fake Profiles (Indian Ethnicity)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Type Toggle */}
          <div className="space-y-1.5 pb-3 border-b border-border/30">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Profile Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGenProfileType('standard')}
                className={`py-1.5 px-3.5 rounded-lg border text-xs font-semibold transition-all ${
                  genProfileType === 'standard'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                💼 Standard Investment User
              </button>
              <button
                type="button"
                onClick={() => setGenProfileType('binary')}
                className={`py-1.5 px-3.5 rounded-lg border text-xs font-semibold transition-all ${
                  genProfileType === 'binary'
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                ⚡ Binary MLM User
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {genProfileType === 'binary'
                ? 'Creates fake users connected to the Binary MLM tree, with carry forward/leg volumes and binary plan active deposits.'
                : 'Creates standard fake users with balance statistics for regular investment plans.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Count</Label>
              <Input type="number" value={genCount} onChange={e => setGenCount(parseInt(e.target.value) || 10)} min={1} max={500} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min Balance ($)</Label>
              <Input type="number" value={genMinBalance} onChange={e => setGenMinBalance(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Balance ($)</Label>
              <Input type="number" value={genMaxBalance} onChange={e => setGenMaxBalance(parseInt(e.target.value) || 50000)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min Earnings ($)</Label>
              <Input type="number" value={genMinEarnings} onChange={e => setGenMinEarnings(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Earnings ($)</Label>
              <Input type="number" value={genMaxEarnings} onChange={e => setGenMaxEarnings(parseInt(e.target.value) || 25000)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min Deposited ($)</Label>
              <Input type="number" value={genMinDeposited} onChange={e => setGenMinDeposited(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Deposited ($)</Label>
              <Input type="number" value={genMaxDeposited} onChange={e => setGenMaxDeposited(parseInt(e.target.value) || 100000)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={generating} className="gap-1.5">
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {generating ? 'Generating...' : `Generate ${genCount} Profiles`}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5" disabled={total === 0}>
                  <Trash2 className="size-4" />
                  Delete All ({total})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-destructive" />
                    Delete All Fake Profiles?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {total} fake profiles. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Profiles List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              Fake Profiles ({total})
            </CardTitle>
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40 text-[11px] self-start sm:self-auto">
              {(['all', 'standard', 'binary'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => { setProfileTypeFilter(type); setPage(1) }}
                  className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                    profileTypeFilter === type
                      ? 'bg-background text-foreground shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
              Admin Only View
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-violet-500/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-violet-500/20 flex items-center justify-center text-lg shrink-0">
                      {profile.fakeAvatar || '👤'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{profile.name}</p>
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[9px]">FAKE</Badge>
                        {profile.isBinary ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[9px]">BINARY MLM</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">STANDARD PLAN</Badge>
                        )}
                        {!profile.isActive && <Badge className="bg-rose-500/20 text-rose-400 text-[9px]">Inactive</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>Bal: <span className="text-emerald-400">${(profile.tradingBalance || 0).toFixed(0)}</span></span>
                        <span>Earned: <span className="text-cyan-400">${(profile.totalEarnings || 0).toFixed(0)}</span></span>
                        <span>Dep: <span className="text-amber-400">${(profile.totalDeposited || 0).toFixed(0)}</span></span>
                      </div>
                      {((profile as any).referredById || (profile as any).binaryTreeParentId) && (
                        <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground mt-1 bg-muted/40 p-1.5 rounded border border-border/20">
                          {(profile as any).referredById && (() => {
                            const sponsor = realUsers.find(x => x.id === (profile as any).referredById)
                            return sponsor ? (
                              <span>💼 Sponsor: <span className="text-emerald-400 font-semibold">{sponsor.name}</span></span>
                            ) : null
                          })()}
                          {(profile as any).binaryTreeParentId && (() => {
                            const parent = realUsers.find(x => x.id === (profile as any).binaryTreeParentId)
                            return parent ? (
                              <span>⚡ Parent: <span className="text-purple-400 font-semibold">{parent.name}</span> ({(profile as any).binaryTreePosition?.endsWith('R') ? 'Right' : 'Left'})</span>
                            ) : null
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(profile)}>
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-rose-400" onClick={() => handleDelete(profile.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {profiles.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="size-8 mx-auto mb-2 opacity-50" />
                  <p>No fake profiles yet. Generate some above.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/30">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {Math.ceil(total / 50)}
              </span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editProfile} onOpenChange={() => setEditProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="size-4" />
              Edit Fake Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Trading Balance</Label>
                <Input type="number" value={editForm.tradingBalance} onChange={e => setEditForm({ ...editForm, tradingBalance: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Earnings</Label>
                <Input type="number" value={editForm.totalEarnings} onChange={e => setEditForm({ ...editForm, totalEarnings: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Deposited</Label>
                <Input type="number" value={editForm.totalDeposited} onChange={e => setEditForm({ ...editForm, totalDeposited: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.isActive} onCheckedChange={v => setEditForm({ ...editForm, isActive: v })} />
              <Label>Active</Label>
            </div>

            <Separator className="my-2 border-border/30" />

            <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border/40">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                🔗 Real Profile Associations
              </p>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Select Real Profile (Sponsor/Parent)</Label>
                <select
                  value={editForm.referredById || editForm.binaryTreeParentId || ''}
                  onChange={e => {
                    const val = e.target.value || null
                    setEditForm(prev => ({
                      ...prev,
                      referredById: prev.referredById ? val : null,
                      binaryTreeParentId: prev.binaryTreeParentId ? val : null
                    }))
                  }}
                  className="w-full text-xs bg-background border border-border/50 rounded-lg p-2 text-foreground"
                >
                  <option value="">-- No Association / None Selected --</option>
                  {realUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between p-2 rounded border border-border/30 bg-background/50">
                  <div>
                    <p className="text-[10px] font-semibold">Investment Sponsor</p>
                    <p className="text-[8px] text-muted-foreground">Earns deposit commission</p>
                  </div>
                  <Switch
                    checked={!!editForm.referredById}
                    disabled={!(editForm.referredById || editForm.binaryTreeParentId || realUsers.length > 0)}
                    onCheckedChange={checked => {
                      const currentSelectedId = editForm.referredById || editForm.binaryTreeParentId || (realUsers[0]?.id || null)
                      setEditForm(prev => ({
                        ...prev,
                        referredById: checked ? currentSelectedId : null
                      }))
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-border/30 bg-background/50">
                  <div>
                    <p className="text-[10px] font-semibold">Binary Tree Leg Parent</p>
                    <p className="text-[8px] text-muted-foreground">Adds to team volume</p>
                  </div>
                  <Switch
                    checked={!!editForm.binaryTreeParentId}
                    disabled={!(editForm.referredById || editForm.binaryTreeParentId || realUsers.length > 0)}
                    onCheckedChange={checked => {
                      const currentSelectedId = editForm.referredById || editForm.binaryTreeParentId || (realUsers[0]?.id || null)
                      setEditForm(prev => ({
                        ...prev,
                        binaryTreeParentId: checked ? currentSelectedId : null
                      }))
                    }}
                  />
                </div>
              </div>

              {!!editForm.binaryTreeParentId && (
                <div className="space-y-1 pt-1.5">
                  <Label className="text-[10px] text-muted-foreground">Binary Leg Position</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, binaryTreePositionLeg: 'left' }))}
                      className={`py-1 rounded border text-[10px] font-semibold transition-all ${
                        editForm.binaryTreePositionLeg === 'left'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold'
                          : 'border-border/50 text-muted-foreground'
                      }`}
                    >
                      Left Leg
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, binaryTreePositionLeg: 'right' }))}
                      className={`py-1 rounded border text-[10px] font-semibold transition-all ${
                        editForm.binaryTreePositionLeg === 'right'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold'
                          : 'border-border/50 text-muted-foreground'
                      }`}
                    >
                      Right Leg
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleSaveEdit} className="w-full gap-1.5">
              <Save className="size-4" /> Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
