'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, DollarSign, TrendingUp, Globe } from 'lucide-react'

interface StatItem {
  icon: React.ElementType
  label: string
  value: number
  prefix: string
  suffix: string
  color: string
}

const stats: StatItem[] = [
  {
    icon: Users,
    label: 'Total Platform Users',
    value: 12847,
    prefix: '',
    suffix: '+',
    color: 'text-emerald-400',
  },
  {
    icon: DollarSign,
    label: 'Total USDC Distributed',
    value: 5280000,
    prefix: '$',
    suffix: '+',
    color: 'text-amber-400',
  },
  {
    icon: TrendingUp,
    label: 'Active Investments',
    value: 8456,
    prefix: '',
    suffix: '',
    color: 'text-cyan-400',
  },
  {
    icon: Globe,
    label: 'Countries Supported',
    value: 142,
    prefix: '',
    suffix: '+',
    color: 'text-emerald-300',
  },
]

function useAnimatedCounter(end: number, isInView: boolean, duration: number = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, isInView, duration])

  return count
}

function StatCard({ stat, index, isInView }: { stat: StatItem; index: number; isInView: boolean }) {
  const count = useAnimatedCounter(stat.value, isInView, 2500)
  const Icon = stat.icon

  const formatValue = (num: number) => {
    if (num >= 1000000) {
      return `${stat.prefix}${(num / 1000000).toFixed(1)}M${stat.suffix}`
    }
    if (num >= 1000) {
      return `${stat.prefix}${(num / 1000).toFixed(1)}K${stat.suffix}`
    }
    return `${stat.prefix}${num.toLocaleString()}${stat.suffix}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative group"
    >
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-8 text-center transition-all duration-300 hover:border-emerald-500/30 hover:glow-emerald">
        <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/20 transition-colors">
          <Icon className={`size-7 ${stat.color}`} />
        </div>
        <div className={`text-4xl font-bold ${stat.color} mb-2 tabular-nums`}>
          {formatValue(count)}
        </div>
        <div className="text-sm text-muted-foreground">{stat.label}</div>
      </div>
    </motion.div>
  )
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section className="py-16 md:py-24 relative" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Platform{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Statistics
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time numbers that showcase the growth and trust in our platform.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  )
}
