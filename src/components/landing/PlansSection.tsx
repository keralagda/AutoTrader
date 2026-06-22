'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Gem, Shield, Crown, Rocket, TrendingUp, Layers, Lock, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import type { PlanType } from '@/lib/types'
import { DEFAULT_PLANS } from '@/lib/types'

const getPlanLimitMultiplier = (plan: any): string => {
  if (plan && typeof plan === 'object') {
    const cappingType = plan.cappingType
    const value = plan.dailyEarningCapPercent
    if (cappingType === 'multiplier') {
      return `${value}X`
    } else if (cappingType === 'percentage') {
      return `${value}%`
    } else if (cappingType === 'fixed') {
      return `$${value}`
    } else if (value !== undefined) {
      if (value > 0) {
        const val = value / 100
        return `${val}X`
      } else if (value < 0) {
        return `$${Math.abs(value)}`
      }
    }
  }
  const name = (plan.name || '').toLowerCase()
  if (name.includes('starter')) return '1X'
  if (name.includes('flash') || name.includes('hourly')) return '1.5X'
  if (name.includes('silver')) return '2X'
  if (name.includes('gold')) return '2.5X'
  if (name.includes('platinum')) return '3X'
  return '2X' // default fallback
}

const getPlanKey = (planName: string): string => {
  const name = (planName || '').toLowerCase()
  if (name.includes('starter')) return 'Starter'
  if (name.includes('silver')) return 'Silver'
  if (name.includes('gold')) return 'Gold'
  if (name.includes('platinum')) return 'Platinum'
  if (name.includes('hourly') || name.includes('flash')) return 'Silver'
  if (name.includes('weekly')) return 'Gold'
  if (name.includes('fixed')) return 'Platinum'
  return 'Starter' // default fallback
}

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
  const prevValue = useRef(0)

  useEffect(() => {
    if (!isInView || value === 0) return

    // If value changed (e.g. after async load), always animate to new value
    const startVal = prevValue.current
    const duration = 1500
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Number((startVal + eased * (value - startVal)).toFixed(1)))
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(value)
        prevValue.current = value
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
  const [joinCounts, setJoinCounts] = useState<Record<string, number>>({})
  const { setShowAuthModal, setAuthMode } = useAppStore()
  const sectionRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return
    const container = carouselRef.current
    const cardWidth = container.firstElementChild?.clientWidth || 300
    const gap = 24
    container.scrollTo({ left: index * (cardWidth + gap), behavior: 'smooth' })
    setActiveSlide(index)
  }

  const handleScroll = () => {
    if (!carouselRef.current) return
    const container = carouselRef.current
    const cardWidth = container.firstElementChild?.clientWidth || 300
    const gap = 24
    const newIndex = Math.round(container.scrollLeft / (cardWidth + gap))
    setActiveSlide(newIndex)
  }

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`/api/plans?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setPlans(data)
            // Fetch join counts for each plan
            const counts: Record<string, number> = {}
            for (const p of data) {
              counts[p.id] = Math.floor(Math.random() * 50) + 20 // Fallback
            }
            // Try to get real counts
            try {
              const countRes = await fetch('/api/plans?action=counts')
              if (countRes.ok) {
                const countData = await countRes.json()
                if (countData && typeof countData === 'object') {
                  Object.assign(counts, countData)
                }
              }
            } catch {}
            setJoinCounts(counts)
          } else {
            setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}`, isActive: true })))
          }
        } else {
          setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}`, isActive: true })))
        }
      } catch {
        setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}`, isActive: true })))
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

        {/* Plans Carousel */}
        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 animate-pulse min-w-[280px] shrink-0"
              >
                <div className="h-6 bg-muted rounded mb-4 w-1/2" />
                <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                <div className="h-4 bg-muted rounded mb-2 w-2/3" />
                <div className="h-10 bg-muted rounded mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Arrows */}
            {plans.length > 1 && (
              <>
                <button
                  onClick={() => scrollToSlide(Math.max(0, activeSlide - 1))}
                  className="absolute -left-4 md:left-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-card/90 border border-border/50 shadow-lg flex items-center justify-center hover:bg-card hover:scale-110 transition-all backdrop-blur-sm"
                  aria-label="Previous plan"
                >
                  <ChevronLeft className="size-5 text-foreground" />
                </button>
                <button
                  onClick={() => scrollToSlide(Math.min(plans.length - 1, activeSlide + 1))}
                  className="absolute -right-4 md:right-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-card/90 border border-border/50 shadow-lg flex items-center justify-center hover:bg-card hover:scale-110 transition-all backdrop-blur-sm"
                  aria-label="Next plan"
                >
                  <ChevronRight className="size-5 text-foreground" />
                </button>
              </>
            )}

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-8 md:px-12 -mx-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {plans.map((plan, index) => {
                const planKey = getPlanKey(plan.name)
                const Icon = planIcons[planKey] || TrendingUp
                const accent = planAccent[planKey] || planAccent.Starter
                const glow = planGlow[planKey] || 'hover:glow-emerald'
                const isPopular = planKey === 'Gold'

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="min-w-[280px] md:min-w-[300px] snap-center shrink-0 relative"
                  >
                  {/* Most Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-amber-500 text-white border-0 px-4 py-1 text-xs font-bold">
                        Most Popular
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
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Badge variant="outline" className={`${accent.border} ${accent.text}`}>
                          ${plan.entryFee} Entry
                        </Badge>
                        {plan.stackingEnabled && (
                          <Badge variant="outline" className="border-violet-500/30 text-violet-400">
                            <Layers className="size-3 mr-1" /> Stackable
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Min Deposit</span>
                          <span className="font-semibold" dir="ltr">${plan.minDeposit}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max Deposit</span>
                          <span className="font-semibold" dir="ltr">
                            ${plan.maxDeposit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Daily Earning</span>
                          <span className={`font-bold text-lg ${accent.text}`} dir="ltr">
                            {(plan as any).lowRiskMin || 0.3}% - {(plan as any).highRiskMax || 8.0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Daily Limit</span>
                          <span className="font-semibold" dir="ltr">
                            {(() => {
                              const mult = getPlanLimitMultiplier(plan)
                              return mult.startsWith('$') ? mult : `${mult} of Investment`
                            })()}
                          </span>
                        </div>

                        {/* Stacking Info */}
                        {plan.stackingEnabled && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stack Bonus</span>
                            <span className="font-semibold text-violet-400 flex items-center gap-1">
                              <Zap className="size-3" />+{plan.stackingBonusPercent}%/stack
                            </span>
                          </div>
                        )}

                        {/* Lock Period */}
                        {plan.lockPeriodDays > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Lock Period</span>
                            <span className="font-semibold flex items-center gap-1">
                              <Lock className="size-3 text-amber-400" />{plan.lockPeriodDays} days
                            </span>
                          </div>
                        )}

                        {/* Staking Info */}
                        {plan.stakingEnabled && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Staking Yield</span>
                            <span className="font-semibold text-emerald-400 flex items-center gap-1">
                              <Sparkles className="size-3" />+{plan.stakingBonusPercent || 0}%/day ({plan.stakingMinDays || 30}d lock)
                            </span>
                          </div>
                        )}

                        {/* Pairing Rules Grid */}
                        {plan.showPairingRulesInPlanDetails && (plan as any).pairingRules && (plan as any).pairingRules.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5 text-[11px]">
                            <p className="text-emerald-400 font-semibold uppercase tracking-wider text-[9px]">Alliance Pair Bonuses</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(plan as any).pairingRules.map((rule: any, ri: number) => (
                                <div key={ri} className="p-1 rounded bg-muted/40 border border-border/30 text-[10px] flex flex-col">
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Lvl {rule.levelRange}:</span>
                                    <span className="text-foreground font-semibold">
                                      {rule.bonusType === 'percent' ? `${rule.bonusValue}%` : `$${rule.bonusValue}`}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground text-right italic">{rule.ratio} Ratio</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        className={`w-full font-semibold ${accent.btn}`}
                        onClick={handleJoin}
                        size="lg"
                      >
                        Join Now
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {joinCounts[plan.id] || Math.floor(Math.random() * 30) + 12} people joined
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
            </div>

            {/* Dot Indicators */}
            {plans.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {plans.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToSlide(i)}
                    className={`rounded-full transition-all duration-300 ${
                      activeSlide === i
                        ? 'w-8 h-2.5 bg-primary'
                        : 'w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to plan ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
