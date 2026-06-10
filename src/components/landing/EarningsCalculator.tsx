'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, Calendar, Wallet, Loader2, Sparkles, Percent } from 'lucide-react'

interface PlanData {
  id: string
  name: string
  minDeposit: number
  maxDeposit: number
  dailyEarningPercent: number
  maxEarningLimit: number
  maxEarningMultiplier: number
  lowRiskMin: number
  lowRiskMax: number
  mediumRiskMin: number
  mediumRiskMax: number
  highRiskMin: number
  highRiskMax: number
  dailyEarningCapPercent?: number
}

const FALLBACK_PLANS: PlanData[] = [
  { id: '1', name: 'Starter', minDeposit: 100, maxDeposit: 1000, dailyEarningPercent: 6, maxEarningLimit: 1000, maxEarningMultiplier: 2.0, lowRiskMin: 0.5, lowRiskMax: 1.5, mediumRiskMin: 1.5, mediumRiskMax: 3.5, highRiskMin: 3.5, highRiskMax: 8.0, dailyEarningCapPercent: 200 },
  { id: '2', name: 'Silver', minDeposit: 500, maxDeposit: 5000, dailyEarningPercent: 8, maxEarningLimit: 2500, maxEarningMultiplier: 2.5, lowRiskMin: 0.5, lowRiskMax: 1.5, mediumRiskMin: 1.5, mediumRiskMax: 3.5, highRiskMin: 3.5, highRiskMax: 8.0, dailyEarningCapPercent: 200 },
  { id: '3', name: 'Gold', minDeposit: 1000, maxDeposit: 10000, dailyEarningPercent: 10, maxEarningLimit: 5000, maxEarningMultiplier: 3.0, lowRiskMin: 0.5, lowRiskMax: 1.5, mediumRiskMin: 1.5, mediumRiskMax: 3.5, highRiskMin: 3.5, highRiskMax: 8.0, dailyEarningCapPercent: 200 },
  { id: '4', name: 'Platinum', minDeposit: 5000, maxDeposit: 50000, dailyEarningPercent: 15, maxEarningLimit: 25000, maxEarningMultiplier: 4.0, lowRiskMin: 0.5, lowRiskMax: 1.5, mediumRiskMin: 1.5, mediumRiskMax: 3.5, highRiskMin: 3.5, highRiskMax: 8.0, dailyEarningCapPercent: 200 },
]

export function EarningsCalculator() {
  const [plans, setPlans] = useState<PlanData[]>(FALLBACK_PLANS)
  const [selectedPlan, setSelectedPlan] = useState(0)
  const [selectedRisk, setSelectedRisk] = useState(1) // Medium
  const [investment, setInvestment] = useState(500)
  const [days, setDays] = useState(30)
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize risk values just in case they're omitted
          const parsed = data.map((p: any) => ({
            ...p,
            lowRiskMin: p.lowRiskMin ?? 0.5,
            lowRiskMax: p.lowRiskMax ?? 1.5,
            mediumRiskMin: p.mediumRiskMin ?? 1.5,
            mediumRiskMax: p.mediumRiskMax ?? 3.5,
            highRiskMin: p.highRiskMin ?? 3.5,
            highRiskMax: p.highRiskMax ?? 8.0,
            maxEarningMultiplier: p.maxEarningMultiplier ?? 2.0,
            dailyEarningCapPercent: p.dailyEarningCapPercent ?? 200,
          }))
          setPlans(parsed)
        }
      })
      .catch(() => {})
  }, [])

  const plan = plans[selectedPlan] || plans[0] || FALLBACK_PLANS[0]

  // Reset/Clamp investment whenever selected plan changes
  useEffect(() => {
    if (plan) {
      setInvestment(prev => {
        if (prev < plan.minDeposit) return plan.minDeposit
        if (prev > plan.maxDeposit) return plan.maxDeposit
        return prev
      })
    }
  }, [selectedPlan, plan])

  const RISK_LEVELS = [
    { id: 'low', label: '🟢 Low Risk', min: plan?.lowRiskMin || 0.5, max: plan?.lowRiskMax || 1.5, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
    { id: 'medium', label: '🟡 Medium Risk', min: plan?.mediumRiskMin || 1.5, max: plan?.mediumRiskMax || 3.5, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    { id: 'high', label: '🔴 High Risk', min: plan?.highRiskMin || 3.5, max: plan?.highRiskMax || 8.0, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
  ]

  const risk = RISK_LEVELS[selectedRisk]

  const dailyCapPercent = plan.dailyEarningCapPercent ?? 200.0
  const dailyCapUSD = investment * (dailyCapPercent / 100)

  const minDailyEarning = Math.min((investment * risk.min) / 100, dailyCapUSD)
  const maxDailyEarning = Math.min((investment * risk.max) / 100, dailyCapUSD)
  const dailyEarning = Math.min((investment * avgDailyPercent) / 100, dailyCapUSD)

  // Plan capping logic: Daily limit X total days
  const maxEarningCap = dailyCapUSD * days

  const totalEarning = dailyEarning * days
  const weeklyEarning = Math.min(dailyEarning * 5, maxEarningCap)
  const monthlyEarning = Math.min(dailyEarning * 22, maxEarningCap)
  const roi = ((totalEarning / investment) * 100).toFixed(1)
  const isCapped = dailyEarning >= dailyCapUSD

  return (
    <section id="calculator" className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm px-3 py-1 mb-4">
              <Calculator className="size-3 mr-1.5 text-primary" />
              Dynamic Returns Engine
            </Badge>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Calculate Your Return Vector
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/50 max-w-lg mx-auto text-sm"
          >
            Adjust variables to simulate automated yield parameters based on verified plan bounds.
          </motion.p>
        </div>

        {/* Main Interface Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Plan Picker */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-white/60 tracking-wider uppercase font-mono">1. Select Target Plan</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {plans.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(i)}
                    onMouseEnter={() => setHoveredPlan(i)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    className={`relative p-3 rounded-2xl border text-center transition-all duration-300 overflow-hidden ${
                      selectedPlan === i
                        ? 'bg-primary/10 border-primary/50 text-primary'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/20'
                    }`}
                  >
                    {/* Glowing effect inside selected tab */}
                    {selectedPlan === i && (
                      <motion.div 
                        layoutId="activePlanTab"
                        className="absolute inset-0 bg-primary/[0.02] border border-primary/30 rounded-2xl pointer-events-none"
                      />
                    )}
                    <span className="block text-sm font-bold tracking-tight">{p.name}</span>
                    <span className="block text-[10px] opacity-60 mt-0.5">Min: ${p.minDeposit}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-white/60 tracking-wider uppercase font-mono">2. Select Risk Matrix</Label>
              <div className="grid grid-cols-3 gap-2">
                {RISK_LEVELS.map((level, i) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedRisk(i)}
                    className={`p-3 rounded-2xl border text-center transition-all duration-300 ${
                      selectedRisk === i 
                        ? level.bg + ' border-current shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-bold font-mono uppercase tracking-wider">{level.label}</span>
                    <span className="block text-[10px] opacity-60 mt-0.5" dir="ltr">{level.min}% - {level.max}% daily</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders Container */}
            <Card className="bg-[#0c0c0e]/60 border-white/[0.06] backdrop-blur-md p-6 rounded-3xl space-y-6">
              
              {/* Slider 1: Investment */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-semibold text-white/60 tracking-wider uppercase font-mono">3. Investment Amount</Label>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-primary">${investment.toLocaleString()}</span>
                    <span className="text-xs text-white/40 font-mono ml-1">USDC</span>
                  </div>
                </div>
                <Slider
                  value={[investment]}
                  onValueChange={([v]) => setInvestment(v)}
                  min={plan.minDeposit}
                  max={plan.maxDeposit}
                  step={Math.max(50, Math.round((plan.maxDeposit - plan.minDeposit) / 100))}
                  className="py-2"
                />
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>MIN: ${plan.minDeposit}</span>
                  <span>MAX: ${plan.maxDeposit.toLocaleString()}</span>
                </div>
              </div>

              {/* Slider 2: Duration */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-semibold text-white/60 tracking-wider uppercase font-mono">4. Duration Timeline</Label>
                  <span className="text-xl font-bold font-mono text-primary">{days} Trading Days</span>
                </div>
                <Slider
                  value={[days]}
                  onValueChange={([v]) => setDays(v)}
                  min={1}
                  max={400}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>1 DAY</span>
                  <span>400 DAYS</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 h-full">
            <Card className="relative overflow-hidden bg-gradient-to-b from-[#111115] to-[#08080a] border-white/[0.06] rounded-3xl shadow-xl flex flex-col h-full">
              
              {/* Glossy overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.01] to-white/[0.03] pointer-events-none" />

              <CardHeader className="pb-2 border-b border-white/[0.04] bg-white/[0.01]">
                <CardTitle className="text-xs font-bold font-mono tracking-wider text-white/50 uppercase flex items-center gap-1.5">
                  <Sparkles className="size-3 text-amber-400 animate-pulse" />
                  YIELD ANALYSIS PROJECTOR
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Projected Return Display */}
                <div className="text-center py-6 border-b border-white/[0.04]">
                  <p className="text-[10px] font-mono text-white/40 tracking-wider uppercase mb-1">PROJECTED RETURN VECTOR</p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${investment}-${selectedPlan}-${selectedRisk}-${days}`}
                      initial={{ scale: 0.95, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-4xl sm:text-5xl font-extrabold font-mono bg-gradient-to-r from-white via-amber-200 to-orange-400 bg-clip-text text-transparent"
                      dir="ltr"
                    >
                      ${totalEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* ROI badge */}
                  <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-white/70">
                    <Percent className="size-3 text-amber-400" />
                    <span>ROI: {roi}%</span>
                  </div>
                </div>

                {/* Return Breakdowns */}
                <div className="space-y-3.5 my-4">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/[0.02]">
                    <span className="text-xs text-white/50 font-mono flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-emerald-400" />
                      Daily Range
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-400" dir="ltr">
                      ${minDailyEarning.toFixed(2)} - ${maxDailyEarning.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/[0.02]">
                    <span className="text-xs text-white/50 font-mono flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-cyan-400" />
                      Weekly Rate (5d)
                    </span>
                    <span className="text-sm font-bold font-mono text-cyan-400" dir="ltr">
                      ${weeklyEarning.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/[0.02]">
                    <span className="text-xs text-white/50 font-mono flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-amber-400" />
                      Monthly Rate (22d)
                    </span>
                    <span className="text-sm font-bold font-mono text-amber-400" dir="ltr">
                      ${monthlyEarning.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Dynamic Capping Alerts */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  {isCapped ? (
                    <p className="text-[10px] leading-relaxed text-amber-400/90 font-mono">
                      ⚠️ **Daily Earning Cap Reached**: Yield is limited by the {plan.name} plan&apos;s daily limit of ${dailyCapUSD.toLocaleString()} (based on {dailyCapPercent}% daily investment capping limit).
                    </p>
                  ) : (
                    <p className="text-[10px] leading-relaxed text-white/40 font-mono">
                      * Yield varies ({risk.min}%-{risk.max}% daily) under {risk.id} risk mode. Daily earning cap is {dailyCapPercent}% of investment (${dailyCapUSD.toLocaleString()}/day). Max limit is ${maxEarningCap.toLocaleString()} for {days} days.
                    </p>
                  )}
                </div>
                
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  )
}
