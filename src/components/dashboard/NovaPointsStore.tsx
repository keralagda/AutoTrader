'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Sparkles,
  Coins,
  Gift,
  Zap,
  ShieldCheck,
  Rocket,
  Dices,
  Award,
  Timer,
  ArrowRight,
  Loader2,
  CheckCircle2,
  History,
  Star,
  Crown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StoreItem {
  id: string
  name: string
  cost: number
  description: string
  type: string
}

interface RedemptionHistory {
  itemId: string
  itemName: string
  cost: number
  reward: string
  date: string
}

interface StoreData {
  novaPoints: number
  level: number
  storeItems: StoreItem[]
  history: RedemptionHistory[]
  conversionRate: string
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  conversion: Coins,
  perk: ShieldCheck,
  boost: Rocket,
  spin: Dices,
  cosmetic: Award,
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  conversion: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-500/5' },
  perk: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500/20 to-cyan-500/5' },
  boost: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', gradient: 'from-violet-500/20 to-violet-500/5' },
  spin: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-500/5' },
  cosmetic: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', gradient: 'from-rose-500/20 to-rose-500/5' },
}

export function NovaPointsStore() {
  const { user, updateUserWallets } = useAppStore()
  const { toast } = useToast()
  const [data, setData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [spinResult, setSpinResult] = useState<string | null>(null)
  const [showSpinModal, setShowSpinModal] = useState(false)

  const fetchStore = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/nova-points/redeem?userId=${user.id}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  const handleRedeem = async (itemId: string) => {
    if (!user?.id || redeeming) return
    setRedeeming(itemId)
    try {
      const res = await fetch('/api/nova-points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, itemId, quantity: 1 }),
      })
      const result = await res.json()
      if (res.ok) {
        if (itemId === 'lucky_spin') {
          setSpinResult(result.message)
          setShowSpinModal(true)
        } else {
          toast({ title: '✨ Redeemed!', description: result.message })
        }
        // Refresh store data
        fetchStore()
        // Refresh user balance
        const meRes = await fetch(`/api/auth/me?userId=${user.id}`)
        if (meRes.ok) {
          const meData = await meRes.json()
          updateUserWallets(meData.tradingBalance, meData.withdrawalBalance)
        }
      } else {
        toast({ title: 'Redemption Failed', description: result.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setRedeeming(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load Nova Points store.
      </div>
    )
  }

  const novaPoints = data.novaPoints
  const level = data.level

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header Card - Nova Points Balance */}
      <Card className="border-primary/30 bg-gradient-to-br from-amber-500/10 via-violet-500/5 to-card overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* NP Balance */}
            <motion.div
              className="relative"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <div className="size-24 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex flex-col items-center justify-center shadow-lg shadow-amber-500/30">
                <Sparkles className="size-6 text-white/80 mb-0.5" />
                <span className="text-2xl font-black text-white">{novaPoints.toLocaleString()}</span>
                <span className="text-[10px] text-white/70 font-medium">NP</span>
              </div>
              <div className="absolute -top-1 -right-1 size-7 rounded-full bg-violet-500 flex items-center justify-center border-2 border-background">
                <Star className="size-3.5 text-white" fill="currentColor" />
              </div>
            </motion.div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <span>Nova Points</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Level {level}
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Earn NP from daily check-ins, challenges, and trading. Redeem for real rewards below.
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-center sm:justify-start">
                <Coins className="size-3" />
                Conversion rate: {data.conversionRate}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center min-w-[80px]">
                <p className="text-lg font-bold text-amber-400">{novaPoints.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Available</p>
              </div>
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-center min-w-[80px]">
                <p className="text-lg font-bold text-violet-400">{data.history.length}</p>
                <p className="text-[10px] text-muted-foreground">Redeemed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Tabs */}
      <Tabs defaultValue="store" className="space-y-4">
        <TabsList>
          <TabsTrigger value="store" className="gap-1.5">
            <Gift className="size-4" />
            Rewards Store
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="size-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Store Items */}
        <TabsContent value="store" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.storeItems.map((item) => {
              const colors = TYPE_COLORS[item.type] || TYPE_COLORS.perk
              const Icon = TYPE_ICONS[item.type] || Gift
              const canAfford = novaPoints >= item.cost
              const isRedeeming = redeeming === item.id

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border ${colors.border} bg-gradient-to-br ${colors.gradient} to-card hover:shadow-lg transition-all duration-300 ${!canAfford ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className={`size-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`size-5 ${colors.text}`} />
                        </div>
                        <Badge className={`${colors.bg} ${colors.text} ${colors.border} border text-[10px]`}>
                          {item.type}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-sm font-semibold">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      </div>

                      {/* Cost & Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-amber-400" />
                          <span className="text-sm font-bold text-amber-400">{item.cost.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground">NP</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRedeem(item.id)}
                          disabled={!canAfford || !!isRedeeming}
                          className={`gap-1.5 h-8 ${canAfford ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white' : ''}`}
                        >
                          {isRedeeming ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="size-3.5" />
                          )}
                          {isRedeeming ? 'Redeeming...' : 'Redeem'}
                        </Button>
                      </div>

                      {/* Affordability indicator */}
                      {!canAfford && (
                        <p className="text-[10px] text-rose-400">
                          Need {(item.cost - novaPoints).toLocaleString()} more NP
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-3">
          {data.history.length === 0 ? (
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-8 text-center">
                <History className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No redemptions yet. Start spending your Nova Points!</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/30 bg-card/50">
              <CardContent className="p-4 space-y-2">
                {data.history.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <CheckCircle2 className="size-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.itemName}</p>
                        <p className="text-xs text-muted-foreground">{entry.reward}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-400">-{entry.cost.toLocaleString()} NP</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Lucky Spin Result Modal */}
      <Dialog open={showSpinModal} onOpenChange={setShowSpinModal}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              <Dices className="size-6 text-amber-400" />
              Lucky Spin Result
            </DialogTitle>
            <DialogDescription>Your spin result</DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="py-8"
          >
            <div className="size-32 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-4">
              <span className="text-4xl">🎰</span>
            </div>
            <p className="text-lg font-bold text-amber-400">{spinResult}</p>
          </motion.div>
          <Button onClick={() => setShowSpinModal(false)} className="w-full">
            Awesome!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
