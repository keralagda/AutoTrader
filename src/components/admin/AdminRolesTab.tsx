'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Shield,
  Users,
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Lock,
  Unlock,
  Loader2,
  CheckCircle2,
  XCircle,
  Crown,
  Eye,
  Save,
} from 'lucide-react'

interface PermissionEntry {
  module: string
  actions: string[]
}

interface RoleDefinition {
  id: string
  label: string
  description: string
  color: string
  level: number
  permissions: PermissionEntry[]
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'] as const

const MODULE_CATEGORIES: Record<string, { id: string; label: string }[]> = {
  'Users': [
    { id: 'users', label: 'User Management' },
    { id: 'kyc', label: 'KYC Verification' },
    { id: 'risk_categories', label: 'Risk Categories' },
  ],
  'Finance': [
    { id: 'deposits', label: 'Deposits' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'plans', label: 'Investment Plans' },
    { id: 'payment_gateways', label: 'Payment Gateways' },
  ],
  'Content': [
    { id: 'messages', label: 'Messages' },
    { id: 'news', label: 'News' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'contests', label: 'Contests' },
  ],
  'Platform': [
    { id: 'templates', label: 'Templates' },
    { id: 'settings', label: 'Settings' },
    { id: 'landing_editor', label: 'Landing Editor' },
    { id: 'page_builder', label: 'Page Builder' },
    { id: 'fake_profiles', label: 'Fake Profiles' },
    { id: 'media', label: 'Media' },
  ],
  'System': [
    { id: 'referral_config', label: 'Referral Config' },
    { id: 'cron', label: 'Cron Jobs' },
    { id: 'geo_blocking', label: 'Geo Blocking' },
    { id: 'bulk_operations', label: 'Bulk Operations' },
    { id: 'activity_log', label: 'Activity Log' },
    { id: 'system_health', label: 'System Health' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'tickets', label: 'Support Tickets' },
  ],
}

export function AdminRolesTab() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit role state
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null)
  const [editPermissions, setEditPermissions] = useState<PermissionEntry[]>([])

  // Create role state
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [newRole, setNewRole] = useState({ id: '', label: '', description: '', color: '#6b7280', level: 10 })

  // Assign role state
  const [showAssignRole, setShowAssignRole] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')
  const [assignRoleId, setAssignRoleId] = useState('')

  // All users for assignment
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, staffRes] = await Promise.all([
        fetch('/api/admin/roles?action=matrix'),
        fetch('/api/admin/roles?action=staff'),
      ])
      if (rolesRes.ok) {
        const data = await rolesRes.json()
        setRoles(data.roles)
      }
      if (staffRes.ok) {
        const data = await staffRes.json()
        setStaff(data.staff)
      }
    } catch {
      toast({ title: 'Failed to load roles', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const users = await res.json()
      setAllUsers(users.map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'user' })))
    }
  }

  // Permission toggle helper
  const togglePermission = (module: string, action: string) => {
    setEditPermissions(prev => {
      const existing = prev.find(p => p.module === module)
      if (existing) {
        if (existing.actions.includes(action)) {
          const newActions = existing.actions.filter(a => a !== action)
          if (newActions.length === 0) return prev.filter(p => p.module !== module)
          return prev.map(p => p.module === module ? { ...p, actions: newActions } : p)
        } else {
          return prev.map(p => p.module === module ? { ...p, actions: [...p.actions, action] } : p)
        }
      } else {
        return [...prev, { module, actions: [action] }]
      }
    })
  }

  const hasAction = (module: string, action: string) => {
    const perm = editPermissions.find(p => p.module === module)
    return perm?.actions.includes(action) || false
  }

  // Save role permissions
  const handleSavePermissions = async () => {
    if (!editingRole) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: editingRole.id, permissions: editPermissions }),
      })
      if (res.ok) {
        toast({ title: 'Permissions saved' })
        setEditingRole(null)
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Create new role
  const handleCreateRole = async () => {
    if (!newRole.id || !newRole.label) {
      toast({ title: 'ID and label required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      })
      if (res.ok) {
        toast({ title: 'Role created' })
        setShowCreateRole(false)
        setNewRole({ id: '', label: '', description: '', color: '#6b7280', level: 10 })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Delete role
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm(`Delete role "${roleId}"? All users with this role will be reassigned to "user".`)) return
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })
      if (res.ok) {
        toast({ title: 'Role deleted' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    }
  }

  // Assign role to user
  const handleAssignRole = async () => {
    if (!assignUserId || !assignRoleId) {
      toast({ title: 'Select user and role', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assignUserId, role: assignRoleId }),
      })
      if (res.ok) {
        toast({ title: 'Role assigned' })
        setShowAssignRole(false)
        setAssignUserId('')
        setAssignRoleId('')
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Roles & Permissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage staff roles and access control matrix</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowAssignRole(true); fetchUsers() }}>
            <UserCog className="size-4 mr-1.5" />
            Assign Role
          </Button>
          <Button size="sm" onClick={() => setShowCreateRole(true)}>
            <Plus className="size-4 mr-1.5" />
            New Role
          </Button>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="gap-1.5">
            <Shield className="size-4" />
            Roles ({roles.filter(r => r.level > 0).length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5">
            <Users className="size-4" />
            Staff ({staff.length})
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-1.5">
            <Lock className="size-4" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.filter(r => r.id !== 'user').map(role => (
              <Card key={role.id} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <h3 className="font-semibold text-sm">{role.label}</h3>
                      {role.id === 'super_admin' && <Crown className="size-3.5 text-amber-400" />}
                    </div>
                    <Badge variant="outline" className="text-[10px]">Level {role.level}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {role.permissions.length} modules • {role.permissions.reduce((s, p) => s + p.actions.length, 0)} permissions
                    </span>
                    <div className="flex gap-1">
                      {role.id !== 'super_admin' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => { setEditingRole(role); setEditPermissions([...role.permissions]) }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          {!['admin', 'super_admin', 'user'].includes(role.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(member => {
                      const role = roles.find(r => r.id === member.role)
                      return (
                        <tr key={member.id} className="border-b border-border/30 hover:bg-muted/20">
                          <td className="p-3 font-medium">{member.name}</td>
                          <td className="p-3 text-muted-foreground">{member.email}</td>
                          <td className="p-3">
                            <Badge
                              className="text-[10px]"
                              style={{ backgroundColor: `${role?.color}20`, color: role?.color, borderColor: `${role?.color}40` }}
                            >
                              {role?.label || member.role}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {member.isActive ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Active</Badge>
                            ) : (
                              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">Inactive</Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(member.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setAssignUserId(member.id)
                                setAssignRoleId(member.role)
                                setShowAssignRole(true)
                                fetchUsers()
                              }}
                            >
                              <UserCog className="size-3 mr-1" />
                              Change Role
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                    {staff.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No staff members. Assign roles to users to add them here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-card min-w-[140px]">Module</th>
                      {roles.filter(r => r.level > 0).map(role => (
                        <th key={role.id} className="text-center p-2 font-medium min-w-[80px]" style={{ color: role.color }}>
                          {role.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(MODULE_CATEGORIES).map(([category, modules]) => (
                      <>
                        <tr key={`cat-${category}`}>
                          <td colSpan={roles.filter(r => r.level > 0).length + 1} className="p-2 bg-muted/30 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                            {category}
                          </td>
                        </tr>
                        {modules.map(mod => (
                          <tr key={mod.id} className="border-b border-border/20 hover:bg-muted/10">
                            <td className="p-2 sticky left-0 bg-card">{mod.label}</td>
                            {roles.filter(r => r.level > 0).map(role => {
                              const perm = role.permissions.find(p => p.module === mod.id)
                              const actions = perm?.actions || []
                              return (
                                <td key={role.id} className="p-2 text-center">
                                  <div className="flex items-center justify-center gap-0.5">
                                    {CRUD_ACTIONS.map(action => (
                                      <span
                                        key={action}
                                        className={`size-4 rounded text-[8px] font-bold flex items-center justify-center ${
                                          actions.includes(action)
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-muted/30 text-muted-foreground/30'
                                        }`}
                                        title={`${action}: ${actions.includes(action) ? 'Yes' : 'No'}`}
                                      >
                                        {action[0].toUpperCase()}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <p className="text-[10px] text-muted-foreground">
            C = Create, R = Read, U = Update, D = Delete. Green = Allowed, Gray = Denied.
          </p>
        </TabsContent>
      </Tabs>

      {/* Edit Role Permissions Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4" />
              Edit Permissions: {editingRole?.label}
            </DialogTitle>
            <DialogDescription>Toggle CRUD permissions for each module</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {Object.entries(MODULE_CATEGORIES).map(([category, modules]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</h4>
                <div className="space-y-1">
                  {modules.map(mod => (
                    <div key={mod.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20">
                      <span className="text-sm">{mod.label}</span>
                      <div className="flex items-center gap-3">
                        {CRUD_ACTIONS.map(action => (
                          <label key={action} className="flex items-center gap-1 cursor-pointer">
                            <Checkbox
                              checked={hasAction(mod.id, action)}
                              onCheckedChange={() => togglePermission(mod.id, action)}
                            />
                            <span className="text-[10px] text-muted-foreground capitalize">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
              <Button onClick={handleSavePermissions} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-4 mr-1.5" />}
                Save Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Define a custom role with specific access levels</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role ID</Label>
                <Input
                  placeholder="e.g. finance_manager"
                  value={newRole.id}
                  onChange={e => setNewRole(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display Name</Label>
                <Input
                  placeholder="e.g. Finance Manager"
                  value={newRole.label}
                  onChange={e => setNewRole(p => ({ ...p, label: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="What this role does..."
                value={newRole.description}
                onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={newRole.color}
                  onChange={e => setNewRole(p => ({ ...p, color: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Level (1-99)</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={newRole.level}
                  onChange={e => setNewRole(p => ({ ...p, level: parseInt(e.target.value) || 10 }))}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Higher level = more authority. Roles can only manage roles with lower levels. After creating, edit permissions from the Roles tab.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateRole(false)}>Cancel</Button>
              <Button onClick={handleCreateRole} disabled={saving || !newRole.id || !newRole.label}>
                {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
                Create Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignRole} onOpenChange={setShowAssignRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>Change a user&apos;s role and access level</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">User</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email}) — {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New Role</Label>
              <Select value={assignRoleId} onValueChange={setAssignRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.label} (Level {r.level})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignRole(false)}>Cancel</Button>
              <Button onClick={handleAssignRole} disabled={saving || !assignUserId || !assignRoleId}>
                {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <UserCog className="size-4 mr-1.5" />}
                Assign Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
