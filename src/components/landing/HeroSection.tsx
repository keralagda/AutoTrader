'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Users, DollarSign, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { useLandingContent } from './LandingPage'

// Floating particles component
function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-400/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return count
}

const stats = [
  { icon: Users, label: 'Total Users', value: 12847, prefix: '', suffix: '+' },
  { icon: DollarSign, label: 'Total Earned', value: 2450000, prefix: '$', suffix: '' },
  { icon: TrendingUp, label: 'Active Plans', value: 8456, prefix: '', suffix: '' },
]

export default function HeroSection() {
  const { setShowAuthModal, setAuthMode } = useAppStore()
  const content = useLandingContent()
  const heroContent = content.hero || {}
  const userCount = useCounter(stats[0].value, 2500)
  const earnedCount = useCounter(stats[1].value, 2500)
  const plansCount = useCounter(stats[2].value, 2500)

  const formatNumber = useCallback((num: number, prefix: string, suffix: string) => {
    if (num >= 1000000) {
      return `${prefix}${(num / 1000000).toFixed(1)}M${suffix}`
    }
    if (num >= 1000) {
      return `${prefix}${(num / 1000).toFixed(1)}K${suffix}`
    }
    return `${prefix}${num.toLocaleString()}${suffix}`
  }, [])

  const handleStartEarning = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  const handleViewPlans = () => {
    const el = document.querySelector('#plans')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
      <Particles />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="block mb-2">{heroContent.title?.split('\n')[0] || '🔥 Start Now'}</span>
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
              {heroContent.title?.split('\n')[1] || 'Join BNFX!'}
            </span>
            <span className="block mt-2 text-3xl sm:text-4xl md:text-5xl">
              {heroContent.subtitle || 'Enable Your USDC Auto-Earning Mode!'}
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          {heroContent.description || 'Automated crypto trading with daily returns up to 15%. Join thousands of investors earning passive income with our AI-powered platform.'}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            onClick={handleStartEarning}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg px-8 py-6 animate-pulse-glow"
          >
            <Zap className="mr-2 size-5" />
            {heroContent.ctaPrimary || 'Start Earning'}
            <ArrowRight className="ml-2 size-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleViewPlans}
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-lg px-8 py-6"
          >
            View Plans
          </Button>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => {
            const counts = [userCount, earnedCount, plansCount]
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 text-center hover:border-emerald-500/30 transition-all duration-300"
              >
                <Icon className="size-8 text-emerald-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">
                  {formatNumber(counts[i], stat.prefix, stat.suffix)}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
