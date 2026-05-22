'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type UserData } from '@/lib/store'
import LandingPage from '@/components/landing/LandingPage'
import AuthModal from '@/components/auth/AuthModal'
import { UserDashboard } from '@/components/dashboard/UserDashboard'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { InstallPWA } from '@/components/InstallPWA'

export default function Home() {
  const { isAuthenticated, user, currentView, login } = useAppStore()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        // Seed the database on first load
        await fetch('/api/seed', { method: 'POST' })
      } catch (err) {
        console.error('Seed error:', err)
      } finally {
        setInitialized(true)
      }
    }
    init()
  }, [])

  // Persist auth in localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem('autotrade_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('autotrade_user')
    }
  }, [isAuthenticated, user])

  // Restore auth from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('autotrade_user')
      if (stored) {
        const userData = JSON.parse(stored) as UserData
        // Verify user still exists
        fetch(`/api/auth/me?userId=${userData.id}`)
          .then(res => {
            if (res.ok) return res.json()
            throw new Error('User not found')
          })
          .then(data => {
            login(data as UserData)
          })
          .catch(() => {
            localStorage.removeItem('autotrade_user')
          })
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [login])

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 animate-pulse-glow">
            <svg
              className="size-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Loading Auto Trade...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {currentView === 'admin' && isAuthenticated && user?.role === 'admin' ? (
        <AdminDashboard />
      ) : currentView === 'dashboard' && isAuthenticated ? (
        <UserDashboard />
      ) : (
        <LandingPage />
      )}
      <AuthModal />
      <InstallPWA />
    </>
  )
}
