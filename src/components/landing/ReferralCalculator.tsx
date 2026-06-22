'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Users, DollarSign, TrendingUp, Sparkles, Layers } from 'lucide-react'

interface PlanData {
  id: string
  name: string
  dailyEarningPercent: number
  referralRules?: {
    level: number
    commission: number
    amount: number
    type: string
  }[]
}

const FALLBACK_PLANS: PlanData[] = [
  { id: '1', name: 'Starter', dailyEarningPercent: 6, referralRules: [{ level: 1, commission: 5, amount: 0, type: 'deposit' }, { level: 1, commission: 25, amount: 0, type: 'profit' }] },
  { id: '2', name: 'Silver', dailyEarningPercent: 8, referralRules: [{ level: 1, commission: 8, amount: 0, type: 'deposit' }, { level: 1, commission: 25, amount: 0, type: 'profit' }] },
  { id: '3', name: 'Gold', dailyEarningPercent: 10, referralRules: [{ level: 1, commission: 10, amount: 0, type: 'deposit' }, { level: 1, commission: 25, amount: 0, type: 'profit' }] },
  { id: '4', name: 'Platinum', dailyEarningPercent: 15, referralRules: [{ level: 1, commission: 12, amount: 0, type: 'deposit' }, { level: 1, commission: 25, amount: 0, type: 'profit' }] },
]

export function ReferralCalculator() {
  const [plans, setPlans] = useState<PlanData[]>(FALLBACK_PLANS)
  const [selectedPlan, setSelectedPlan] = useState(0)
  const [referrals, setReferrals] = useState(10)
  const [avgInvestment, setAvgInvestment] = useState(500)

  useEffect(() => {
    fetch(`/api/plans?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data)
        }
      })
      .catch(() => {})
  }, [])

  const plan = plans[selectedPlan] || plans[0] || FALLBACK_PLANS[0]

  // Retrieve Level 1 deposit commission from plan rules, fallback to 5%
  const depositCommissionRule = plan.referralRules?.find(r => r.level === 1 && r.type === 'deposit')
  const commissionRate = depositCommissionRule 
    ? depositCommissionRule.commission / 100 
    : 0.05

  // Retrieve Level 1 profit share commission from plan rules, fallback to 25%
  const profitShareRule = plan.referralRules?.find(r => r.level === 1 && r.type === 'profit')
  const profitShareRate = profitShareRule 
    ? profitShareRule.commission / 100 
    : 0.25

  // Avg daily return from selected plan parameter (e.g. 5%), divided by 100 for percentage math
  const avgDailyReturn = (plan.dailyEarningPercent || 5) / 100

  // Calculations
  const depositCommission = referrals * avgInvestment * commissionRate
  const dailyProfitShare = referrals * avgInvestment * avgDailyReturn * profitShareRate
  const monthlyEarning = depositCommission + (dailyProfitShare * 22) // 22 trading days

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 backdrop-blur-sm px-3 py-1 mb-4">
              <Users className="size-3 mr-1.5 text-violet-400" />
              Affiliate Partnership Matrix
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Calculate Your Referral Income
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/50 max-w-lg mx-auto text-sm"
          >
            Estimate commissions generated from direct referral deposits and profit-share pipelines.
          </motion.p>
        </div>

        <Card className="bg-[#0c0c0e]/60 border-white/[0.06] backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
          <CardContent className="p-6 md:p-8 space-y-8">
            
            {/* Plan Selector */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-white/60 tracking-wider uppercase font-mono">1. Select Referral Target Plan</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {plans.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(i)}
                    className={`relative p-3 rounded-2xl border text-center transition-all duration-300 ${
                      selectedPlan === i
                        ? 'bg-violet-500/10 border-violet-500/50 text-violet-400'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/20'
                    }`}
                  >
                    {selectedPlan === i && (
                      <motion.div
                        layoutId="activeRefPlanTab"
                        className="absolute inset-0 bg-violet-500/[0.02] border border-violet-500/30 rounded-2xl pointer-events-none"
                      />
                    )}
                    <span className="block text-sm font-bold tracking-tight">{p.name}</span>
                    <span className="block text-[10px] opacity-60 mt-0.5" dir="ltr">{(commissionRate * 100).toFixed(0)}% Deposit / {(profitShareRate * 100).toFixed(0)}% P&L</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-semibold text-white/60 tracking-wider uppercase font-mono">Active Referrals</Label>
                  <span className="text-lg font-bold font-mono text-violet-400">{referrals} members</span>
                </div>
                <Slider value={[referrals]} onValueChange={([v]) => setReferrals(v)} min={1} max={100} step={1} />
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>1 MEMBER</span><span>100 MEMBERS</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs font-semibold text-white/60 tracking-wider uppercase font-mono">Avg Investment per Referral</Label>
                  <span className="text-lg font-bold font-mono text-violet-400">${avgInvestment.toLocaleString()}</span>
                </div>
                <Slider value={[avgInvestment]} onValueChange={([v]) => setAvgInvestment(v)} min={100} max={10000} step={100} />
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>$100</span><span>$10,000</span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/[0.04]">
              <div className="text-center p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors duration-300">
                <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={depositCommission}
                    initial={{ scale: 0.95, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold font-mono text-emerald-400"
                    dir="ltr"
                  >
                    ${depositCommission.toFixed(0)}
                  </motion.p>
                </AnimatePresence>
                <p className="text-[10px] text-white/50 tracking-wider uppercase font-mono mt-1">Deposit Commission ({(commissionRate * 100).toFixed(0)}%)</p>
              </div>

              <div className="text-center p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/10 transition-colors duration-300">
                <TrendingUp className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={dailyProfitShare}
                    initial={{ scale: 0.95, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold font-mono text-cyan-400"
                    dir="ltr"
                  >
                    ${(dailyProfitShare * 22).toFixed(0)}
                  </motion.p>
                </AnimatePresence>
                <p className="text-[10px] text-white/50 tracking-wider uppercase font-mono mt-1">Monthly profit Share ({(profitShareRate * 100).toFixed(0)}%)</p>
              </div>

              <div className="text-center p-5 rounded-2xl bg-violet-500/5 border border-violet-500/10 hover:bg-violet-500/10 transition-colors duration-300">
                <Sparkles className="h-5 w-5 text-violet-400 mx-auto mb-2" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={monthlyEarning}
                    initial={{ scale: 0.95, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold font-mono text-violet-400"
                    dir="ltr"
                  >
                    ${monthlyEarning.toFixed(0)}
                  </motion.p>
                </AnimatePresence>
                <p className="text-[10px] text-white/50 tracking-wider uppercase font-mono mt-1">Total Monthly Income</p>
              </div>
            </div>

            <p className="text-[9px] text-white/30 text-center font-mono" dir="ltr">
              * Calculations use Level 1 rates for {plan.name} plan: {(commissionRate * 100).toFixed(1)}% deposit commission + {(profitShareRate * 100).toFixed(1)}% profit share commission based on ~{(avgDailyReturn * 100).toFixed(1)}% average daily yield. Returns vary by plan.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
