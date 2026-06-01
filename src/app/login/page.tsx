'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import AuthModal from '@/components/auth/AuthModal'

export default function LoginPage() {
  const { setShowAuthModal, setAuthMode, isAuthenticated, user } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    // If already authenticated, redirect
    if (isAuthenticated && user) {
      const staffRoles = ['admin', 'super_admin', 'moderator', 'support']
      if (staffRoles.includes(user.role)) {
        router.replace('/control-hub')
      } else {
        router.replace('/dashboard')
      }
      return
    }
    setAuthMode('login')
    setShowAuthModal(true)
  }, [isAuthenticated, user])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <AuthModal />
    </div>
  )
}
