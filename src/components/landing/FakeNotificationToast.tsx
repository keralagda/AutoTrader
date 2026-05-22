'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus } from 'lucide-react'

interface FakeNotification {
  id: string
  userName: string
  planName: string
  amount: number
}

interface NotificationSettings {
  isEnabled: boolean
  minDelaySeconds: number
  maxDelaySeconds: number
}

export function FakeNotificationToast() {
  const [notifications, setNotifications] = useState<FakeNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [currentNotification, setCurrentNotification] = useState<FakeNotification | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/fake-notifications')
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || [])
        setSettings(data.settings || null)
      })
      .catch(() => {})
  }, [])

  const showNext = useCallback(() => {
    if (!settings?.isEnabled || notifications.length === 0) return

    const randomIndex = Math.floor(Math.random() * notifications.length)
    setCurrentNotification(notifications[randomIndex])
    setVisible(true)

    // Hide after 4 seconds
    setTimeout(() => {
      setVisible(false)
    }, 4000)
  }, [notifications, settings])

  useEffect(() => {
    if (!settings?.isEnabled || notifications.length === 0) return

    const scheduleNext = () => {
      const delay = (settings.minDelaySeconds + Math.random() * (settings.maxDelaySeconds - settings.minDelaySeconds)) * 1000
      return setTimeout(() => {
        showNext()
        const nextTimer = scheduleNext()
        return () => clearTimeout(nextTimer)
      }, delay)
    }

    // Show first one after a short delay
    const initialTimer = setTimeout(showNext, 3000)
    const recurringTimer = setTimeout(() => scheduleNext(), 7000)

    // Set up recurring
    const interval = setInterval(() => {
      showNext()
    }, (settings.minDelaySeconds + settings.maxDelaySeconds) * 500)

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(recurringTimer)
      clearInterval(interval)
    }
  }, [settings, notifications, showNext])

  if (!settings?.isEnabled || !currentNotification) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 max-w-xs"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <UserPlus className="size-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  <span className="text-foreground">{currentNotification.userName}</span>
                  {' '}joined the{' '}
                  <span className="text-primary font-bold">{currentNotification.planName}</span>
                  {' '}plan
                </p>
                {currentNotification.amount > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Invested ${currentNotification.amount.toLocaleString()}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">Just now</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
