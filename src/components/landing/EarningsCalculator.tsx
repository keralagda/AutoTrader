'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, Calendar, Wallet, Loader2 } from 'lucide-react'

interface PlanData {
  id: string
  name: string
  dailyEarningPercent: number
  maxEarningLimit: number
  minDeposit: number
  maxDeposit: number
  lowRiskMin: number
  lowRiskMax: number
  mediumRiskMin: number
  mediumRiskMax: number
  highRiskMin: number
  highRiskMax: number
}

const FALLBACK_PLANS = [
  { id: '1', name: 'Starter', dailyEarningPercent: 6, maxEarningLimit: 1000, minDeposit: 100, maxDeposit: 1000, lowRiskMin: 0.3, lowRiskMax: 1.2, mediumRiskMin: 1.0, mediumRiskMax: 3.0, highRiskMin: 2.5, highRiskMax: 8.0 },
  { id: '2', name: 'Silver', dailyEarningPercent: 8, maxEarningLimit: 2500, minDeposit: 500, maxDeposit: 5000, lowRiskMin: 0.3, lowRiskMax: 1.2, mediumRiskMin: 1.0, mediumRiskMax: 3.0, highRiskMin: 2.5, highRiskMax: 8.0 },
  { id: '3', name: 'Gold', dailyEarningPercent: 10, maxEarningLimit: 5000, minDeposit: 1000, maxDeposit: 10000, lowRiskMin: 0.3, lowRiskMax: 1.2, mediumRiskMin: 1.0, mediumRiskMax: 3.0, highRiskMin: 2.5, highRiskMax: 8.0 },
  { id: '4', name: 'Platinum', dailyEarningPercent: 15, maxEarningLimit: 25000, minDeposit: 5000, maxDeposit: 50000, lowRiskMin: 0.3, lowRiskMax: 1.2, mediumRiskMin: 1.0, mediumRiskMax: 3.0, highRiskMin: 2.5, highRiskMax: 8.0 },
]

export function EarningsCalculator() {
  const [plans, setPlans] = useState<PlanData[]>(FALLBACK_PLANS)
  const [selectedPlan, setSelectedPlan] = useState(0)
  const [selectedRisk, setSelectedRisk] = useState(1) // Medium
  const [investment, setInvestment] = useState(500)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data)
        }
      })
      .catch(() => {})
  }, [])

  const plan = plans[selectedPlan] || plans[0] || FALLBACK_PLANS[0]

  // Build risk levels from the selected plan's actual config
  const RISK_LEVELS = [
    { id: 'low', label: '🟢 Low', min: plan?.lowRiskMin || 0.3, max: plan?.lowRiskMax || 1.2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { id: 'medium', label: '🟡 Medium', min: plan?.mediumRiskMin || 1.0, max: plan?.mediumRiskMax || 3.0, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { id: 'high', label: '🔴 High', min: plan?.highRiskMin || 2.5, max: plan?.highRiskMax || 8.0, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  ]

  const risk = RISK_LEVELS[selectedRisk]

  const avgDailyPercent = (risk.min + risk.max) / 2
  const minDailyEarning = (investment * risk.min) / 100
  const maxDailyEarning = (investment * risk.max) / 100
  const dailyEarning = (investment * avgDailyPercent) / 100
  const totalEarning = Math.min(dailyEarning * days, plan?.maxEarningLimit || 10000)
  const weeklyEarning = Math.min(dailyEarning * 5, plan?.maxEarningLimit || 10000)
  const monthlyEarning = Math.min(dailyEarning * 22, plan?.maxEarningLimit || 10000)
  const roi = ((totalEarning / investment) * 100).toFixed(1)

  return (
    <section id="calculator" className="py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
            <Calculator className="size-3 mr-1" />
            Earnings Calculator
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Calculate Your Potential Earnings
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how much you could earn with our AI-powered trading platform
          </p>
        </div>

        <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Plan Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Plan</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(plans || []).map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(i)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedPlan === i
                        ? 'bg-primary/15 border-primary/50 shadow-sm'
                        : 'bg-muted/30 border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <p className={`text-sm font-bold ${selectedPlan === i ? 'text-primary' : 'text-muted-foreground'}`}>{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.lowRiskMin || 0.3}% - {p.highRiskMax || 8.0}% daily</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Level Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Risk Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {RISK_LEVELS.map((level, i) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedRisk(i)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedRisk === i ? level.bg + ' border-current' : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <p className={`text-sm font-bold ${selectedRisk === i ? level.color : 'text-muted-foreground'}`}>{level.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5" dir="ltr">{level.min}% - {level.max}% daily</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Amount */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Investment Amount</Label>
                <span className="text-sm font-bold text-primary">${investment.toLocaleString()}</span>
              </div>
              <Slider
                value={[investment]}
                onValueChange={([v]) => setInvestment(v)}
                min={100}
                max={25000}
                step={100}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$100</span>
                <span>$25,000</span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Duration (Trading Days)</Label>
                <span className="text-sm font-bold text-primary">{days} days</span>
              </div>
              <Slider
                value={[days]}
                onValueChange={([v]) => setDays(v)}
                min={1}
                max={90}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 day</span>
                <span>90 days</span>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border/50">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                <TrendingUp className="size-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Daily Earning</p>
                <p className="text-lg font-bold text-emerald-400" dir="ltr">${minDailyEarning.toFixed(2)} - ${maxDailyEarning.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
                <Calendar className="size-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Weekly (5 days)</p>
                <p className="text-lg font-bold text-cyan-400" dir="ltr">${weeklyEarning.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                <Wallet className="size-5 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Monthly (~22 days)</p>
                <p className="text-lg font-bold text-amber-400" dir="ltr">${monthlyEarning.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-4 text-center">
                <Calculator className="size-5 text-violet-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Total ({days} days)</p>
                <p className="text-lg font-bold text-violet-400" dir="ltr">${totalEarning.toFixed(2)}</p>
              </div>
            </div>

            {/* ROI Badge */}
            <div className="text-center pt-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1" dir="ltr">
                Estimated ROI: {roi}% in {days} trading days ({risk.label.replace(/[🟢🟡🔴]\s*/, '')} risk)
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-2" dir="ltr">
                * Returns vary between {risk.min}%-{risk.max}% daily based on {risk.id} risk level. Daily Earning Cap is {Math.round((plan?.maxEarningLimit || 10000) / (plan?.minDeposit || 100))}X for {plan?.name || 'Selected'} plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
