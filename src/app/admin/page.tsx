'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Old admin route - redirects to new location
export default function OldAdminPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return null
}
