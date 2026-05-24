'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore, type UserData } from '@/lib/store'
import LandingPage from '@/components/landing/LandingPage'
import AuthModal from '@/components/auth/AuthModal'
import { InstallPWA } from '@/components/InstallPWA'

function HomeContent() {
  const { isAuthenticated, user, login, setShowAuthModal } = useAppStore()
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function init() {
      try {
        await fetch('/api/seed', { method: 'POST' })
      } catch (err) {
        console.error('Seed error:', err)
      }

      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            login(data.user as UserData)
            if (data.user.role === 'admin') {
              router.replace('/admin')
            } else {
              router.replace('/dashboard')
            }
            return
          }
        }
      } catch {}

      setInitialized(true)
    }
    init()
  }, [])

  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setShowAuthModal(true)
    }
  }, [searchParams, setShowAuthModal])

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 animate-pulse-glow">
            <svg className="size-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Loading BNFX...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <LandingPage />
      <AuthModal />
      <InstallPWA />
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
