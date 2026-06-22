'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowDown, Sparkles, Shield, Zap, Globe, Users, TrendingUp, ChevronRight } from 'lucide-react'
import type { PlanType } from '@/lib/types'
import { useLandingContent } from './LandingPage'
import StatsSection from './StatsSection'
import DistributionSection from './DistributionSection'

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

const getPlanEmoji = (planName: string, index: number): string => {
  const name = (planName || '').toLowerCase()
  if (name.includes('starter')) return '🛡️'
  if (name.includes('hourly') || name.includes('flash')) return '⚡'
  if (name.includes('silver')) return '💎'
  if (name.includes('gold')) return '👑'
  if (name.includes('platinum')) return '🚀'
  return ['🛡️', '⚡', '💎', '👑', '🚀'][index] || '📈'
}

// Import premium Awwwards-style modular components
import { CustomCursor } from './CustomCursor'
import { ParticleBackground } from './ParticleBackground'
import { InfiniteMarquee } from './InfiniteMarquee'
import { SplitTextReveal } from './SplitTextReveal'
import { EarningsCalculator } from './EarningsCalculator'
import { ReferralCalculator } from './ReferralCalculator'
import { MagneticButton } from './MagneticButton'

export function AwwwardsLanding() {
  const { setShowAuthModal, setAuthMode } = useAppStore()
  const [plans, setPlans] = useState<PlanType[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [time, setTime] = useState<string>('00:00:00')
  const heroRef = useRef<HTMLDivElement>(null)
  
  const content = useLandingContent()
  const navContent = content.navbar || {}
  const heroContent = content.hero || {}
  const statsContent = content.stats || {}
  const footerContent = content.footer || {}
  const testimonialsContent = content.testimonials || {}

  const { scrollYProgress } = useScroll()
  
  // Parallax translation, fade, and scale values directly tied to scroll timeline
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.92])

  useEffect(() => {
    // Fetch active plans from db
    fetch('/api/plans')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setPlans(d)
      })
      .catch(() => {})

    // Sync GMT time clock ticker
    const updateClock = () => {
      const d = new Date()
      setTime(d.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }))
    }
    updateClock()
    const timerId = setInterval(updateClock, 1000)

    // Mouse movement coordinates tracker
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }
    window.addEventListener('mousemove', handleMouse)

    return () => {
      clearInterval(timerId)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  const handleRegister = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }
  const handleLogin = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const liveStatsMarquee = [
    'AI Engine Online',
    'Daily Yield: 0.3% - 8.0%',
    'Multi-Sig Secure Vaults',
    'No Lockups',
    '24/7 Liquidity Providers',
    'Audit Cleared 100%',
    'Referral Bonus: 7 Levels',
    'Instant Withdrawals'
  ]

  const heroStats = heroContent.stats || []
  const marqueeItems = heroStats.length > 0
    ? heroStats.map((s: any) => `${s.prefix || ''}${s.value}${s.suffix || ''} ${s.label}`)
    : liveStatsMarquee

  const heroTitle = heroContent.title || 'Wealth engineered.\nby sovereign intelligence.\nautomated. compounding.'
  const lines = heroTitle.split('\n')
  const line1 = lines[0] || 'Wealth engineered.'
  const line2 = lines[1] || 'by sovereign intelligence.'
  const line3 = lines[2] || 'automated. compounding.'

  return (
    <div className="bg-[#030303] text-[#f5f5f0] min-h-screen overflow-x-hidden selection:bg-amber-400/20 selection:text-amber-200">
      {/* ─── Premium Custom Cursor ─── */}
      <CustomCursor />

      {/* ─── Floating Mono Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-black/10 border-b border-white/[0.03]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <img
              src={navContent.logoImage || "/bnfx-logo.svg"}
              alt="Logo"
              className="h-5 w-auto"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <span className="font-mono text-sm tracking-wider uppercase font-bold text-white">
              {navContent.logoText || 'BNFX // CORE'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-[0.2em] text-white/50">
            {navContent.links && navContent.links.length > 0 ? (
              navContent.links.map((link: any, idx: number) => (
                <a key={idx} href={link.href} className="hover:text-white transition-colors">
                  [ {link.label} ]
                </a>
              ))
            ) : (
              <>
                <a href="#features" className="hover:text-white transition-colors">
                  [ Features ]
                </a>
                <a href="#plans" className="hover:text-white transition-colors">
                  [ Plans ]
                </a>
                <a href="#calculator" className="hover:text-white transition-colors">
                  [ Returns Engine ]
                </a>
                <a href="#referrals" className="hover:text-white transition-colors">
                  [ Referral Network ]
                </a>
                <a href="/leaderboard" className="hover:text-white transition-colors">
                  [ Leaderboard ]
                </a>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogin}
              className="text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors mr-2"
            >
              Sign in
            </button>
            <MagneticButton
              onClick={handleRegister}
              className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
            >
              Enter System
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section with Arena Aesthetics ─── */}
      <section
        ref={heroRef}
        className="relative min-h-screen w-full flex items-center justify-center px-6 pt-24 pb-12 overflow-hidden"
      >
        {/* Particle Canvas Background */}
        <ParticleBackground />

        {/* Floating Ambient Glow Layer */}
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.25, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[150px] opacity-30 bg-amber-500/10 pointer-events-none"
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 w-full max-w-[1600px] mx-auto space-y-12"
        >
          {/* Eyebrow & Live Time */}
          <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-white/50 border-b border-white/[0.03] pb-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              ◉ {heroContent.subtitle || 'EST. 2026 // WEALTH ENGINE COLLECTIVE'}
            </div>
            <div className="hidden md:flex items-center gap-6">
              <span>[ {time} GMT ]</span>
              <span>YIELD SYSTEM: ONLINE</span>
              <span>SESSION /001</span>
            </div>
          </div>

          {/* Giant Typography Header Structure */}
          <div className="leading-[0.85] font-black tracking-[-0.04em] text-[clamp(2.4rem,8vw,7.5rem)] select-none">
            <div className="flex items-baseline gap-4 flex-wrap">
              <SplitTextReveal text={line1} tag="h1" delay={0.1} />
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.4, type: 'spring' }}
                className="text-amber-400 text-[0.4em] inline-block font-sans"
              >
                ✱
              </motion.span>
            </div>
            <div className="text-right">
              <SplitTextReveal
                text={line2}
                tag="h1"
                delay={0.3}
                className="italic font-light text-white/70"
              />
            </div>
            <div>
              <span className="relative inline-block text-amber-400">
                <SplitTextReveal text={line3} tag="h1" delay={0.5} />
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute -bottom-2 left-0 h-1 w-full origin-left bg-amber-400"
                />
              </span>
            </div>
          </div>

          {/* Subtitle & Magnetic Action Button */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-16 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="md:col-span-5"
            >
              <p className="text-base md:text-lg leading-relaxed text-white/50 max-w-md">
                {heroContent.description || 'Capital allocation executed with sub-millisecond mathematical precision. Elevate your portfolio with institutional-grade AI yields. Total control, zero complexity.'}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="md:col-span-4 md:col-start-9"
            >
              <MagneticButton
                onClick={handleRegister}
                className="group w-full text-left p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md hover:bg-white/5 transition-colors"
              >
                <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40 mb-3">
                  /001 START_HERE
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{heroContent.ctaPrimary || 'Start Earning Yield'}</span>
                  <div className="p-3 rounded-full bg-amber-400 text-black group-hover:rotate-45 transition-transform duration-500">
                    <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                </div>
              </MagneticButton>
            </motion.div>
          </div>

          {/* Scroll down indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2 }}
            className="flex items-center gap-3 pt-6"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-px h-12 bg-white opacity-50"
            />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
              Scroll
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Infinite Live Stats Marquee ─── */}
      <InfiniteMarquee items={marqueeItems} speed={20} />

      {/* ─── Bento Features Grid ─── */}
      <section id="features" className="py-32 px-6 relative max-w-[1600px] mx-auto">
        <div className="mb-16">
          <p className="text-xs text-amber-400 font-medium mb-3 font-mono">
            {statsContent.subtitle || '/PILLARS · 05 CORE FEATURES'}
          </p>
          <SplitTextReveal
            text={statsContent.title || 'Built for the modern investor.'}
            tag="h2"
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FadeInView className="md:col-span-2">
            <div className="relative h-80 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-8 overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-[80px] group-hover:bg-amber-500/10 transition-colors duration-500" />
              <Zap className="size-10 text-amber-400 mb-6" />
              <h3 className="text-2xl font-bold mb-3">AI-Powered Trading Engine</h3>
              <p className="text-white/50 text-base max-w-lg leading-relaxed">
                Our neural network processes 10,000+ market signals per second, executing trades with sub-millisecond precision across 200+ pairs.
              </p>
              <div className="absolute bottom-6 right-8 text-white/20 font-mono text-xs">/01 ENGINE</div>
            </div>
          </FadeInView>

          <FadeInView>
            <div className="relative h-80 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-8 group hover:border-white/20 transition-all duration-500 backdrop-blur-sm">
              <Shield className="size-10 text-emerald-400 mb-6" />
              <h3 className="text-2xl font-bold mb-3">Bank-Grade Security</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                256-bit encryption, multi-sig wallets, and cold storage. Your funds are protected by institutional security.
              </p>
              <div className="absolute bottom-6 right-8 text-white/20 font-mono text-xs">/02 SAFETY</div>
            </div>
          </FadeInView>

          <FadeInView>
            <div className="relative h-80 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-8 group hover:border-white/20 transition-all duration-500 backdrop-blur-sm">
              <Globe className="size-10 text-cyan-400 mb-6" />
              <h3 className="text-2xl font-bold mb-3">Global Access</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Available in 50+ countries. Deposit via MetaMask, USDC, or transfer pipelines. Multi-language support.
              </p>
              <div className="absolute bottom-6 right-8 text-white/20 font-mono text-xs">/03 GLOBAL</div>
            </div>
          </FadeInView>

          <FadeInView>
            <div className="relative h-80 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-8 group hover:border-white/20 transition-all duration-500 backdrop-blur-sm">
              <Users className="size-10 text-violet-400 mb-6" />
              <h3 className="text-2xl font-bold mb-3">7-Level Referrals</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Earn from your entire network. Up to 25% commission on Level 1, cascading through 7 levels of depth.
              </p>
              <div className="absolute bottom-6 right-8 text-white/20 font-mono text-xs">/04 NETWORK</div>
            </div>
          </FadeInView>

          <FadeInView>
            <div className="relative h-80 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-8 group hover:border-white/20 transition-all duration-500 backdrop-blur-sm">
              <TrendingUp className="size-10 text-rose-400 mb-6" />
              <h3 className="text-2xl font-bold mb-3">Variable Returns</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Choose your risk level. Low (0.3-1.2%), Medium (1-3%), or High (2.5-8%) daily returns based on market conditions.
              </p>
              <div className="absolute bottom-6 right-8 text-white/20 font-mono text-xs">/05 YIELD</div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ─── Stats Section ─── */}
      {content.stats?.isVisible !== false && (
        <section id="stats" className="py-32 px-6 border-t border-white/[0.03] bg-black/10">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-16">
              <p className="text-xs text-amber-400 font-medium mb-3 font-mono">/METRICS · PERFORMANCE STATISTICS</p>
              <SplitTextReveal
                text={statsContent.title || "Real-time Platform Growth"}
                tag="h2"
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4"
              />
              {statsContent.subtitle && (
                <p className="text-white/40 max-w-lg mt-4">{statsContent.subtitle}</p>
              )}
            </div>
            <StatsSection />
          </div>
        </section>
      )}

      {/* ─── Plans Section ─── */}
      {content.plans?.isVisible !== false && (
        <section id="plans" className="py-32 px-6 bg-[#050506]/40 relative border-t border-white/[0.03]">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-16">
              <p className="text-xs text-amber-400 font-medium mb-3 font-mono">/INDEX_002 · OPERATIONAL PLANS</p>
              <SplitTextReveal
                text={content.plans?.title || "Choose your path."}
                tag="h2"
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4"
              />
              <p className="text-white/40 max-w-lg">
                {content.plans?.subtitle || "From conservative to aggressive — pick the strategy that matches your wealth goals."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {(plans || []).map((plan, i) => (
                <FadeInView key={plan.id} delay={i * 0.1}>
                  <div className="rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 p-6 hover:border-amber-500/20 transition-all duration-500 group backdrop-blur-sm flex flex-col justify-between h-full">
                    <div>
                      <div className="text-3xl mb-4">{getPlanEmoji(plan.name, i)}</div>
                      <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                      <p className="text-white/40 text-xs mb-4">From ${plan.minDeposit}</p>
                      <div className="space-y-2 text-sm border-t border-white/[0.05] pt-4">
                        <div className="flex justify-between text-white/60">
                          <span>Daily Return</span>
                          <span className="text-amber-400 font-medium font-mono" dir="ltr">
                            {(plan as any).lowRiskMin || 0.3}%-{(plan as any).highRiskMax || 8}%
                          </span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>Max Deposit</span>
                          <span dir="ltr" className="font-mono">${plan.maxDeposit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>Daily Limit</span>
                          <span dir="ltr" className="font-mono">
                            {(() => {
                              const mult = getPlanLimitMultiplier(plan)
                              return mult.startsWith('$') ? mult : `${mult} of Investment`
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRegister}
                      className="w-full mt-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-300 group-hover:border-amber-500/30"
                    >
                      Get Started <ChevronRight className="inline size-3.5" />
                    </button>
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Integrated Dynamic Earnings Calculator ─── */}
      <section id="calculator" className="relative py-32 px-6 border-t border-white/[0.03]">
        <EarningsCalculator />
      </section>

      {/* ─── How It Works ─── */}
      <section id="returns" className="py-32 px-6 border-t border-white/[0.03]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-xs text-amber-400 font-medium mb-3 font-mono">/SYSTEM_METRIC · HOW IT WORKS</p>
            <SplitTextReveal
              text="Three steps to passive income."
              tag="h2"
              className="text-4xl md:text-5xl font-black tracking-tight"
            />
          </div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Deposit Funds',
                desc: 'Connect MetaMask or send USDC via any supported network. Minimum $10.',
              },
              {
                step: '02',
                title: 'Choose a Plan',
                desc: 'Select your risk level and investment amount. Our AI handles the rest.',
              },
              {
                step: '03',
                title: 'Earn Daily',
                desc: 'Returns are credited automatically. Withdraw anytime or reinvest to compound.',
              },
            ].map((item, i) => (
              <FadeInView key={i} delay={i * 0.15}>
                <div className="flex items-start gap-8 group">
                  <span className="text-5xl font-bold font-mono text-white/10 group-hover:text-amber-400/20 transition-colors duration-500 shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-white/50 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Integrated Dynamic Referral Calculator ─── */}
      {content.referral?.isVisible !== false && (
        <section id="referrals" className="relative py-32 px-6 border-t border-white/[0.03] bg-[#050506]/40">
          <div className="max-w-[1600px] mx-auto mb-16">
            <p className="text-xs text-amber-400 font-medium mb-3 font-mono">/PIPELINE · NETWORK COMMISSIONS</p>
            <SplitTextReveal
              text={content.referral?.title || "Referral Network Yields"}
              tag="h2"
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4"
            />
            {content.referral?.subtitle && (
              <p className="text-white/40 max-w-lg">{content.referral.subtitle}</p>
            )}
          </div>
          <ReferralCalculator />
        </section>
      )}

      {/* ─── Distribution Section ─── */}
      {content.distribution?.isVisible !== false && (
        <section id="distribution" className="py-32 px-6 border-t border-white/[0.03] bg-[#050506]/20">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-16">
              <p className="text-xs text-amber-400 font-medium mb-3 font-mono">/ALLOCATION · PROFIT & FEE SPLITS</p>
              <SplitTextReveal
                text={content.distribution?.title || "Profit Distribution Structure"}
                tag="h2"
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4"
              />
              {content.distribution?.subtitle && (
                <p className="text-white/40 max-w-lg">{content.distribution.subtitle}</p>
              )}
            </div>
            <DistributionSection />
          </div>
        </section>
      )}

      {/* ─── Testimonials Section ─── */}
      {testimonialsContent.isVisible !== false && (
        <section id="testimonials" className="py-32 px-6 border-t border-white/[0.03] bg-black/20">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-16">
              <p className="text-xs text-amber-400 font-medium mb-3 font-mono">/FEEDBACK · WHAT TRADERS SAY</p>
              <SplitTextReveal
                text={testimonialsContent.title || "Sovereign validation."}
                tag="h2"
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
              />
              {testimonialsContent.subtitle && (
                <p className="text-white/40 mt-4 max-w-lg">{testimonialsContent.subtitle}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(testimonialsContent.items || []).map((item: any, i: number) => (
                <FadeInView key={i} delay={i * 0.1} className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-4 hover:border-amber-500/20 transition-all duration-300">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    {Array.from({ length: item.rating || 5 }).map((_, rIdx) => (
                      <span key={rIdx}>★</span>
                    ))}
                  </div>
                  <p className="text-white/70 italic text-sm leading-relaxed">&ldquo;{item.content}&rdquo;</p>
                  <div className="flex justify-between items-end pt-4 border-t border-white/5">
                    <div>
                      <p className="font-bold text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{item.role}</p>
                    </div>
                    {item.earnings && (
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">{item.earnings}</span>
                    )}
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Section ─── */}
      <section className="py-36 px-6 border-t border-white/[0.03] relative overflow-hidden text-center">
        {/* Floating background orb */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 space-y-8">
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            Ready to step into the
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              yield economy?
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-lg mx-auto">
            Join 25,000+ investors already earning daily returns with our AI-powered platform.
          </p>
          <div className="pt-4 flex justify-center">
            <MagneticButton
              onClick={handleRegister}
              className="group px-10 py-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/20 transition-all"
            >
              Create Free Account
              <ArrowRight className="inline-block ml-2 size-5 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-white/40">
          <div className="flex items-center gap-2">
            <img
              src={navContent.logoImage || "/bnfx-logo.svg"}
              alt="Logo"
              className="h-5 w-auto"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <span className="font-bold text-white">{footerContent.companyName || 'BNFX // CORE'}</span>
            <span className="ml-2">{footerContent.copyright || '© 2026'}</span>
          </div>
          <div className="flex items-center gap-6">
            {footerContent.links && footerContent.links.length > 0 ? (
              footerContent.links.map((link: any, idx: number) => (
                <a key={idx} href={link.url} className="hover:text-white transition-colors">
                  [ {link.label} ]
                </a>
              ))
            ) : (
              <>
                <a href="#" className="hover:text-white transition-colors">
                  [ Terms ]
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  [ Privacy ]
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  [ Risk Disclaimer ]
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  [ Support ]
                </a>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Scroll-triggered fade-in component ──────────────────────────────────────
function FadeInView({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 35 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
