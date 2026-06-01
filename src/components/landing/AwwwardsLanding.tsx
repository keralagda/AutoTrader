'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Diamond, ArrowRight, ArrowDown, Sparkles, Shield, Zap, Globe, Users, TrendingUp, ChevronRight } from 'lucide-react'
import type { PlanType } from '@/lib/types'

// ─── Awwwards-Inspired Landing Page ─────────────────────────────────────────
// Inspired by: Linear.app, Stripe, Vercel, Lusion.co, Awwwards SOTD winners
// Features: Large kinetic typography, bento grids, scroll animations, minimal UI

export function AwwwardsLanding() {
  const { setShowAuthModal, setAuthMode } = useAppStore()
  const [plans, setPlans] = useState<PlanType[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(d => { if (Array.isArray(d)) setPlans(d) }).catch(() => {})
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const handleRegister = () => { setAuthMode('register'); setShowAuthModal(true) }
  const handleLogin = () => { setAuthMode('login'); setShowAuthModal(true) }

  return (
    <div className="bg-[#030303] text-white min-h-screen overflow-x-hidden selection:bg-amber-400/20 selection:text-amber-200">
      {/* ─── Floating Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Diamond className="size-6 text-amber-400 fill-amber-400/20" />
            <span className="text-lg font-bold tracking-tight">BNFX</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#plans" className="hover:text-white transition-colors">Plans</a>
            <a href="#returns" className="hover:text-white transition-colors">Returns</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogin} className="text-sm text-white/60 hover:text-white transition-colors">Sign in</button>
            <button onClick={handleRegister} className="text-sm px-4 py-2 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <motion.section ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }} className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }} />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[100px]" style={{ transform: `translate(${-mousePos.x * 20}px, ${-mousePos.y * 20}px)` }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <Badge className="bg-white/5 text-white/70 border-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium">
              <Sparkles className="size-3 mr-1.5 text-amber-400" />
              AI-Powered Wealth Generation
            </Badge>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[0.9]">
            <span className="block">Your money</span>
            <span className="block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">works harder.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            Automated crypto trading with institutional-grade AI. Earn daily returns while you sleep. No trading experience required.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="flex items-center justify-center gap-4">
            <button onClick={handleRegister} className="group px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-base hover:shadow-lg hover:shadow-amber-500/20 transition-all">
              Start Earning
              <ArrowRight className="inline-block ml-2 size-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-6 py-4 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-all text-sm">
              View Performance
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ArrowDown className="size-5 text-white/30" />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Stats Ticker ─── */}
      <section className="py-8 border-y border-white/5">
        <div className="flex items-center justify-center gap-12 md:gap-20 text-center">
          {[
            { value: '$25M+', label: 'Total Volume' },
            { value: '25,000+', label: 'Active Investors' },
            { value: '99.9%', label: 'Uptime' },
            { value: '0.3-8%', label: 'Daily Returns' },
          ].map((stat, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white" dir="ltr">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ─── Bento Features Grid ─── */}
      <section id="features" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <p className="text-sm text-amber-400 font-medium mb-4">WHY BNFX</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">Built for the<br />modern investor.</h2>
          </FadeInView>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large card */}
            <FadeInView className="md:col-span-2 lg:col-span-2">
              <div className="relative h-72 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-8 overflow-hidden group hover:border-white/10 transition-colors">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] group-hover:bg-amber-500/10 transition-colors" />
                <Zap className="size-10 text-amber-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Trading Engine</h3>
                <p className="text-white/50 text-sm max-w-md leading-relaxed">Our neural network processes 10,000+ market signals per second, executing trades with sub-millisecond precision across 200+ pairs.</p>
              </div>
            </FadeInView>

            <FadeInView>
              <div className="h-72 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-8 group hover:border-white/10 transition-colors">
                <Shield className="size-10 text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bank-Grade Security</h3>
                <p className="text-white/50 text-sm leading-relaxed">256-bit encryption, multi-sig wallets, and cold storage. Your funds are protected by institutional security.</p>
              </div>
            </FadeInView>

            <FadeInView>
              <div className="h-72 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-8 group hover:border-white/10 transition-colors">
                <Globe className="size-10 text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Global Access</h3>
                <p className="text-white/50 text-sm leading-relaxed">Available in 50+ countries. Deposit via MetaMask, USDT, USDC, or wire transfer. Multi-language support.</p>
              </div>
            </FadeInView>

            <FadeInView>
              <div className="h-72 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-8 group hover:border-white/10 transition-colors">
                <Users className="size-10 text-violet-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">7-Level Referrals</h3>
                <p className="text-white/50 text-sm leading-relaxed">Earn from your entire network. Up to 25% commission on Level 1, cascading through 7 levels of depth.</p>
              </div>
            </FadeInView>

            <FadeInView>
              <div className="h-72 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-8 group hover:border-white/10 transition-colors">
                <TrendingUp className="size-10 text-rose-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Variable Returns</h3>
                <p className="text-white/50 text-sm leading-relaxed">Choose your risk level. Low (0.3-1.2%), Medium (1-3%), or High (2.5-8%) daily returns based on market conditions.</p>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* ─── Plans Section ─── */}
      <section id="plans" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <p className="text-sm text-amber-400 font-medium mb-4">INVESTMENT PLANS</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Choose your path.</h2>
            <p className="text-white/50 mb-16 max-w-lg">From conservative to aggressive — pick the strategy that matches your goals.</p>
          </FadeInView>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(plans || []).slice(0, 4).map((plan, i) => (
              <FadeInView key={plan.id} delay={i * 0.1}>
                <div className="rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] p-6 hover:border-amber-500/20 transition-all group">
                  <div className="text-3xl mb-4">{['🛡️', '💎', '👑', '🚀'][i] || '📈'}</div>
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-white/40 text-xs mb-4">From ${plan.minDeposit}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Daily Return</span>
                      <span className="text-amber-400 font-medium" dir="ltr">{(plan as any).lowRiskMin || 0.3}%-{(plan as any).highRiskMax || 8}%</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Max Deposit</span>
                      <span dir="ltr">${plan.maxDeposit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Multiplier</span>
                      <span dir="ltr">{Math.round(plan.maxEarningLimit / plan.minDeposit)}X</span>
                    </div>
                  </div>
                  <button onClick={handleRegister} className="w-full mt-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all group-hover:border-amber-500/30">
                    Get Started <ChevronRight className="inline size-3.5" />
                  </button>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="returns" className="py-24 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <FadeInView>
            <p className="text-sm text-amber-400 font-medium mb-4">HOW IT WORKS</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">Three steps to<br />passive income.</h2>
          </FadeInView>

          <div className="space-y-12">
            {[
              { step: '01', title: 'Deposit Funds', desc: 'Connect MetaMask or send USDT/USDC via any supported network. Minimum $10.' },
              { step: '02', title: 'Choose a Plan', desc: 'Select your risk level and investment amount. Our AI handles the rest.' },
              { step: '03', title: 'Earn Daily', desc: 'Returns are credited automatically. Withdraw anytime or reinvest to compound.' },
            ].map((item, i) => (
              <FadeInView key={i} delay={i * 0.15}>
                <div className="flex items-start gap-8 group">
                  <span className="text-5xl font-bold text-white/10 group-hover:text-amber-400/20 transition-colors shrink-0">{item.step}</span>
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

      {/* ─── CTA Section ─── */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInView>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Ready to start<br />
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">earning?</span>
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">Join 25,000+ investors already earning daily returns with our AI-powered platform.</p>
            <button onClick={handleRegister} className="group px-10 py-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/20 transition-all">
              Create Free Account
              <ArrowRight className="inline-block ml-2 size-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </FadeInView>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Diamond className="size-5 text-amber-400 fill-amber-400/20" />
            <span className="font-bold">BNFX</span>
            <span className="text-white/30 text-sm ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Risk Disclaimer</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Scroll-triggered fade-in component ──────────────────────────────────────
function FadeInView({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
