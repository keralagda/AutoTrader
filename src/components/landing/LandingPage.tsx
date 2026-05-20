'use client'

import Navbar from './Navbar'
import HeroSection from './HeroSection'
import PlansSection from './PlansSection'
import DistributionSection from './DistributionSection'
import ReferralSection from './ReferralSection'
import StatsSection from './StatsSection'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <PlansSection />
        <DistributionSection />
        <ReferralSection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  )
}
