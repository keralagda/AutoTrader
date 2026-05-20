'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Wallet, TrendingUp, Gift, Building2, Users, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLATFORM_DISTRIBUTION, SUBSCRIPTION_DISTRIBUTION } from '@/lib/types'

// Animated percentage
function AnimatedPercent({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const display = isInView ? value : 0

  return (
    <span ref={ref} className="tabular-nums font-bold text-2xl">
      {display}%
    </span>
  )
}

const platformData = [
  { name: 'Account Holder', value: PLATFORM_DISTRIBUTION.accountHolder, icon: Wallet, color: '#10b981' },
  { name: 'Trade Profit Share', value: PLATFORM_DISTRIBUTION.tradeProfitShare, icon: TrendingUp, color: '#06b6d4' },
  { name: 'Rewards & Offers', value: PLATFORM_DISTRIBUTION.rewardsOffers, icon: Gift, color: '#f59e0b' },
  { name: 'Platform Fee', value: PLATFORM_DISTRIBUTION.platformFee, icon: Building2, color: '#6366f1' },
]

const subscriptionData = [
  { name: 'Referral & Profit', value: SUBSCRIPTION_DISTRIBUTION.referralAndProfit, icon: Users, color: '#10b981' },
  { name: 'Rewards & Offers', value: SUBSCRIPTION_DISTRIBUTION.rewardsOffers, icon: Award, color: '#f59e0b' },
  { name: 'Platform Fee', value: SUBSCRIPTION_DISTRIBUTION.platformFee, icon: Building2, color: '#6366f1' },
]

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

const RADIAN = Math.PI / 180

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomLabelProps) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function DistributionChart({
  data,
  title,
  subtitle,
}: {
  data: { name: string; value: number; icon: React.ElementType; color: string }[]
  title: string
  subtitle: string
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border" ref={sectionRef}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="h-[280px] mb-6"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={110}
                innerRadius={60}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.17 0.02 260)',
                  border: '1px solid oklch(1 0 0 / 10%)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribution Items */}
        <div className="space-y-3">
          {data.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon className="size-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AnimatedPercent value={item.value} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DistributionSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-16 md:py-24 relative" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Revenue{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Distribution
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transparent and fair distribution of all platform revenues. Every cent is accounted for.
          </p>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DistributionChart
            data={platformData}
            title="Platform Distribution"
            subtitle="How trading profits are shared"
          />
          <DistributionChart
            data={subscriptionData}
            title="Subscription Fee Distribution"
            subtitle="How subscription fees are allocated"
          />
        </div>
      </div>
    </section>
  )
}
