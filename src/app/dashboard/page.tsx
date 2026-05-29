'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore, type UserData } from '@/lib/store'
import { UserDashboard } from '@/components/dashboard/UserDashboard'
import { InstallPWA } from '@/components/InstallPWA'
import { AIChatbot } from '@/components/dashboard/AIChatbot'

function DashboardContent() {
  const { isAuthenticated, user, login, logout } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [spectating, setSpectating] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const spectateToken = searchParams.get('spectate')

    if (spectateToken) {
      // Spectate mode: load user data from the spectate token
      fetch('/api/auth/session', {
        headers: { 'Authorization': `Bearer ${spectateToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.authenticated && data.user) {
            login(data.user as UserData)
            setSpectating(true)
          } else {
            throw new Error('Invalid spectate token')
          }
        })
        .catch(() => {
          router.replace('/admin')
        })
        .finally(() => setLoading(false))
    } else {
      // Normal session validation
      fetch('/api/auth/session')
        .then(res => {
          if (!res.ok) throw new Error('Not authenticated')
          return res.json()
        })
        .then(data => {
          if (data.authenticated && data.user) {
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
    }
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
      {/* Spectate Banner */}
      {spectating && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-violet-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-3">
          <span>👁️ Spectating as: {user?.name} ({user?.email})</span>
          <button
            onClick={() => window.close()}
            className="px-3 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs font-semibold"
          >
            Exit Spectate
          </button>
        </div>
      )}
      <div className={spectating ? 'pt-10' : ''}>
        <UserDashboard />
      </div>
      <InstallPWA />
      <AIChatbot />
    </>
  )
}

export default function DashboardPage() {
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
      <DashboardContent />
    </Suspense>
  )
}
