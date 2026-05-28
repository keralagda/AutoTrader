'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Navbar from './Navbar'
import HeroSection from './HeroSection'
import PlansSection from './PlansSection'
import { EarningsCalculator } from './EarningsCalculator'
import DistributionSection from './DistributionSection'
import ReferralSection from './ReferralSection'
import { TestimonialsSection } from './TestimonialsSection'
import StatsSection from './StatsSection'
import Footer from './Footer'
import { FakeNotificationToast } from './FakeNotificationToast'
import { PromotionBanner } from './PromotionBanner'
import { AnnouncementBanner } from './AnnouncementBanner'
import { WithdrawalProofTicker } from './WithdrawalProofTicker'
import { ReferralCalculator } from './ReferralCalculator'

// Context to share landing content across all sections
interface LandingContent {
  hero?: any
  stats?: any
  navbar?: any
  footer?: any
  [key: string]: any
}

const LandingContentContext = createContext<LandingContent>({})

export function useLandingContent() {
  return useContext(LandingContentContext)
}

export default function LandingPage() {
  const [content, setContent] = useState<LandingContent>({})

  useEffect(() => {
    // Fetch landing content
    fetch('/api/landing-content')
      .then(r => r.json())
      .then(setContent)
      .catch(() => {})

    // Fetch and apply active template colors
    fetch('/api/active-template')
      .then(r => r.json())
      .then(template => {
        if (template?.colors) {
          const root = document.documentElement
          // Override Tailwind's primary color with template color
          root.style.setProperty('--color-primary', template.colors.primary || '#10b981')
          // Override emerald colors used throughout landing page
          root.style.setProperty('--color-emerald-400', template.colors.primary || '#34d399')
          root.style.setProperty('--color-emerald-500', template.colors.primary || '#10b981')
          root.style.setProperty('--color-emerald-600', template.colors.accent || '#059669')
          // Set background if template specifies one
          if (template.colors.background) {
            root.style.setProperty('--background', template.colors.background)
            document.body.style.backgroundColor = template.colors.background
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <LandingContentContext.Provider value={content}>
      <div className="min-h-screen flex flex-col bg-background">
        <AnnouncementBanner />
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <PlansSection />
          <EarningsCalculator />
          <DistributionSection />
          <ReferralSection />
          <ReferralCalculator />
          <TestimonialsSection />
          <StatsSection />
        </main>
        <Footer />
        <FakeNotificationToast />
        <PromotionBanner />
        <WithdrawalProofTicker />
      </div>
    </LandingContentContext.Provider>
  )
}
