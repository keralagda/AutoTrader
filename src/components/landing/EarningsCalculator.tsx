'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, Calendar, Wallet } from 'lucide-react'

const PLANS = [
  { name: 'Starter', dailyPercent: 6, maxEarning: 1000, color: 'text-gray-300' },
  { name: 'Silver', dailyPercent: 8, maxEarning: 2500, color: 'text-slate-300' },
  { name: 'Gold', dailyPercent: 10, maxEarning: 5000, color: 'text-amber-400' },
  { name: 'Platinum', dailyPercent: 15, maxEarning: 25000, color: 'text-violet-400' },
]

export function EarningsCalculator() {
  const [investment, setInvestment] = useState(500)
  const [selectedPlan, setSelectedPlan] = useState(2) // Gold
  const [days, setDays] = useState(30)

  const plan = PLANS[selectedPlan]
  const dailyEarning = (investment * plan.dailyPercent) / 100
  const totalEarning = Math.min(dailyEarning * days, plan.maxEarning)
  const weeklyEarning = Math.min(dailyEarning * 5, plan.maxEarning) // 5 trading days
  const monthlyEarning = Math.min(dailyEarning * 22, plan.maxEarning) // ~22 trading days
  const roi = ((totalEarning / investment) * 100).toFixed(1)

  return (
    <section className="py-16 md:py-24 px-4">
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
                {PLANS.map((p, i) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPlan(i)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedPlan === i
                        ? 'bg-primary/15 border-primary/50 shadow-sm'
                        : 'bg-muted/30 border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <p className={`text-sm font-bold ${p.color}`}>{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.dailyPercent}% daily</p>
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
                <p className="text-lg font-bold text-emerald-400">${dailyEarning.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
                <Calendar className="size-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Weekly (5 days)</p>
                <p className="text-lg font-bold text-cyan-400">${weeklyEarning.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                <Wallet className="size-5 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Monthly (~22 days)</p>
                <p className="text-lg font-bold text-amber-400">${monthlyEarning.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-4 text-center">
                <Calculator className="size-5 text-violet-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Total ({days} days)</p>
                <p className="text-lg font-bold text-violet-400">${totalEarning.toFixed(2)}</p>
              </div>
            </div>

            {/* ROI Badge */}
            <div className="text-center pt-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1">
                Estimated ROI: {roi}% in {days} trading days
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-2">
                * Earnings are capped at ${plan.maxEarning.toLocaleString()} for the {plan.name} plan. Trading days are Mon-Fri.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
