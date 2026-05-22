'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, type UserData } from '@/lib/store'
import { UserDashboard } from '@/components/dashboard/UserDashboard'
import { InstallPWA } from '@/components/InstallPWA'

export default function DashboardPage() {
  const { isAuthenticated, user, login, logout } = useAppStore()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Validate session on mount
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        if (data.authenticated && data.user) {
          login(data.user as UserData)
          // If admin, redirect to admin panel
          if (data.user.role === 'admin') {
            router.replace('/admin')
            return
          }
        } else {
          throw new Error('Not authenticated')
        }
      })
      .catch(() => {
        logout()
        router.replace('/?login=true')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 animate-pulse">
            <svg className="size-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <UserDashboard />
      <InstallPWA />
    </>
  )
}
