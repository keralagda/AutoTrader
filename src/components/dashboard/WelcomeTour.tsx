'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, Shield, Users, Gift, ArrowRight, CheckCircle2 } from 'lucide-react'

const tourSteps = [
  {
    icon: CreditCard,
    title: 'Deposit Funds',
    description: 'Add USDC to your Trading Wallet using crypto, UPI, or bank transfer. Multiple payment methods available.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Choose a Plan',
    description: 'Select an investment plan that suits your goals. Plans offer daily returns from 1% to 15% based on tier.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Gift,
    title: 'Earn Daily Returns',
    description: 'Your investment earns automated returns daily. Track your earnings in real-time from the dashboard.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Refer & Earn More',
    description: 'Share your referral code with friends. Earn bonus commissions on their deposits across multiple levels.',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  {
    icon: Shield,
    title: 'Secure Your Account',
    description: 'Enable 2FA, complete KYC verification, and set a strong password to protect your funds.',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
]

export function WelcomeTour() {
  const { user } = useAppStore()
  const [showTour, setShowTour] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    // Show tour only for new users (check localStorage)
    const tourSeen = localStorage.getItem(`tour_seen_${user.id}`)
    if (!tourSeen) {
      // Delay showing tour slightly
      const timer = setTimeout(() => setShowTour(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [user?.id])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(`tour_seen_${user.id}`, 'true')
    }
    setShowTour(false)
  }

  const step = tourSteps[currentStep]
  const StepIcon = step.icon

  return (
    <Dialog open={showTour} onOpenChange={(open) => { if (!open) handleComplete() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Welcome to BNFX!
          </DialogTitle>
          <DialogDescription>
            Here&apos;s how to get started in {tourSteps.length} easy steps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-1">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-primary' : 'bg-muted/30'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center py-4 space-y-4">
            <div className={`h-16 w-16 rounded-2xl ${step.bgColor} flex items-center justify-center mx-auto`}>
              <StepIcon className={`h-8 w-8 ${step.color}`} />
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Step {currentStep + 1} of {tourSteps.length}</Badge>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{step.description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleComplete} className="text-muted-foreground">
              Skip Tour
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep < tourSteps.length - 1 ? (
                <>Next <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Get Started <CheckCircle2 className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
