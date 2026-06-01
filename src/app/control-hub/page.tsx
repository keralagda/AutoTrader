'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, type UserData } from '@/lib/store'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const { isAuthenticated, user, login, logout } = useAppStore()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Validate session and admin role
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        if (data.authenticated && data.user) {
          const staffRoles = ['admin', 'super_admin', 'moderator', 'support']
          if (!staffRoles.includes(data.user.role)) {
            // Not staff, redirect to user dashboard
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

  if (loading || !isAuthenticated || !['admin', 'super_admin', 'moderator', 'support'].includes(user?.role || '')) {
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
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}
