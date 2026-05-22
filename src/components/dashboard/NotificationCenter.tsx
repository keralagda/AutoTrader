'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  Wallet,
  Clock,
  XCircle,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Notification } from '@prisma/client'

interface NotificationWithUser extends Notification {
  user?: {
    name: string
    email: string
  }
}

export function NotificationCenter() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [showBadge, setShowBadge] = useState(false)

  const fetchNotifications = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
        setShowBadge(data.unreadCount > 0)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load notifications', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        setShowBadge(unreadCount - 1 > 0)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to mark as read', variant: 'destructive' })
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, markAllRead: true }),
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        setShowBadge(false)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="size-4 text-emerald-400" />
      case 'warning':
        return <AlertCircle className="size-4 text-amber-400" />
      case 'info':
        return <Info className="size-4 text-cyan-400" />
      case 'earning':
        return <TrendingUp className="size-4 text-emerald-400" />
      case 'withdrawal':
        return <Wallet className="size-4 text-cyan-400" />
      default:
        return <Bell className="size-4 text-muted-foreground" />
    }
  }

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (!isRead) return 'bg-primary/5 border-primary/20'
    switch (type) {
      case 'success':
        return 'bg-emerald-500/5 border-emerald-500/10'
      case 'warning':
        return 'bg-amber-500/5 border-amber-500/10'
      case 'info':
        return 'bg-cyan-500/5 border-cyan-500/10'
      case 'earning':
        return 'bg-emerald-500/5 border-emerald-500/10'
      case 'withdrawal':
        return 'bg-cyan-500/5 border-cyan-500/10'
      default:
        return 'bg-muted/30 border-border/30'
    }
  }

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter(n => !n.isRead)
      : notifications

  return (
    <div className="space-y-4">
      {/* Notification Button with Badge */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          className="relative"
        >
          {showBadge ? (
            <BellRing className="size-5 text-primary" />
          ) : (
            <Bell className="size-5 text-muted-foreground" />
          )}
          {showBadge && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Notification Center Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="size-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="size-3.5 mr-1" />
                  Mark All Read
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDialogOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setFilter('unread')}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${getNotificationColor(notification.type, notification.isRead)}`}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-2.5" />
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-[10px] h-6 px-2"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
