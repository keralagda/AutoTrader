'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Gem, Shield, Crown, Rocket, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import type { PlanType } from '@/lib/types'
import { DEFAULT_PLANS } from '@/lib/types'

// Plan icon mapping
const planIcons: Record<string, React.ElementType> = {
  Starter: Shield,
  Silver: Gem,
  Gold: Crown,
  Platinum: Rocket,
}

// Plan glow class mapping
const planGlow: Record<string, string> = {
  Starter: 'hover:glow-emerald',
  Silver: 'hover:glow-cyan',
  Gold: 'hover:glow-amber',
  Platinum: 'hover:glow-emerald',
}

// Plan accent color mapping
const planAccent: Record<string, { text: string; border: string; bg: string; btn: string }> = {
  Starter: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    btn: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  Silver: {
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    btn: 'bg-cyan-500 hover:bg-cyan-600 text-white',
  },
  Gold: {
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  Platinum: {
    text: 'text-emerald-300',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
    btn: 'bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white',
  },
}

// Animated percentage counter
function AnimatedPercent({ value }: { value: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Number((eased * value).toFixed(1)))
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(value)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {count}%
    </span>
  )
}

export default function PlansSection() {
  const [plans, setPlans] = useState<PlanType[]>([])
  const [loading, setLoading] = useState(true)
  const { setShowAuthModal, setAuthMode } = useAppStore()
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setPlans(data)
          } else {
            // Fallback to default plans
            setPlans(
              DEFAULT_PLANS.map((p, i) => ({
                ...p,
                id: `default-${i}`,
                isActive: true,
              }))
            )
          }
        } else {
          setPlans(
            DEFAULT_PLANS.map((p, i) => ({
              ...p,
              id: `default-${i}`,
              isActive: true,
            }))
          )
        }
      } catch {
        setPlans(
          DEFAULT_PLANS.map((p, i) => ({
            ...p,
            id: `default-${i}`,
            isActive: true,
          }))
        )
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const handleJoin = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  return (
    <section id="plans" className="py-16 md:py-24 relative" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Investment{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Plans
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your investment goals. Start earning daily returns with our
            automated trading system.
          </p>
        </motion.div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 animate-pulse"
              >
                <div className="h-6 bg-muted rounded mb-4 w-1/2" />
                <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                <div className="h-4 bg-muted rounded mb-2 w-2/3" />
                <div className="h-10 bg-muted rounded mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const Icon = planIcons[plan.name] || TrendingUp
              const accent = planAccent[plan.name] || planAccent.Starter
              const glow = planGlow[plan.name] || 'hover:glow-emerald'
              const isPopular = plan.name === 'Gold'

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className={`relative ${isPopular ? 'lg:-mt-4 lg:mb-4' : ''}`}
                >
                  {/* Most Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-amber-500 text-white border-0 px-4 py-1 text-xs font-bold">
                        ⭐ Most Popular
                      </Badge>
                    </div>
                  )}

                  <Card
                    className={`bg-card/80 backdrop-blur-sm border transition-all duration-300 ${accent.border} ${glow} ${
                      isPopular ? 'scale-[1.02] border-amber-500/50' : ''
                    }`}
                  >
                    <CardHeader className="text-center pb-2">
                      <div
                        className={`size-14 rounded-full ${accent.bg} flex items-center justify-center mx-auto mb-3`}
                      >
                        <Icon className={`size-7 ${accent.text}`} />
                      </div>
                      <CardTitle className={`text-xl font-bold ${accent.text}`}>
                        {plan.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`${accent.border} ${accent.text} mx-auto mt-1`}
                      >
                        ${plan.entryFee} Entry
                      </Badge>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Min Deposit</span>
                          <span className="font-semibold">${plan.minDeposit}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max Deposit</span>
                          <span className="font-semibold">
                            ${plan.maxDeposit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Daily Earning</span>
                          <span className={`font-bold text-lg ${accent.text}`}>
                            <AnimatedPercent value={plan.dailyEarningPercent} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max Earning</span>
                          <span className="font-semibold">
                            ${plan.maxEarningLimit.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        className={`w-full font-semibold ${accent.btn}`}
                        onClick={handleJoin}
                        size="lg"
                      >
                        Join Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
