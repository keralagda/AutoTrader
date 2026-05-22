'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Bell, Send, Loader2, Users } from 'lucide-react'

interface Template {
  id: string
  name: string
  title: string
  message: string
  type: string
}

export function AdminNotificationTemplatesTab() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [sendTarget, setSendTarget] = useState<'all' | 'active'>('all')
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    loadTemplates()
    loadUsers()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/notification-templates')
      if (res.ok) setTemplates(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.filter((u: any) => !u.isFake).map((u: any) => ({ id: u.id, name: u.name })))
      }
    } catch {}
  }

  const handleSend = async (templateId: string) => {
    setSending(templateId)
    try {
      // Get user IDs based on target
      let userIds: string[]
      if (sendTarget === 'all') {
        userIds = users.map(u => u.id)
      } else {
        // Active users only - fetch from API
        const res = await fetch('/api/admin/users')
        const data = await res.json()
        userIds = data.filter((u: any) => !u.isFake && u.isActive && u.totalDeposited > 0).map((u: any) => u.id)
      }

      if (userIds.length === 0) {
        toast({ title: 'No users to send to', variant: 'destructive' })
        return
      }

      const res = await fetch('/api/admin/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, userIds }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: `Sent to ${data.sent} users` })
      } else {
        toast({ title: data.error || 'Failed to send', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSending(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Templates
          </h2>
          <p className="text-sm text-muted-foreground">Send pre-built notifications to users</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Send to:</Label>
          <Select value={sendTarget} onValueChange={(v) => setSendTarget(v as any)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users ({users.length})</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{template.name}</p>
                    <Badge variant="outline" className="text-[10px]">{template.type}</Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground">{template.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSend(template.id)}
                  disabled={sending === template.id}
                  className="shrink-0 gap-1.5"
                >
                  {sending === template.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
