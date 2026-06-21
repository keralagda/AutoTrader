'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, type UserData } from '@/lib/store'
import { LeaderDashboard } from '@/components/leader/LeaderDashboard'
import { InstallPWA } from '@/components/InstallPWA'

function LeaderDashboardContent() {
  const { isAuthenticated, user, login, logout } = useAppStore()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Normal session validation
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        if (data.authenticated && data.user) {
          const allowedRoles = ['leader', 'admin', 'super_admin', 'moderator', 'support']
          if (!allowedRoles.includes(data.user.role)) {
            router.replace('/dashboard')
            return
          }
          login(data.user as UserData)
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
          <p className="text-muted-foreground text-sm">Loading leader console...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <LeaderDashboard />
      <InstallPWA />
    </>
  )
}

export default function LeaderDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 animate-pulse">
          <svg className="size-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
    }>
      <LeaderDashboardContent />
    </Suspense>
  )
}
