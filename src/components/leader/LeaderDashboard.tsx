'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { UserSidebar } from '../dashboard/UserSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Network, TrendingUp, Users, ArrowRightLeft, Sparkles,
  Trophy, Bell, Lightbulb, RefreshCw, Send, HelpCircle,
} from 'lucide-react'

export function LeaderDashboard() {
  const { user, dashboardTheme, setDashboardTheme } = useAppStore()
  const { toast } = useToast()
  
  // Stats
  const [stats, setStats] = useState({
    totalDownline: 1240,
    activeDownline: 782,
    leftVolume: 1500,
    rightVolume: 800,
    pairingEarned: 420,
  })

  // Projections Simulator State
  const [simVolume, setSimVolume] = useState(10000)
  const [simRate, setSimRate] = useState(10) // 10%
  const projectPayout = (simVolume * (simRate / 100))

  // Nudge users state
  const [nudgeUsers, setNudgeUsers] = useState([
    { id: '1', name: 'John Doe', missing: 'requires +200 BV to qualify for Executive', type: 'Volume' },
    { id: '2', name: 'Alice Smith', missing: 'requires 1 active direct referral to qualify for Manager', type: 'Referral' },
    { id: '3', name: 'Bob Johnson', missing: 'requires +500 BV to qualify for Director', type: 'Volume' },
  ])

  // AI strategy states
  const [targetGoal, setTargetGoal] = useState('$5,000')
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null)

  const handleNudge = (userName: string, id: string) => {
    toast({
      title: 'Nudge Sent! 🔔',
      description: `Sent rank progression nudge notification to ${userName}.`,
    })
    setNudgeUsers(prev => prev.filter(u => u.id !== id))
  }

  const handleRequestAIStrategy = () => {
    setLoadingAI(true)
    setTimeout(() => {
      setAiSuggestions([
        {
          id: '1',
          type: 'Left Spillover Acceleration',
          description: 'Place the next 5 active sponsors in your Left Leg. This matches the carrying 1,500 BV from your right and unlocks $150 USD immediately.',
          action: 'Select Left Leg placement in team settings.',
        },
        {
          id: '2',
          type: 'Direct Rank Promotion Push',
          description: 'Nudge John Doe and Bob Johnson who are close to rank elevations. Upgrading them boosts your total Team Volume carry by 700 BV, qualifying you for the next leader bonus.',
          action: 'Trigger nudge notifications to the highlighted downline members.',
        },
        {
          id: '3',
          type: 'Active Package Upgrade',
          description: 'Recommend package renewals and binary MLM upgrades to the top 10 inactive users in your weaker leg to trigger cycle payments.',
          action: 'Send a broadcast message from the chat panel.',
        }
      ])
      setLoadingAI(false)
      toast({
        title: 'NVIDIA NIM Recommendation Loaded',
        description: '3 custom binary strategy optimization plans are ready.',
      })
    }, 1200)
  }

  return (
    <div className={`flex h-screen bg-background cyber-mesh overflow-hidden theme-${dashboardTheme}`}>
      <UserSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="shrink-0 cyber-header sticky top-0 z-30 px-4 md:px-6 py-3 border-b border-border/50 bg-card/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="size-5 text-primary" />
              <h1 className="text-base md:text-lg font-semibold truncate">Leader Strategy Console</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                className="bg-background border border-border/50 text-[11px] rounded px-2 py-1 text-foreground cursor-pointer focus:outline-none h-8"
                value={dashboardTheme}
                onChange={(e) => setDashboardTheme(e.target.value as any)}
              >
                <option value="dark">🌑 Dark Mode</option>
                <option value="light-skeuo">☀️ Light Tactile</option>
                <option value="liquid-glass">🧪 Liquid Glass</option>
              </select>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* Top Bento Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cyber-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Downline</p>
                  <p className="text-lg font-bold">{stats.totalDownline.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Active Members</p>
                  <p className="text-lg font-bold">{stats.activeDownline.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <ArrowRightLeft className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Left / Right Volume</p>
                  <p className="text-sm font-bold font-mono">{stats.leftVolume} BV / {stats.rightVolume} BV</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Pairing Commissions</p>
                  <p className="text-lg font-bold text-purple-400">${stats.pairingEarned.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leg Balance Recommender */}
            <Card className="cyber-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Lightbulb className="size-4 text-emerald-400" />
                  Leg Balance Recommender
                </CardTitle>
                <CardDescription className="text-xs">
                  Active analytics recommending spillover configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                  <Badge className="bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">RECOMMENDED</Badge>
                  <div className="text-xs text-foreground space-y-1">
                    <p className="font-bold">Place new signups on the RIGHT leg.</p>
                    <p className="text-muted-foreground leading-relaxed">
                      You currently hold a volume gap of {stats.leftVolume - stats.rightVolume} BV. Placing new active members on the Right leg will trigger a 1:1 match against the carryover on the left, generating immediate 10% pairing bonuses (1 BV = $1 USD).
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <p className="text-xs font-semibold mb-2">Configure Spillover Placement Strategy</p>
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" className="text-xs hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400">Left Leg</Button>
                    <Button size="xs" variant="outline" className="text-xs hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400">Right Leg</Button>
                    <Button size="xs" className="text-xs bg-emerald-600 text-white hover:bg-emerald-700">Balanced Auto (Recommended)</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projection Simulator */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Pairing Commission Simulator</CardTitle>
                <CardDescription className="text-xs">Project earnings based on weaker leg volume growth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span>Monthly Volume:</span>
                    <span className="font-bold text-foreground">${simVolume.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={simVolume}
                    onChange={e => setSimVolume(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span>Pairing Payout rate:</span>
                    <span className="font-bold text-foreground">{simRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={simRate}
                    onChange={e => setSimRate(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-center mt-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Estimated Monthly Commissions</p>
                  <p className="text-xl font-black text-primary">${projectPayout.toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">Calculated at 1 BV = $1 USD matching</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Milestone Nudges */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Bell className="size-4 text-amber-400" />
                  Milestone Nudge System
                </CardTitle>
                <CardDescription className="text-xs">Help downline members achieve next rank upgrades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nudgeUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">All pending nudges completed! Check back later.</p>
                ) : (
                  nudgeUsers.map(user => (
                    <div key={user.id} className="p-2.5 rounded-lg border border-border/50 bg-background/20 flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">{user.missing}</p>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleNudge(user.name, user.id)}
                        className="text-[10px] h-7 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 shrink-0"
                      >
                        <Send className="size-2.5 mr-1" /> Nudge
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* AI NIM strategy suggestor */}
            <Card className="cyber-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Sparkles className="size-4 text-purple-400 animate-pulse" />
                  NVIDIA AI Strategy Suggestor
                </CardTitle>
                <CardDescription className="text-xs">Request custom NIM-driven binary recommendations for your network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground block mb-1">Target Monthly Payout Goal</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border/50 rounded px-3 py-1.5 text-xs text-foreground focus:outline-none"
                      value={targetGoal}
                      onChange={e => setTargetGoal(e.target.value)}
                      placeholder="e.g. $5,000"
                    />
                  </div>
                  <Button
                    disabled={loadingAI}
                    onClick={handleRequestAIStrategy}
                    className="self-end h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loadingAI ? <RefreshCw className="size-3 animate-spin mr-1" /> : 'Get Strategy'}
                  </Button>
                </div>

                {aiSuggestions && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                      <span>NVIDIA NIM AI Generated Outcomes:</span>
                      <Button size="xs" variant="ghost" onClick={handleRequestAIStrategy} className="h-6 text-[9px]">Regenerate</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {aiSuggestions.map(sug => (
                        <div key={sug.id} className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between text-xs space-y-2">
                          <div className="space-y-1">
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[9px] mb-1">{sug.type}</Badge>
                            <p className="text-[10px] text-muted-foreground leading-normal">{sug.description}</p>
                          </div>
                          <div className="pt-1.5 border-t border-purple-500/10 text-[9px] text-purple-300 font-medium">
                            Action: {sug.action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}
