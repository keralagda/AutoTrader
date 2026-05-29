'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, ChevronDown, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { REFERRAL_LEVELS } from '@/lib/types'

export default function ReferralSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const { setShowAuthModal, setAuthMode } = useAppStore()

  const handleRegister = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  const totalPercent = REFERRAL_LEVELS.reduce((sum, l) => sum + l.percent, 0)

  return (
    <section id="referral" className="py-16 md:py-24 relative" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            7-Level Referral &{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Trade Profit Share
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Earn from your entire referral network across 7 levels. The more you grow your team, the
            more you earn.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Pyramid Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-center mb-6">Referral Levels</h3>
                <div className="flex flex-col items-center gap-2">
                  {REFERRAL_LEVELS.map((level, index) => {
                    const width = 100 - index * 8
                    const maxPercent = Math.max(...REFERRAL_LEVELS.map((l) => l.percent))
                    const barWidth = (level.percent / maxPercent) * 100
                    const opacity = 1 - index * 0.08

                    return (
                      <motion.div
                        key={level.level}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="w-full flex flex-col items-center"
                        style={{ maxWidth: `${width}%` }}
                      >
                        <div className="w-full flex items-center gap-3 mb-1">
                          <span className="text-xs text-muted-foreground w-16 shrink-0">
                            Level {level.level}
                          </span>
                          <div className="flex-1 h-8 bg-background/50 rounded-md overflow-hidden border border-border relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={isInView ? { width: `${barWidth}%` } : {}}
                              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                              className="h-full rounded-md flex items-center justify-end pr-2"
                              style={{
                                background: `linear-gradient(90deg, oklch(0.72 0.19 160 / ${opacity}), oklch(0.72 0.19 160 / ${opacity * 0.6}))`,
                              }}
                            >
                              <span className="text-xs font-bold text-white drop-shadow-sm" dir="ltr">
                                {level.percent}%
                              </span>
                            </motion.div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Users className="size-3 text-emerald-400" />
                          </div>
                        </div>
                        {index < REFERRAL_LEVELS.length - 1 && (
                          <ChevronDown className="size-3 text-muted-foreground/50 my-0.5" />
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-border text-center">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-1">
                    Total: <span dir="ltr">{totalPercent}%</span> from Subscription Fee
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Details & Example */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Level Breakdown */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Level Breakdown</h3>
                <div className="space-y-3">
                  {REFERRAL_LEVELS.map((level, index) => (
                    <motion.div
                      key={level.level}
                      initial={{ opacity: 0, x: 20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                          L{level.level}
                        </div>
                        <span className="text-sm font-medium">Level {level.level}</span>
                      </div>
                      <span className="text-emerald-400 font-bold" dir="ltr">{level.percent}%</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Example Calculation */}
            <Card className="bg-card/80 backdrop-blur-sm border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="size-5 text-amber-400" />
                  <h3 className="text-lg font-bold">Earnings Example</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    If your Level 1 referral invests <span className="text-foreground font-semibold">$1,000</span> with a
                    $100 subscription fee:
                  </p>
                  <div className="bg-background/50 rounded-lg p-4 border border-border space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">80% goes to referral pool</span>
                      <span className="font-semibold text-amber-400" dir="ltr">$80</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Level 1 share (25%)</span>
                      <span className="font-bold text-emerald-400" dir="ltr">$20</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <p className="text-muted-foreground">
                        With <span className="text-foreground font-semibold">Ten Level 1</span> referrals, you earn{' '}
                        <span className="text-emerald-400 font-bold">$200</span> per cycle!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button
              size="lg"
              onClick={handleRegister}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 text-lg animate-pulse-glow"
            >
              <Users className="mr-2 size-5" />
              Start Building Your Network
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
