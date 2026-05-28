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
import { NovaAIChatbot } from './NovaAIChatbot'

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
          const c = template.colors

          // Override CSS variables at root level - use hex directly
          // These override the oklch values defined in globals.css
          if (c.primary) {
            root.style.setProperty('--primary', c.primary)
            root.style.setProperty('--color-primary', c.primary)
            root.style.setProperty('--color-emerald-400', c.primary)
            root.style.setProperty('--color-emerald-500', c.primary)
          }

          if (c.accent) {
            root.style.setProperty('--color-emerald-600', c.accent)
            root.style.setProperty('--color-cyan-400', c.accent)
            root.style.setProperty('--color-cyan-500', c.accent)
          }

          if (c.background) {
            root.style.setProperty('--background', c.background)
            root.style.setProperty('--color-background', c.background)
            document.body.style.backgroundColor = c.background
            // Also set the landing page wrapper
            const landing = document.querySelector('.min-h-screen')
            if (landing) (landing as HTMLElement).style.backgroundColor = c.background
          }

          if (c.card) {
            root.style.setProperty('--card', c.card)
            root.style.setProperty('--color-card', c.card)
          }

          if (c.text) {
            root.style.setProperty('--foreground', c.text)
            root.style.setProperty('--color-foreground', c.text)
            root.style.setProperty('--card-foreground', c.text)
            document.body.style.color = c.text
          }
        }

        // Apply font if template specifies one
        if (template?.styles?.fontFamily) {
          const fontName = template.styles.fontFamily.split(',')[0].trim().replace(/'/g, '')
          if (fontName && !document.querySelector(`link[data-font="${fontName}"]`)) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`
            link.setAttribute('data-font', fontName)
            document.head.appendChild(link)
            // Apply font after it loads
            link.onload = () => {
              document.documentElement.style.fontFamily = template.styles.fontFamily
            }
          } else {
            document.documentElement.style.fontFamily = template.styles.fontFamily
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <LandingContentContext.Provider value={content}>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
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
        <NovaAIChatbot />
      </div>
    </LandingContentContext.Provider>
  )
}
