'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Send, Trash2, Users } from 'lucide-react'

interface Message {
  id: string
  userId: string
  subject: string
  body: string
  type: string
  direction: string
  isRead: boolean
  createdAt: string
  user?: { name: string; email: string }
}

interface UserOption {
  id: string
  name: string
  email: string
}

export function AdminMessagesTab() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [broadcast, setBroadcast] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/messages').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
    ]).then(([msgs, usrs]) => {
      setMessages(msgs)
      setUsers(usrs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSend = async () => {
    if (!subject || !body) {
      toast({ title: 'Subject and body required', variant: 'destructive' })
      return
    }
    if (!broadcast && !selectedUser) {
      toast({ title: 'Select a user or enable broadcast', variant: 'destructive' })
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: broadcast ? undefined : selectedUser,
          subject,
          body,
          type: 'system',
          broadcast,
        }),
      })

      if (res.ok) {
        toast({ title: broadcast ? 'Broadcast sent to all users!' : 'Message sent!' })
        setSubject('')
        setBody('')
        // Refresh messages
        const msgs = await fetch('/api/admin/messages').then(r => r.json())
        setMessages(msgs)
      }
    } catch {
      toast({ title: 'Failed to send', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' })
      setMessages(prev => prev.filter(m => m.id !== id))
      toast({ title: 'Message deleted' })
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="size-4 text-primary" />
            Send Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={broadcast} onCheckedChange={setBroadcast} />
              <Label className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                Broadcast to all users
              </Label>
            </div>
          </div>

          {!broadcast && (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject" />
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message content..." rows={4} />
          </div>

          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="size-4" />
            {sending ? 'Sending...' : broadcast ? 'Send to All Users' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="size-4" />
            All Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{msg.subject}</p>
                    <Badge variant="outline" className="text-[9px]">{msg.direction}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{msg.user?.name || 'Unknown'} - {msg.body.slice(0, 60)}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 text-rose-400" onClick={() => handleDelete(msg.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
