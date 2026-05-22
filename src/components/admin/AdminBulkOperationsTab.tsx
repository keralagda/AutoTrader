'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  DollarSign,
  Bell,
  UserCheck,
  UserX,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react'

interface UserOption {
  id: string
  name: string
  email: string
}

export function AdminBulkOperationsTab() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [operation, setOperation] = useState('')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  // Operation-specific fields
  const [amount, setAmount] = useState('')
  const [wallet, setWallet] = useState('trading')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState('info')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.filter((u: any) => !u.isFake).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        })))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAll = () => {
    setSelectedUsers(users.map(u => u.id))
  }

  const deselectAll = () => {
    setSelectedUsers([])
  }

  const handleExecute = async () => {
    if (selectedUsers.length === 0) {
      toast({ title: 'Select at least one user', variant: 'destructive' })
      return
    }
    if (!operation) {
      toast({ title: 'Select an operation', variant: 'destructive' })
      return
    }

    let data: any = {}
    if (operation === 'add_balance' || operation === 'deduct_balance') {
      if (!amount || parseFloat(amount) <= 0) {
        toast({ title: 'Enter a valid amount', variant: 'destructive' })
        return
      }
      data = { amount, wallet }
    }
    if (operation === 'send_notification') {
      if (!notifTitle || !notifMessage) {
        toast({ title: 'Title and message are required', variant: 'destructive' })
        return
      }
      data = { title: notifTitle, message: notifMessage, type: notifType }
    }

    setExecuting(true)
    try {
      const res = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, userIds: selectedUsers, data }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: 'Operation completed', description: result.message })
        setSelectedUsers([])
        setOperation('')
        setAmount('')
        setNotifTitle('')
        setNotifMessage('')
      } else {
        toast({ title: result.error || 'Operation failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setExecuting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Bulk Operations
        </h2>
        <p className="text-sm text-muted-foreground">Perform actions on multiple users at once</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Select Users ({selectedUsers.length}/{users.length})</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>All</Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>None</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                    selectedUsers.includes(user.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                    selectedUsers.includes(user.id)
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {selectedUsers.includes(user.id) && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operation Selection */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Operation</CardTitle>
            <CardDescription>Choose what to do with selected users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'add_balance', label: 'Add Balance', icon: DollarSign, color: 'text-emerald-400' },
                { id: 'deduct_balance', label: 'Deduct Balance', icon: DollarSign, color: 'text-rose-400' },
                { id: 'send_notification', label: 'Send Notification', icon: Bell, color: 'text-cyan-400' },
                { id: 'activate_users', label: 'Activate Users', icon: UserCheck, color: 'text-emerald-400' },
                { id: 'deactivate_users', label: 'Deactivate Users', icon: UserX, color: 'text-rose-400' },
              ].map(op => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                    operation === op.id
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  <op.icon className={`h-4 w-4 ${op.color}`} />
                  {op.label}
                </button>
              ))}
            </div>

            <Separator />

            {/* Operation-specific fields */}
            {(operation === 'add_balance' || operation === 'deduct_balance') && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wallet</Label>
                  <Select value={wallet} onValueChange={setWallet}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trading">Trading Wallet</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {operation === 'send_notification' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Notification message..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={notifType} onValueChange={setNotifType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(operation === 'activate_users' || operation === 'deactivate_users') && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    This will {operation === 'activate_users' ? 'activate' : 'deactivate'} {selectedUsers.length} user(s).
                    {operation === 'deactivate_users' && ' Deactivated users cannot login.'}
                  </p>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <Button
              onClick={handleExecute}
              disabled={executing || selectedUsers.length === 0 || !operation}
              className="w-full gap-2"
              variant={operation === 'deactivate_users' || operation === 'deduct_balance' ? 'destructive' : 'default'}
            >
              {executing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {executing ? 'Executing...' : `Execute on ${selectedUsers.length} user(s)`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
