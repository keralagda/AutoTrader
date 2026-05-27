'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, TrendingUp } from 'lucide-react'

export function ReferralCalculator() {
  const [referrals, setReferrals] = useState(10)
  const [avgInvestment, setAvgInvestment] = useState(500)

  const COMMISSION_RATE = 0.05 // 5% on deposits
  const PROFIT_SHARE_RATE = 0.25 // 25% of L1 profit share
  const AVG_DAILY_RETURN = 0.05 // 5% avg daily

  const depositCommission = referrals * avgInvestment * COMMISSION_RATE
  const dailyProfitShare = referrals * avgInvestment * AVG_DAILY_RETURN * PROFIT_SHARE_RATE
  const monthlyEarning = depositCommission + (dailyProfitShare * 22) // 22 trading days

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-3">Referral Calculator</Badge>
          <h2 className="text-3xl font-bold">Calculate Your Referral Income</h2>
          <p className="text-muted-foreground mt-2">See how much you could earn by building your team</p>
        </div>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 space-y-8">
            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Number of Referrals</label>
                  <span className="text-sm font-bold text-primary">{referrals} people</span>
                </div>
                <Slider value={[referrals]} onValueChange={([v]) => setReferrals(v)} min={1} max={100} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span><span>100</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Avg Investment per Referral</label>
                  <span className="text-sm font-bold text-primary">${avgInvestment}</span>
                </div>
                <Slider value={[avgInvestment]} onValueChange={([v]) => setAvgInvestment(v)} min={100} max={10000} step={100} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$100</span><span>$10,000</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/30">
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <DollarSign className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">${depositCommission.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Deposit Commission (5%)</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <TrendingUp className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-cyan-400">${(dailyProfitShare * 22).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Monthly Profit Share</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Users className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-400">${monthlyEarning.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Monthly Income</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              * Estimates based on 5% deposit commission + 25% L1 profit share at ~5% avg daily return. Actual results may vary.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
