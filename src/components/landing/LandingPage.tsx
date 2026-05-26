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
    fetch('/api/landing-content')
      .then(r => r.json())
      .then(setContent)
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
      </div>
    </LandingContentContext.Provider>
  )
}
