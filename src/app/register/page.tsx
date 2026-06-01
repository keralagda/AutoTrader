'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import AuthModal from '@/components/auth/AuthModal'

export default function RegisterPage() {
  const { setShowAuthModal, setAuthMode, isAuthenticated, user } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      const staffRoles = ['admin', 'super_admin', 'moderator', 'support']
      if (staffRoles.includes(user.role)) {
        router.replace('/control-hub')
      } else {
        router.replace('/dashboard')
      }
      return
    }
    setAuthMode('register')
    setShowAuthModal(true)
  }, [isAuthenticated, user])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <AuthModal />
    </div>
  )
}
