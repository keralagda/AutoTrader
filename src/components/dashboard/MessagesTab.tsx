'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Mail, Send, Inbox, Eye, PenSquare } from 'lucide-react'

interface Message {
  id: string
  subject: string
  body: string
  type: string
  direction: string
  isRead: boolean
  createdAt: string
}

export function MessagesTab() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [viewMessage, setViewMessage] = useState<Message | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/messages?userId=${user.id}`)
      .then(res => res.json())
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleSend = async () => {
    if (!user?.id || !subject || !body) {
      toast({ title: 'Please fill all fields', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, subject, body, type: 'email' }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [msg, ...prev])
        toast({ title: 'Message sent!' })
        setSubject('')
        setBody('')
        setComposeOpen(false)
      }
    } catch {
      toast({ title: 'Failed to send', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const sentMessages = messages.filter(m => m.direction === 'sent')
  const receivedMessages = messages.filter(m => m.direction === 'received')

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Message Centre</h2>
          <p className="text-sm text-muted-foreground">Your communications hub</p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="gap-1.5">
          <PenSquare className="size-4" />
          Compose
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="size-3.5" />
            Inbox ({receivedMessages.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5">
            <Send className="size-3.5" />
            Sent ({sentMessages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4 space-y-2">
          {receivedMessages.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <Mail className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No messages yet</p>
              </CardContent>
            </Card>
          ) : (
            receivedMessages.map(msg => (
              <Card
                key={msg.id}
                className="bg-card/50 border-border/50 hover:border-primary/20 cursor-pointer transition-colors"
                onClick={() => setViewMessage(msg)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${!msg.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {msg.subject}
                      </p>
                      {!msg.isRead && (
                        <Badge className="bg-primary/20 text-primary text-[9px] px-1">NEW</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-2">
          {sentMessages.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <Send className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No sent messages</p>
              </CardContent>
            </Card>
          ) : (
            sentMessages.map(msg => (
              <Card
                key={msg.id}
                className="bg-card/50 border-border/50 hover:border-primary/20 cursor-pointer transition-colors"
                onClick={() => setViewMessage(msg)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* View Message Dialog */}
      <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-4" />
              {viewMessage?.subject}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">{viewMessage?.type}</Badge>
              <span>{viewMessage && new Date(viewMessage.createdAt).toLocaleString()}</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-4 text-sm whitespace-pre-wrap">
              {viewMessage?.body}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="size-4" />
              Compose Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Message subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={5}
              />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
              <Send className="size-4" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
