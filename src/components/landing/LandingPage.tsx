'use client'

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

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
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
  )
}
