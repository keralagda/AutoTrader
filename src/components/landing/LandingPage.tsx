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
          root.style.setProperty('--template-primary', template.colors.primary || '#10b981')
          root.style.setProperty('--template-accent', template.colors.accent || '#06b6d4')
          root.style.setProperty('--template-bg', template.colors.background || '')
          root.style.setProperty('--template-card', template.colors.card || '')
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
