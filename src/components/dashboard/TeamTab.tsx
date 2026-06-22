'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Users, UserPlus, Copy, Check, Share2, Network, ArrowUp, User, Star, Trophy, Crown, Gift, Info, Search, Sparkles, Calculator, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TeamMember {
  id: string
  name: string
  email: string
  totalDeposited: number
  totalEarnings: number
  isActive: boolean
  createdAt: string
}

interface TeamLevel {
  level: number
  members: TeamMember[]
  count: number
}

interface BinaryTreeNode {
  id: string
  name: string
  email: string
  mlmRank: string
  isActive: boolean
  binaryTreeLeftChildId: string | null
  binaryTreeRightChildId: string | null
  binaryTreeLeftVolume: number
  binaryTreeRightVolume: number
  binaryTreeLeftVolumeCarryForward: number
  binaryTreeRightVolumeCarryForward: number
  personalVolume: number
  teamVolume: number
  binaryTreePosition: string
  leftLegCount?: number
  rightLegCount?: number
  leftChild?: BinaryTreeNode | null
  rightChild?: BinaryTreeNode | null
}

export function TeamTab() {
  const { user } = useAppStore()
  const { toast } = useToast()
  
  // Tab states
  const [directReferrals, setDirectReferrals] = useState<TeamMember[]>([])
  const [teamByLevel, setTeamByLevel] = useState<TeamLevel[]>([])
  const [totalTeam, setTotalTeam] = useState(0)
  const [totalDirect, setTotalDirect] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [registrationRates, setRegistrationRates] = useState<{ level: number; commission: number }[]>([])

  // Binary Tree states
  const [activeTreeRootId, setActiveTreeRootId] = useState<string>('')
  const [treeData, setTreeData] = useState<BinaryTreeNode | null>(null)
  const [treeLoading, setTreeLoading] = useState(false)
  const [placementPref, setPlacementPref] = useState('balanced')
  const [updatingPref, setUpdatingPref] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([])
  const [rootFirstPairMatched, setRootFirstPairMatched] = useState(false)

  // Search states
  const [searchVal, setSearchVal] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Detail Modal states
  const [selectedNode, setSelectedNode] = useState<BinaryTreeNode | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Simulator states
  const [simLeg, setSimLeg] = useState<'left' | 'right'>('left')
  const [simAmount, setSimAmount] = useState<number>(250)
  const [simResults, setSimResults] = useState<{
    leftCF: number
    rightCF: number
    matchedPayout: number
    newLeftCF: number
    newRightCF: number
    steps: string[]
    rankUpgrade: string | null
    rewardsUnlocked: string[]
    potentialBonus?: number
    estimatedDailyRoi?: number
    estimatedLifetimeRoi?: number
    directBonus?: number
    indirectBonus?: number
    balancedPairingPayout?: number
    avgExpectedEarning?: number
    dailyMatchingYield?: number
  } | null>(null)

  // Load team list stats
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/team?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setDirectReferrals(data.directReferrals || [])
        setTeamByLevel(data.teamByLevel || [])
        setTotalTeam(data.totalTeam || 0)
        setTotalDirect(data.totalDirect || 0)
        setRegistrationRates(data.registrationRates || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  // Initialize tree root
  useEffect(() => {
    if (user?.id) {
      setActiveTreeRootId(user.id)
      setBreadcrumbs([{ id: user.id, name: 'My Profile' }])
    }
  }, [user?.id])

  // Fetch Tree Downline
  const fetchTree = useCallback(async (rootId: string) => {
    if (!rootId) return
    setTreeLoading(true)
    try {
      const res = await fetch(`/api/user/binary-tree?userId=${user?.id}&rootId=${rootId}`)
      if (res.ok) {
        const data = await res.json()
        setTreeData(data.tree)
        setRootFirstPairMatched(data.hasMatchedFirstPair || false)
        if (rootId === user?.id) {
          setPlacementPref(data.placementPreference || 'balanced')
        }
      }
    } catch (err) {
      console.error('Failed to load binary tree downline:', err)
    } finally {
      setTreeLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (activeTreeRootId) {
      fetchTree(activeTreeRootId)
    }
  }, [activeTreeRootId, fetchTree])

  // Downline search debounce
  useEffect(() => {
    if (searchVal.trim().length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/user/binary-tree?userId=${user?.id}&search=${encodeURIComponent(searchVal)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.results || [])
          setShowDropdown(true)
        }
      } catch (err) {
        console.error('Downline search error:', err)
      } finally {
        setSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchVal, user?.id])

  // Leg volume simulation calculator logic
  useEffect(() => {
    if (!treeData) return
    const root = treeData
    const originalLeft = root.binaryTreeLeftVolumeCarryForward
    const originalRight = root.binaryTreeRightVolumeCarryForward
    let left = originalLeft
    let right = originalRight

    if (simLeg === 'left') {
      left += simAmount
    } else {
      right += simAmount
    }

    let firstPairMatched = rootFirstPairMatched
    let pairingEarning = 0
    const steps: string[] = []
    let leftCF = left
    let rightCF = right

    steps.push(`Base Carry Forwards: Left: ${originalLeft} BV, Right: ${originalRight} BV.`)
    steps.push(`Adding simulated volume of ${simAmount} BV on the ${simLeg.toUpperCase()} leg.`)

    // First pair check (1:2 or 2:1 ratio)
    if (!firstPairMatched) {
      let isFirstPairMatch = false
      let leftDeduct = 0
      let rightDeduct = 0

      if (left >= 100 && right >= 200) {
        isFirstPairMatch = true
        leftDeduct = 100
        rightDeduct = 200
      } else if (left >= 200 && right >= 100) {
        isFirstPairMatch = true
        leftDeduct = 200
        rightDeduct = 100
      }

      if (isFirstPairMatch) {
        pairingEarning += 10 // $10 pairing bonus (10% of 100 BV weaker leg)
        leftCF = left - leftDeduct
        rightCF = right - rightDeduct
        firstPairMatched = true
        steps.push(`🎉 First pair matched! Deducting ${leftDeduct} BV Left and ${rightDeduct} BV Right. Payout: $10.00 USD.`)
      } else {
        steps.push(`First pair NOT matched yet. Requires 100/200 BV ratio. Current: Left: ${left} BV, Right: ${right} BV. No payout.`)
      }
    } else {
      steps.push(`First pair is already matched. Standard 1:1 matching applies.`)
    }

    if (firstPairMatched) {
      const match = Math.min(leftCF, rightCF)
      if (match > 0) {
        const payout = match * 0.10
        pairingEarning += payout
        leftCF -= match
        rightCF -= match
        steps.push(`⚡ Matched 1:1 pairing of ${match} BV. Payout: $${payout.toFixed(2)} USD (10%). Remaining CF: Left: ${leftCF} BV, Right: ${rightCF} BV.`)
      } else {
        steps.push(`No pairing match possible. Remaining CF: Left: ${leftCF} BV, Right: ${rightCF} BV.`)
      }
    }

    // Rank milestones
    const simulatedTv = root.teamVolume + simAmount
    const ranks = [
      { name: 'Executive', reqTv: 1000, reqPv: 100, reqBv: 500, gift: 'Nova Executive Writing Pen', bonus: 50 },
      { name: 'Manager', reqTv: 5000, reqPv: 500, reqBv: 2500, gift: 'Montblanc Business Writing Set', bonus: 250 },
      { name: 'Director', reqTv: 20000, reqPv: 2000, reqBv: 10000, gift: 'Leadership Retreat Invite', bonus: 1000 },
      { name: 'President', reqTv: 100000, reqPv: 10000, reqBv: 50000, gift: '18K Gold President Signet Ring', bonus: 5000 },
    ]

    let newRank: string | null = null
    const rewardsUnlocked: string[] = []

    ranks.forEach(r => {
      if (simulatedTv >= r.reqTv) {
        rewardsUnlocked.push(`${r.name}: ${r.gift} + $${r.bonus} Cash`)
        
        const currentRankLevel = ['Member', 'Executive', 'Manager', 'Director', 'President'].indexOf(root.mlmRank)
        const simRankLevel = ['Member', 'Executive', 'Manager', 'Director', 'President'].indexOf(r.name)
        if (simRankLevel > currentRankLevel) {
          newRank = r.name
        }
      }
    })

    // Calculate potential & passive earnings on simulated volumes
    const matchedVolume = Math.min(left, right) - Math.min(originalLeft, originalRight)
    const unmatchedVolume = Math.max(0, simAmount - matchedVolume)
    const potentialBonus = unmatchedVolume * 0.10
    const estimatedDailyRoi = simAmount * 0.015 // 1.5% avg daily yield
    const estimatedLifetimeRoi = simAmount * 0.015 * 400 // 400 days including capital

    const directBonus = simAmount * 0.10
    const indirectBonus = simAmount * 0.05
    const balancedPairingPayout = simAmount * 0.10
    const avgExpectedEarning = directBonus + indirectBonus + Math.max(pairingEarning, balancedPairingPayout)
    const dailyMatchingYield = simAmount * 0.015 * 0.10

    steps.push(`--- Average Expected downline network commissions:`)
    steps.push(`• Direct Sponsor bonus (10%): +$${directBonus.toFixed(2)} USD.`)
    steps.push(`• Indirect Level bonus (5%): +$${indirectBonus.toFixed(2)} USD.`)
    steps.push(`• Balanced Pairing matching projection (10% on balanced leg): +$${balancedPairingPayout.toFixed(2)} USD.`)
    steps.push(`• Expected Average Earnings: +$${avgExpectedEarning.toFixed(2)} USD.`)

    setSimResults({
      leftCF: left,
      rightCF: right,
      matchedPayout: pairingEarning,
      newLeftCF: leftCF,
      newRightCF: rightCF,
      steps,
      rankUpgrade: newRank,
      rewardsUnlocked,
      potentialBonus,
      estimatedDailyRoi,
      estimatedLifetimeRoi,
      directBonus,
      indirectBonus,
      balancedPairingPayout,
      avgExpectedEarning,
      dailyMatchingYield,
    })
  }, [treeData, simAmount, simLeg, rootFirstPairMatched])

  // Select Search result & resolve path
  const handleSelectSearchResult = async (member: any) => {
    setSearchVal('')
    setShowDropdown(false)
    setTreeLoading(true)
    try {
      const res = await fetch(`/api/user/binary-tree?userId=${user?.id}&resolvePath=${member.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.path) {
          setBreadcrumbs(data.path)
          setActiveTreeRootId(member.id)
        }
      }
    } catch (err) {
      console.error('Failed to resolve downline path:', err)
    } finally {
      setTreeLoading(false)
    }
  }

  // Update placement preference
  const handleUpdatePreference = async (pref: string) => {
    if (!user?.id) return
    setUpdatingPref(true)
    try {
      const res = await fetch('/api/user/binary-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, preference: pref }),
      })
      if (res.ok) {
        setPlacementPref(pref)
        toast({ title: 'Success', description: `Sponsor placement preference set to ${pref}` })
      } else {
        throw new Error()
      }
    } catch (err) {
      toast({ title: 'Failed to update preference', variant: 'destructive' })
    } finally {
      setUpdatingPref(false)
    }
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${user?.referralCode}`

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDrillDown = (nodeId: string, nodeName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setBreadcrumbs(prev => [...prev, { id: nodeId, name: nodeName }])
    setActiveTreeRootId(nodeId)
  }

  const handleBreadcrumbClick = (index: number, id: string) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1))
    setActiveTreeRootId(id)
  }

  // Open details Explorer modal
  const openExplorerDetails = (node: BinaryTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(node)
    setIsDetailOpen(true)
  }

  // Styled Node Card Builder
  const renderNodeCard = (node: BinaryTreeNode | null | undefined, label: string, side: 'left' | 'right' | 'root') => {
    if (!node) {
      return (
        <Card className="bg-muted/10 border-dashed border-border/50 flex flex-col items-center justify-center p-4 h-36 rounded-xl">
          <div className="size-8 rounded-full bg-muted/20 flex items-center justify-center mb-2">
            <User className="size-4 text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Empty Slot</span>
        </Card>
      )
    }

    const isActive = node.isActive
    return (
      <Card 
        onClick={(e) => openExplorerDetails(node, e)}
        className="bg-card/40 border-border/50 hover:border-emerald-500/50 hover:bg-card/60 cursor-pointer transition-all duration-200 p-3 h-auto rounded-xl flex flex-col justify-between shadow-lg relative group"
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-xs font-bold text-foreground truncate max-w-[85px]">{node.name}</span>
            </div>
            <Badge className="text-[8px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold px-1 py-0 h-4">
              {node.mlmRank}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-1 text-[9px] text-muted-foreground bg-background/25 p-1 rounded border border-border/20">
            <div>
              <span className="block font-semibold uppercase text-emerald-400">Left volume</span>
              <span className="font-mono text-foreground">{node.binaryTreeLeftVolume.toLocaleString()} BV</span>
            </div>
            <div>
              <span className="block font-semibold uppercase text-cyan-400">Right Volume</span>
              <span className="font-mono text-foreground">{node.binaryTreeRightVolume.toLocaleString()} BV</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[9px] text-muted-foreground mt-1 bg-background/25 p-1 rounded border border-border/20">
            <div>
              <span className="block font-semibold uppercase text-purple-400">Left Carry Forward</span>
              <span className="font-mono text-foreground">{node.binaryTreeLeftVolumeCarryForward.toLocaleString()} BV</span>
            </div>
            <div>
              <span className="block font-semibold uppercase text-pink-400">Right Carry Forward</span>
              <span className="font-mono text-foreground">{node.binaryTreeRightVolumeCarryForward.toLocaleString()} BV</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 mt-2.5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => openExplorerDetails(node, e)}
            className="flex-1 h-6 text-[8px] uppercase tracking-wider bg-secondary/30 hover:bg-secondary/50 text-foreground py-0"
          >
            Details
          </Button>
          {(node.binaryTreeLeftChildId || node.binaryTreeRightChildId) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => handleDrillDown(node.id, node.name, e)}
              className="flex-1 h-6 text-[8px] uppercase tracking-wider bg-emerald-600/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-600/20 py-0"
            >
              Drill
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">My Team & Network</h2>
        <p className="text-sm text-muted-foreground">Manage your referral network, monitor legs volume, and visually navigate your tree downline.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <UserPlus className="size-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalDirect}</p>
            <p className="text-xs text-muted-foreground">Direct Referrals</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="size-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalTeam}</p>
            <p className="text-xs text-muted-foreground">Total Team</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{teamByLevel.filter(l => l.count > 0).length}</p>
            <p className="text-xs text-muted-foreground">Active Levels</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">7</p>
            <p className="text-xs text-muted-foreground">Max Levels</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="size-4 text-primary" />
            New Registration - Share Your Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => handleCopy(referralLink)}>
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Referral Code</p>
              <p className="font-mono font-bold">{user?.referralCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Tabs */}
      <Tabs defaultValue="direct">
        <TabsList className="bg-muted/30 border border-border/30 rounded-xl p-1 max-w-md w-full grid grid-cols-3">
          <TabsTrigger value="direct">Direct Referrals</TabsTrigger>
          <TabsTrigger value="levels">Team Levels</TabsTrigger>
          <TabsTrigger value="binary_tree">Alliance Tree</TabsTrigger>
        </TabsList>

        <TabsContent value="direct" className="mt-4 space-y-3">
          {directReferrals.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <Users className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No direct referrals yet. Share your link to grow your team!</p>
              </CardContent>
            </Card>
          ) : (
            directReferrals.map(member => (
              <Card key={member.id} className="bg-card/50 border-border/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Deposited</p>
                    <p className="text-sm font-bold">${(member.totalDeposited || 0).toFixed(2)}</p>
                    <Badge className={member.isActive ? 'bg-emerald-500/20 text-emerald-400 text-[9px]' : 'bg-rose-500/20 text-rose-400 text-[9px]'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="levels" className="mt-4 space-y-3">
          {teamByLevel.map(level => (
            <Card key={level.level} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Level {level.level}
                    </Badge>
                     <span className="text-sm text-muted-foreground">
                      {(() => {
                        const rule = registrationRates.find(r => r.level === level.level)
                        const rate = rule ? rule.commission : ([25, 20, 15, 10, 10, 10, 10][level.level - 1] || 10)
                        return `${rate}% commission`
                      })()}
                     </span>
                  </div>
                  <span className="text-sm font-bold">{level.count} members</span>
                </div>
                {level.members.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {level.members.slice(0, 5).map(m => (
                      <div key={m.id} className="flex justify-between text-xs py-1 border-t border-border/30">
                        <span className="text-muted-foreground">{m.name}</span>
                        <span className="font-medium">${(m.totalDeposited || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    {level.members.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        +{level.members.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="binary_tree" className="mt-4 space-y-6">
          
          {/* Binary Control bar with Spillover preference & search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Custom Spillover Strategy Selector */}
            <Card className="bg-card/30 border-border/50 backdrop-blur-md">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Network className="size-4 text-emerald-400" />
                    Sponsor Spillover Preference
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Define which leg newly registered referrals are placed into by default.</p>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'balanced', label: 'Balanced (Auto)' },
                    { id: 'left', label: 'Left Leg' },
                    { id: 'right', label: 'Right Leg' },
                  ].map(opt => (
                    <Button
                      key={opt.id}
                      type="button"
                      size="sm"
                      variant={placementPref === opt.id ? 'default' : 'outline'}
                      disabled={updatingPref}
                      onClick={() => handleUpdatePreference(opt.id)}
                      className="text-xs h-8 px-3 rounded-lg"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Downline network search */}
            <Card className="bg-card/30 border-border/50 backdrop-blur-md">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-3 relative">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Search className="size-4 text-cyan-400" />
                    Downline Network Search
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Quickly jump to any member in your downline subtree.</p>
                </div>
                
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search member name or email..." 
                      value={searchVal}
                      onChange={(e) => {
                        setSearchVal(e.target.value)
                        if (!e.target.value) {
                          setShowDropdown(false)
                        }
                      }}
                      className="pl-9 h-9 text-xs" 
                    />
                    {searchLoading && (
                      <span className="absolute right-3 top-2.5 size-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                    )}
                  </div>

                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-card/95 border border-border/60 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto backdrop-blur-lg">
                      {searchResults.map(member => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectSearchResult(member)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-600/10 border-b border-border/20 last:border-b-0 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold block">{member.name}</span>
                            <span className="text-[10px] text-muted-foreground">{member.email}</span>
                          </div>
                          <Badge className="text-[8px] bg-secondary/50">{member.mlmRank}</Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && searchResults.length === 0 && searchVal.length >= 2 && !searchLoading && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-card/95 border border-border/60 rounded-lg p-3 text-center text-xs text-muted-foreground z-50">
                      No matching downline users found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breadcrumbs for Navigation */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap bg-card/10 p-2.5 rounded-lg border border-border/30">
            <span className="font-bold text-[10px] uppercase text-emerald-500 tracking-wider">Network Path:</span>
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBreadcrumbClick(idx, crumb.id)}
                  className={`hover:text-primary font-medium ${idx === breadcrumbs.length - 1 ? 'text-emerald-400 font-bold' : ''}`}
                >
                  {crumb.name}
                </button>
                {idx < breadcrumbs.length - 1 && <span>&rarr;</span>}
              </div>
            ))}
            {breadcrumbs.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user?.id) {
                    setBreadcrumbs([{ id: user.id, name: 'My Profile' }])
                    setActiveTreeRootId(user.id)
                  }
                }}
                className="h-6 px-2 text-[9px] ml-auto bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400"
              >
                Reset to My Top
              </Button>
            )}
          </div>

          {/* Interactive Binary Tree Graphical Visualizer */}
          <Card className="bg-card/20 border-border/30 overflow-x-auto select-none">
            <CardContent className="p-6 min-w-[700px] flex flex-col items-center">
              {treeLoading ? (
                <div className="py-20 text-center text-xs text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                  <span className="size-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                  Loading network downline nodes...
                </div>
              ) : treeData ? (
                <div className="w-full flex flex-col items-center space-y-8">
                  
                  {/* LEVEL 1: ROOT */}
                  <div className="w-full flex justify-center">
                    <div className="w-[185px]">
                      {renderNodeCard(treeData, 'Root', 'root')}
                    </div>
                  </div>

                  {/* Lines spacer */}
                  <div className="w-1/2 h-0 border-t border-border/40 relative">
                    <div className="absolute left-0 top-0 bottom-[-16px] border-l border-border/40"></div>
                    <div className="absolute right-0 top-0 bottom-[-16px] border-r border-border/40"></div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-[-16px] bottom-0 border-l border-border/40"></div>
                  </div>

                  {/* LEVEL 2: CHILDREN */}
                  <div className="w-full flex justify-around">
                    <div className="w-[185px] flex flex-col items-center">
                      <span className="text-[10px] text-emerald-500 font-bold tracking-widest mb-1.5 uppercase">Left Leg</span>
                      {renderNodeCard(treeData.leftChild, 'Left Leg', 'left')}
                    </div>
                    <div className="w-[185px] flex flex-col items-center">
                      <span className="text-[10px] text-cyan-400 font-bold tracking-widest mb-1.5 uppercase">Right Leg</span>
                      {renderNodeCard(treeData.rightChild, 'Right Leg', 'right')}
                    </div>
                  </div>

                  {/* Lines spacer Level 2 -> 3 */}
                  <div className="w-full flex justify-around">
                    <div className="w-[185px] h-0 border-t border-border/30 relative">
                      <div className="absolute left-0 top-0 bottom-[-16px] border-l border-border/30"></div>
                      <div className="absolute right-0 top-0 bottom-[-16px] border-r border-border/30"></div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-[-16px] bottom-0 border-l border-border/30"></div>
                    </div>
                    <div className="w-[185px] h-0 border-t border-border/30 relative">
                      <div className="absolute left-0 top-0 bottom-[-16px] border-l border-border/30"></div>
                      <div className="absolute right-0 top-0 bottom-[-16px] border-r border-border/30"></div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-[-16px] bottom-0 border-l border-border/30"></div>
                    </div>
                  </div>

                  {/* LEVEL 3: GRANDCHILDREN */}
                  <div className="w-full flex justify-between">
                    <div className="w-[155px]">
                      {renderNodeCard(treeData.leftChild?.leftChild, 'Left-Left', 'left')}
                    </div>
                    <div className="w-[155px]">
                      {renderNodeCard(treeData.leftChild?.rightChild, 'Left-Right', 'right')}
                    </div>
                    <div className="w-[155px]">
                      {renderNodeCard(treeData.rightChild?.leftChild, 'Right-Left', 'left')}
                    </div>
                    <div className="w-[155px]">
                      {renderNodeCard(treeData.rightChild?.rightChild, 'Right-Right', 'right')}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-20 text-center text-xs text-muted-foreground">
                  Could not load network downline nodes.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Leg Volume & Rank Simulator Widget */}
          <Card className="bg-card/40 border-border/50 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calculator className="size-4 text-emerald-400" />
                Leg Volume & Rank Simulator
              </CardTitle>
              <CardDescription className="text-xs">
                Simulate leg volume additions to see pairing bonuses and rank upgrade milestones in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">Target Leg</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={simLeg === 'left' ? 'default' : 'outline'}
                        onClick={() => setSimLeg('left')}
                        className="flex-1 text-xs"
                      >
                        Left Leg
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={simLeg === 'right' ? 'default' : 'outline'}
                        onClick={() => setSimLeg('right')}
                        className="flex-1 text-xs"
                      >
                        Right Leg
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">Simulated Volume Addition</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={simAmount}
                        onChange={(e) => setSimAmount(Math.max(1, parseInt(e.target.value) || 0))}
                        className="font-mono text-xs h-8"
                      />
                      <span className="flex items-center text-xs font-bold text-muted-foreground px-2 bg-secondary/40 border border-border/40 rounded-lg">BV</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[100, 250, 500, 1000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSimAmount(amt)}
                          className="px-2 py-0.5 border border-border/40 rounded text-[10px] hover:bg-secondary/40 font-mono text-muted-foreground hover:text-foreground"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulation Output */}
                {simResults && (
                  <div className="rounded-xl bg-background/55 border border-border/30 p-3.5 space-y-2 flex-1">
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2 rounded-lg mb-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Average Expected Earnings:</span>
                        <span className="text-[9px] text-muted-foreground">Direct + Indirect + Projected Matching</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-base">
                        +${(simResults.avgExpectedEarning || 0).toFixed(2)} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-muted-foreground">Immediate Pairing Payout:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {simResults.matchedPayout > 0 ? `+$${simResults.matchedPayout.toFixed(2)} USD` : '$0.00 USD'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/10">
                      <span className="font-semibold text-muted-foreground">Direct Sponsor Bonus (10%):</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        +${(simResults.directBonus || 0).toFixed(2)} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/10">
                      <span className="font-semibold text-muted-foreground">Indirect Level Commissions (5%):</span>
                      <span className="font-mono text-violet-400 font-bold">
                        +${(simResults.indirectBonus || 0).toFixed(2)} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/10">
                      <span className="font-semibold text-muted-foreground">Balanced Pairing Projection:</span>
                      <span className="font-mono text-amber-400 font-bold">
                        +${(simResults.balancedPairingPayout || 0).toFixed(2)} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/10">
                      <span className="font-semibold text-muted-foreground">Carry-Forward Potential:</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        +${(simResults.potentialBonus || 0).toFixed(2)} USD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/10">
                      <span className="font-semibold text-muted-foreground">Downline Daily Yield Matching:</span>
                      <span className="font-mono text-emerald-500 font-bold">
                        +${(simResults.dailyMatchingYield || 0).toFixed(4)} / day
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/10">
                      <span className="font-semibold text-muted-foreground">Avg. Daily ROI Yield (1.5%):</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        +${(simResults.estimatedDailyRoi || 0).toFixed(2)} / day
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/10">
                      <span className="font-semibold text-muted-foreground">Est. 400-day Yield (Capital + ROI):</span>
                      <span className="font-mono text-purple-400 font-bold">
                        +${(simResults.estimatedLifetimeRoi || 0).toFixed(2)} USD
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/20 text-[10px]">
                      <div>
                        <span className="text-muted-foreground block">Simulated Left CF:</span>
                        <span className="font-mono font-bold text-foreground">{simResults.newLeftCF.toLocaleString()} BV</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Simulated Right CF:</span>
                        <span className="font-mono font-bold text-foreground">{simResults.newRightCF.toLocaleString()} BV</span>
                      </div>
                    </div>

                    {simResults.rankUpgrade && (
                      <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-1.5 animate-bounce">
                        <Sparkles className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400">Simulated Promotion: {simResults.rankUpgrade} Rank!</p>
                          <p className="text-[9px] text-muted-foreground">Unlock rewards: {simResults.rewardsUnlocked[simResults.rewardsUnlocked.length - 1]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step Logs */}
              {simResults && (
                <div className="rounded-lg bg-black/40 border border-border/25 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Matching Mechanics Breakdown</p>
                  <div className="space-y-1 text-[10px] font-mono text-muted-foreground leading-relaxed">
                    {simResults.steps.map((step, idx) => (
                      <p key={idx} className="flex gap-1.5 items-start">
                        <span className="text-emerald-500 shrink-0">&raquo;</span>
                        <span>{step}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Guide Legend */}
          <Card className="bg-card/20 border-border/30">
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="size-4 text-emerald-400" />
                Alliance Pairing Rules Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                - **Placements & Volume**: Leg volumes are sourced from activated plans. Activating a plan instantly routes the paid entry fee as volume (BV) to all parent sponsors recursively.
              </p>
              <p>
                - **First Pair Requirement**: Your first binary match operates under a **1:2 or 2:1** ratio ($100$ BV on Left and $200$ BV on Right, or vice versa).
              </p>
              <p>
                - **Subsequent Pairs**: After the first pair is matched successfully, all next binary matchings are processed 1:1. Matched volume is deducted from the legs and carry forwards are maintained.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Node Detail Explorer Modal */}
      {selectedNode && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-md bg-card border border-border/50 text-foreground rounded-xl">
            <DialogHeader className="pb-3 border-b border-border/30">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <User className="size-4 text-emerald-400" />
                Member Network Profile
              </DialogTitle>
              <DialogDescription className="text-xs">
                Detailed binary matrix and qualification metrics for {selectedNode.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-xs">
              
              {/* Basic credentials */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/40 p-2.5 rounded-lg border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Member Name</span>
                  <p className="font-bold text-foreground mt-0.5 truncate">{selectedNode.name}</p>
                </div>
                <div className="bg-background/40 p-2.5 rounded-lg border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Leadership Rank</span>
                  <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <Trophy className="size-3 text-emerald-400" />
                    {selectedNode.mlmRank}
                  </p>
                </div>
              </div>

              {/* Leg Matrix Metrics */}
              <div>
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Leg Statistics (Left vs Right)</h4>
                <div className="grid grid-cols-2 gap-2 bg-background/35 p-3 rounded-lg border border-border/30">
                  
                  <div className="space-y-2 border-r border-border/20 pr-2">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Left leg</p>
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Total Leg Volume:</span>
                      <span className="font-mono font-bold text-foreground">{selectedNode.binaryTreeLeftVolume.toLocaleString()} BV</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Carry Forward:</span>
                      <span className="font-mono font-bold text-foreground">{selectedNode.binaryTreeLeftVolumeCarryForward.toLocaleString()} BV</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Subtree Members:</span>
                      <span className="font-mono font-bold text-foreground">{(selectedNode.leftLegCount || 0).toLocaleString()} users</span>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2">
                    <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest text-right">Right leg</p>
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block">Total Leg Volume:</span>
                      <span className="font-mono font-bold text-foreground">{selectedNode.binaryTreeRightVolume.toLocaleString()} BV</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block">Carry Forward:</span>
                      <span className="font-mono font-bold text-foreground">{selectedNode.binaryTreeRightVolumeCarryForward.toLocaleString()} BV</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block">Subtree Members:</span>
                      <span className="font-mono font-bold text-foreground">{(selectedNode.rightLegCount || 0).toLocaleString()} users</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Volume overview */}
              <div>
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Qualifications Volume Summary</h4>
                <div className="grid grid-cols-3 gap-2 bg-background/20 p-2.5 rounded-lg border border-border/20">
                  <div>
                    <span className="text-[9px] text-muted-foreground block">Personal Vol (PV)</span>
                    <span className="font-mono font-bold text-foreground">{(selectedNode.personalVolume || 0).toLocaleString()} BV</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block">Sponsor Vol (BV)</span>
                    <span className="font-mono font-bold text-foreground">{(selectedNode.businessVolume || 0).toLocaleString()} BV</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block">Team Vol (TV)</span>
                    <span className="font-mono font-bold text-foreground">{(selectedNode.teamVolume || 0).toLocaleString()} BV</span>
                  </div>
                </div>
              </div>

              {/* Rank Progression Checklist */}
              <div>
                <h4 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Next Rank Qualification Milestones</h4>
                <div className="space-y-2 bg-background/25 p-3 rounded-lg border border-border/20">
                  {[
                    { name: 'Executive', reqPv: 100, reqBv: 500, reqTv: 1000 },
                    { name: 'Manager', reqPv: 500, reqBv: 2500, reqTv: 5000 },
                    { name: 'Director', reqPv: 2000, reqBv: 10000, reqTv: 20000 },
                    { name: 'President', reqPv: 10000, reqBv: 50000, reqTv: 100000 }
                  ].map(rk => {
                    const currentRankLevel = ['Member', 'Executive', 'Manager', 'Director', 'President'].indexOf(selectedNode.mlmRank)
                    const iterRankLevel = ['Member', 'Executive', 'Manager', 'Director', 'President'].indexOf(rk.name)
                    const isQualified = currentRankLevel >= iterRankLevel

                    return (
                      <div key={rk.name} className={`flex items-start justify-between p-1.5 rounded border ${isQualified ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-secondary/10 border-border/30'}`}>
                        <div>
                          <p className={`font-bold ${isQualified ? 'text-emerald-400' : 'text-muted-foreground'}`}>{rk.name} Milestone</p>
                          <p className="text-[9px] text-muted-foreground">
                            Reqs: PV: {rk.reqPv.toLocaleString()} | BV: {rk.reqBv.toLocaleString()} | TV: {rk.reqTv.toLocaleString()}
                          </p>
                        </div>
                        {isQualified ? (
                          <CheckCircle2 className="size-4 text-emerald-400 mt-0.5" />
                        ) : (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-secondary/55 text-muted-foreground border border-border/30">
                            Pending
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action buttons inside Dialog */}
              <div className="flex gap-2.5 pt-3 border-t border-border/30 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close Profile
                </Button>
                {selectedNode.id !== activeTreeRootId && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => {
                      setBreadcrumbs(prev => [...prev, { id: selectedNode.id, name: selectedNode.name }])
                      setActiveTreeRootId(selectedNode.id)
                      setIsDetailOpen(false)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    🔍 Focus downline
                  </Button>
                )}
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
