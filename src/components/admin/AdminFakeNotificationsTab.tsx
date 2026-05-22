'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Bell, Plus, Trash2, Edit2, Save, Settings } from 'lucide-react'

interface FakeNotification {
  id: string
  userName: string
  planName: string
  amount: number
  isActive: boolean
  sortOrder: number
}

interface NotificationSettings {
  isEnabled: boolean
  minDelaySeconds: number
  maxDelaySeconds: number
}

export function AdminFakeNotificationsTab() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<FakeNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({ isEnabled: true, minDelaySeconds: 5, maxDelaySeconds: 15 })
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ userName: '', planName: '', amount: 0, isActive: true, sortOrder: 0 })

  useEffect(() => {
    fetch('/api/admin/fake-notifications')
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || [])
        if (data.settings) setSettings(data.settings)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.userName || !form.planName) {
      toast({ title: 'Name and plan required', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/admin/fake-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const item = await res.json()
        setNotifications(prev => [...prev, item])
        setForm({ userName: '', planName: '', amount: 0, isActive: true, sortOrder: 0 })
        toast({ title: 'Notification entry created!' })
      }
    } catch {
      toast({ title: 'Failed to create', variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch('/api/admin/fake-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...form }),
      })
      if (res.ok) {
        const updated = await res.json()
        setNotifications(prev => prev.map(n => n.id === id ? updated : n))
        setEditingId(null)
        setForm({ userName: '', planName: '', amount: 0, isActive: true, sortOrder: 0 })
        toast({ title: 'Updated!' })
      }
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/fake-notifications?id=${id}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast({ title: 'Deleted' })
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/admin/fake-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      toast({ title: 'Settings saved!' })
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' })
    }
  }

  const startEdit = (item: FakeNotification) => {
    setEditingId(item.id)
    setForm({ userName: item.userName, planName: item.planName, amount: item.amount, isActive: item.isActive, sortOrder: item.sortOrder })
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="size-4 text-primary" />
            Notification Toast Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Switch checked={settings.isEnabled} onCheckedChange={v => setSettings({ ...settings, isEnabled: v })} />
            <Label>Enable fake notification toasts on landing page</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Delay (seconds)</Label>
              <Input
                type="number"
                value={settings.minDelaySeconds}
                onChange={e => setSettings({ ...settings, minDelaySeconds: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Delay (seconds)</Label>
              <Input
                type="number"
                value={settings.maxDelaySeconds}
                onChange={e => setSettings({ ...settings, maxDelaySeconds: parseInt(e.target.value) || 15 })}
              />
            </div>
          </div>
          <Button onClick={handleSaveSettings} size="sm" className="gap-1.5">
            <Save className="size-4" /> Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            {editingId ? 'Edit Entry' : 'Add Fake Notification Entry'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>User Name</Label>
              <Input value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} placeholder="John D." />
            </div>
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} placeholder="Gold" />
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
            <Label>Active</Label>
            <div className="flex-1" />
            {editingId ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditingId(null); setForm({ userName: '', planName: '', amount: 0, isActive: true, sortOrder: 0 }) }}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdate(editingId)} className="gap-1.5">
                  <Save className="size-4" /> Update
                </Button>
              </div>
            ) : (
              <Button onClick={handleCreate} className="gap-1.5">
                <Plus className="size-4" /> Add
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" />
            Notification Entries ({notifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div>
                  <p className="text-sm font-medium">{item.userName} joined <span className="text-primary">{item.planName}</span> plan</p>
                  <p className="text-xs text-muted-foreground">${item.amount.toFixed(2)} • {item.isActive ? '✅ Active' : '❌ Inactive'}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                    <Edit2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-rose-400" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No entries yet. Add some fake notification data above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
