'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { RefreshCw, Users, TrendingUp, Wallet, Activity, Zap, Search, ShieldAlert, SlidersHorizontal, ListFilter, Calendar, ChevronRight, User, Info, ArrowLeftRight, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

export default function BinaryTreeAnalyticsPage() {
  const { toast } = useToast()
  
  // Analytics tab states
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('analytics')

  // Global Tree Explorer states
  const [activeRootId, setActiveRootId] = useState<string>('')
  const [rootSearchQuery, setRootSearchQuery] = useState('')
  const [rootSearchResults, setRootSearchResults] = useState<any[]>([])
  const [rootSearchLoading, setRootSearchLoading] = useState(false)
  const [showRootSearchDropdown, setShowRootSearchDropdown] = useState(false)
  const [treeData, setTreeData] = useState<BinaryTreeNode | null>(null)
  const [treeLoading, setTreeLoading] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([])

  // Modal Details Explorer
  const [selectedNode, setSelectedNode] = useState<BinaryTreeNode | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Manual Adjustments Tool states
  const [adjustSearchVal, setAdjustSearchVal] = useState('')
  const [adjustSearchResults, setAdjustSearchResults] = useState<any[]>([])
  const [adjustSearchLoading, setAdjustSearchLoading] = useState(false)
  const [showAdjustDropdown, setShowAdjustDropdown] = useState(false)
  
  const [selectedAdjustUser, setSelectedAdjustUser] = useState<any>(null)
  const [leftVolDelta, setLeftVolDelta] = useState(0)
  const [rightVolDelta, setRightVolDelta] = useState(0)
  const [leftCFDelta, setLeftCFDelta] = useState(0)
  const [rightCFDelta, setRightCFDelta] = useState(0)
  const [pvDelta, setPvDelta] = useState(0)
  const [bvDelta, setBvDelta] = useState(0)
  const [tvDelta, setTvDelta] = useState(0)
  const [adjustReason, setAdjustReason] = useState('Manual balance override')
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)

  // Audit Logs Ledger states
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotalPages, setAuditTotalPages] = useState(1)
  const [auditSearchQuery, setAuditSearchQuery] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('all')
  const [auditLoading, setAuditLoading] = useState(false)
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)

  // Fetch metrics data
  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/binary-tree-analytics')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      
      // Auto-select root id if not set
      if (json.totalUsers > 0 && !activeRootId) {
        // Fallback to top root (no parent) when we implement explorer
      }
    } catch (err) {
      console.error('Failed to fetch binary tree analytics:', err)
      setError('Failed to load binary tree analytics data')
    } finally {
      setLoading(false)
    }
  }

  // --- 1. Global Tree Explorer Methods ---
  const fetchGlobalTree = useCallback(async (rootId: string) => {
    if (!rootId) return
    setTreeLoading(true)
    try {
      const res = await fetch(`/api/user/binary-tree?userId=admin&rootId=${rootId}`)
      if (res.ok) {
        const data = await res.json()
        setTreeData(data.tree)
      }
    } catch (err) {
      console.error('Failed to load binary tree:', err)
    } finally {
      setTreeLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeRootId) {
      fetchGlobalTree(activeRootId)
    }
  }, [activeRootId, fetchGlobalTree])

  // Root search debounce
  useEffect(() => {
    if (rootSearchQuery.trim().length < 2) {
      setRootSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setRootSearchLoading(true)
      try {
        const res = await fetch(`/api/admin/binary-tree/search-users?query=${encodeURIComponent(rootSearchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setRootSearchResults(data.results || [])
          setShowRootSearchDropdown(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setRootSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [rootSearchQuery])

  const handleSelectRootUser = async (member: any) => {
    setRootSearchQuery('')
    setShowRootSearchDropdown(false)
    setTreeLoading(true)
    try {
      // Resolve path for breadcrumbs
      const res = await fetch(`/api/user/binary-tree?userId=admin&resolvePath=${member.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.path) {
          setBreadcrumbs(data.path)
          setActiveRootId(member.id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTreeLoading(false)
    }
  }

  const handleDrillDown = (nodeId: string, nodeName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setBreadcrumbs(prev => [...prev, { id: nodeId, name: nodeName }])
    setActiveRootId(nodeId)
  }

  const handleBreadcrumbClick = (index: number, id: string) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1))
    setActiveRootId(id)
  }

  const openExplorerDetails = (node: BinaryTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(node)
    setIsDetailOpen(true)
  }

  // --- 2. Manual Adjustments Methods ---
  // Adjust search debounce
  useEffect(() => {
    if (adjustSearchVal.trim().length < 2) {
      setAdjustSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setAdjustSearchLoading(true)
      try {
        const res = await fetch(`/api/admin/binary-tree/search-users?query=${encodeURIComponent(adjustSearchVal)}`)
        if (res.ok) {
          const data = await res.json()
          setAdjustSearchResults(data.results || [])
          setShowAdjustDropdown(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setAdjustSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [adjustSearchVal])

  const handleSelectAdjustUser = (member: any) => {
    setSelectedAdjustUser(member)
    setAdjustSearchVal('')
    setShowAdjustDropdown(false)
  }

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdjustUser) return

    setAdjustSubmitting(true)
    try {
      const res = await fetch('/api/admin/binary-tree/adjust-volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedAdjustUser.id,
          leftVolumeDelta: leftVolDelta,
          rightVolumeDelta: rightVolDelta,
          leftCarryForwardDelta: leftCFDelta,
          rightCarryForwardDelta: rightCFDelta,
          personalVolumeDelta: pvDelta,
          businessVolumeDelta: bvDelta,
          teamVolumeDelta: tvDelta,
          reason: adjustReason,
        }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Volumes adjusted successfully!' })
        // Reset states
        setSelectedAdjustUser(null)
        setLeftVolDelta(0)
        setRightVolDelta(0)
        setLeftCFDelta(0)
        setRightCFDelta(0)
        setPvDelta(0)
        setBvDelta(0)
        setTvDelta(0)
        setAdjustReason('Manual balance override')
        
        // Refresh metrics
        fetchAnalytics()
      } else {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to adjust volumes')
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setAdjustSubmitting(false)
    }
  }

  // --- 3. Audit Logs Ledger Methods ---
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true)
    try {
      const res = await fetch(
        `/api/admin/binary-tree/audit-logs?page=${auditPage}&limit=15&search=${encodeURIComponent(auditSearchQuery)}&actionType=${auditActionFilter}`
      )
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs || [])
        setAuditTotal(data.total || 0)
        setAuditTotalPages(data.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setAuditLoading(false)
    }
  }, [auditPage, auditSearchQuery, auditActionFilter])

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      fetchAuditLogs()
    }
  }, [activeTab, fetchAuditLogs])

  const openAuditDetails = (log: any) => {
    setSelectedAuditLog(log)
    setIsAuditModalOpen(true)
  }

  // Styled Node Card Builder for Global Explorer
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
        className="bg-card/40 border-border/50 hover:border-emerald-500/50 hover:bg-card/60 cursor-pointer transition-all duration-200 p-3 h-auto rounded-xl flex flex-col justify-between shadow-lg relative"
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
              <span className="block font-semibold uppercase text-emerald-400 font-sans">Left Leg</span>
              <span className="font-mono text-foreground">{node.binaryTreeLeftVolume.toLocaleString()} BV</span>
            </div>
            <div>
              <span className="block font-semibold uppercase text-cyan-400 font-sans">Right Leg</span>
              <span className="font-mono text-foreground">{node.binaryTreeRightVolume.toLocaleString()} BV</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[9px] text-muted-foreground mt-1 bg-background/25 p-1 rounded border border-border/20">
            <div>
              <span className="block font-semibold uppercase text-purple-400 font-sans">Left CF</span>
              <span className="font-mono text-foreground">{node.binaryTreeLeftVolumeCarryForward.toLocaleString()} BV</span>
            </div>
            <div>
              <span className="block font-semibold uppercase text-pink-400 font-sans">Right CF</span>
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
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SlidersHorizontal className="size-6 text-emerald-400 animate-pulse" />
            Binary MLM Admin Control Console
          </h1>
          <p className="text-muted-foreground text-sm">System-wide network overview, manual volume overrides, and compliance log browsers</p>
        </div>
        <Button
          onClick={() => {
            fetchAnalytics()
            if (activeTab === 'audit_logs') fetchAuditLogs()
          }}
          disabled={loading || auditLoading}
          size="sm"
          className="gap-2 self-start"
        >
          <RefreshCw className={`size-4 ${(loading || auditLoading) ? 'animate-spin' : ''}`} />
          Refresh Console
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 border border-border/30 rounded-xl p-1 w-full max-w-2xl grid grid-cols-4 mb-6">
          <TabsTrigger value="analytics">Overview</TabsTrigger>
          <TabsTrigger value="explorer">Global Tree Explorer</TabsTrigger>
          <TabsTrigger value="override">Manual Adjustments</TabsTrigger>
          <TabsTrigger value="audit_logs">Audit Ledger</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW METRICS */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg p-2 bg-primary/20 text-primary">
                    <Users className="size-4" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-primary/20 text-primary font-semibold">
                    Global Users
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Total Registered Network</p>
                <p className="text-2xl font-bold mt-1">{data?.totalUsers}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg p-2 bg-emerald-500/20 text-emerald-400">
                    <Activity className="size-4" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold">
                    Today's Audits
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Mutations Today</p>
                <p className="text-2xl font-bold mt-1">{data?.auditMetrics.auditLogsToday}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg p-2 bg-cyan-500/20 text-cyan-400">
                    <TrendingUp className="size-4" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-400 font-semibold">
                    Matrix Balance
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Balance Imbalance Ratio</p>
                <p className="text-2xl font-bold mt-1 font-mono">{data?.treeStructure.balanceRatio.toFixed(4)}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg p-2 bg-violet-500/20 text-violet-400">
                    <Wallet className="size-4" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-violet-500/20 text-violet-400 font-semibold">
                    Total Volume
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Global Left Vol (BV)</p>
                <p className="text-2xl font-bold mt-1 font-mono">{data?.volumeStatistics.leftVolume.total.toLocaleString()} BV</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tree Structure */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Tree Structure Overview</CardTitle>
                <CardDescription className="text-xs">Tree leaf and branching statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Root Nodes (No Parent)</span>
                  <span className="font-bold text-foreground">{data?.treeStructure.rootUsers}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Sponsors with Left Leg Only</span>
                  <span className="font-bold text-foreground">{data?.treeStructure.usersWithLeftChild}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Sponsors with Right Leg Only</span>
                  <span className="font-bold text-foreground">{data?.treeStructure.usersWithRightChild}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Sponsors with Fully Branched Legs</span>
                  <span className="font-bold text-foreground">{data?.treeStructure.usersWithBothChildren}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Leaf Nodes (No Children)</span>
                  <span className="font-bold text-foreground">{data?.treeStructure.usersWithNoChildren}</span>
                </div>
              </CardContent>
            </Card>

            {/* Volume statistics */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Volume statistics (Global Accumulations)</CardTitle>
                <CardDescription className="text-xs">Summed and averaged network volumes in BV</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Left Leg Volumes</p>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-background/30 p-2 rounded border border-border/20">
                    <div>
                      <span className="text-muted-foreground block text-[9px]">Sum Total:</span>
                      <span className="font-mono font-bold text-foreground">{data?.volumeStatistics.leftVolume.total.toLocaleString()} BV</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px]">Average Node:</span>
                      <span className="font-mono font-bold text-foreground">{data?.volumeStatistics.leftVolume.average.toFixed(1)} BV</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Right Leg Volumes</p>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-background/30 p-2 rounded border border-border/20">
                    <div>
                      <span className="text-muted-foreground block text-[9px]">Sum Total:</span>
                      <span className="font-mono font-bold text-foreground">{data?.volumeStatistics.rightVolume.total.toLocaleString()} BV</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px]">Average Node:</span>
                      <span className="font-mono font-bold text-foreground">{data?.volumeStatistics.rightVolume.average.toFixed(1)} BV</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1.5">Carry Forward Volumes</p>
                  <div className="grid grid-cols-2 gap-4 text-xs bg-background/30 p-2 rounded border border-border/20">
                    <div>
                      <span className="text-muted-foreground block text-[9px]">Left CF Sum:</span>
                      <span className="font-mono font-bold text-foreground">{data?.volumeStatistics.leftCarryForward.total.toLocaleString()} BV</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px]">Right CF Sum:</span>
                      <span className="font-mono font-bold text-foreground">{data?.volumeStatistics.rightCarryForward.total.toLocaleString()} BV</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Audit Metrics */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Total Audited Events Logged</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-background/25 border border-border/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Placement Placed</p>
                <p className="text-2xl font-bold text-primary mt-1">{data?.auditMetrics.placementsToday}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Total 'PLACE' events</p>
              </div>
              <div className="bg-background/25 border border-border/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Volume Updates</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{data?.auditMetrics.volumeUpdatesToday}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Total 'VOLUME_UPDATE' events</p>
              </div>
              <div className="bg-background/25 border border-border/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Bonuses Distributed</p>
                <p className="text-2xl font-bold text-violet-400 mt-1">{data?.auditMetrics.bonusDistributionsToday}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Total 'BONUS_DISTRIBUTION' events</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: GLOBAL TREE EXPLORER */}
        <TabsContent value="explorer" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <Card className="bg-card/30 border-border/50 backdrop-blur-md">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Search className="size-4 text-emerald-400" />
                    Global Member Root Selector
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Search and select *any* user to inspect their downline tree structure.</p>
                </div>
                
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input 
                      placeholder="Type name or email of user..." 
                      value={rootSearchQuery}
                      onChange={(e) => {
                        setRootSearchQuery(e.target.value)
                        if (!e.target.value) setShowRootSearchDropdown(false)
                      }}
                      className="pl-9 h-9 text-xs" 
                    />
                    {rootSearchLoading && (
                      <span className="absolute right-3 top-2.5 size-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                    )}
                  </div>

                  {showRootSearchDropdown && rootSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-card/95 border border-border/60 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto backdrop-blur-lg">
                      {rootSearchResults.map(member => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectRootUser(member)}
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
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center text-xs text-muted-foreground bg-card/10 p-4 rounded-xl border border-border/30">
              <Info className="size-5 text-emerald-400 shrink-0 mr-3" />
              <p>Admins can drill down recursively to any depth in the binary tree by clicking the "Drill" button on any active card, or reset back up to a searched root.</p>
            </div>

          </div>

          {/* Path Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap bg-card/10 p-2.5 rounded-lg border border-border/30">
              <span className="font-bold text-[10px] uppercase text-emerald-500 tracking-wider">Explorer Path:</span>
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
            </div>
          )}

          {/* Interactive Tree graphical visualizer */}
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
                <div className="py-20 text-center text-xs text-muted-foreground border-dashed border border-border/30 rounded-xl w-full">
                  Please search and select a root user above to initialize explorer downline
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: MANUAL ADJUSTMENTS TOOL */}
        <TabsContent value="override" className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm max-w-3xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ArrowLeftRight className="size-4 text-amber-500" />
                Administrative Manual Volume Override
              </CardTitle>
              <CardDescription className="text-xs">
                Override or adjust a user's Personal Volume, Sponsor Volume, Team Volume, or Left/Right Leg Carry-Forwards. Adjustments are logged for transparency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApplyAdjustment} className="space-y-4">
                
                {/* Search Target User */}
                <div className="relative">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">Target Member</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search member name or email to adjust..." 
                      value={adjustSearchVal}
                      onChange={(e) => {
                        setAdjustSearchVal(e.target.value)
                        if (!e.target.value) setShowAdjustDropdown(false)
                      }}
                      className="pl-9 text-xs" 
                    />
                    {adjustSearchLoading && (
                      <span className="absolute right-3 top-2.5 size-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                    )}
                  </div>

                  {showAdjustDropdown && adjustSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-card/95 border border-border/60 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto backdrop-blur-lg">
                      {adjustSearchResults.map(member => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectAdjustUser(member)}
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
                </div>

                {selectedAdjustUser && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Selected Target</span>
                        <span className="text-xs font-bold text-emerald-400">{selectedAdjustUser.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">({selectedAdjustUser.email})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAdjustUser(null)}
                        className="text-[10px] h-6 text-rose-400 hover:text-rose-300 px-2 py-0"
                      >
                        Clear Selection
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* Left Leg */}
                      <div className="space-y-3 bg-background/35 p-3 rounded-lg border border-border/30">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Left Leg (BV)</p>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Total Vol Delta</label>
                          <Input
                            type="number"
                            value={leftVolDelta}
                            onChange={(e) => setLeftVolDelta(parseInt(e.target.value) || 0)}
                            className="font-mono text-xs h-8 mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Carry Forward Delta</label>
                          <Input
                            type="number"
                            value={leftCFDelta}
                            onChange={(e) => setLeftCFDelta(parseInt(e.target.value) || 0)}
                            className="font-mono text-xs h-8 mt-0.5"
                          />
                        </div>
                      </div>

                      {/* Right Leg */}
                      <div className="space-y-3 bg-background/35 p-3 rounded-lg border border-border/30">
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Right Leg (BV)</p>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Total Vol Delta</label>
                          <Input
                            type="number"
                            value={rightVolDelta}
                            onChange={(e) => setRightVolDelta(parseInt(e.target.value) || 0)}
                            className="font-mono text-xs h-8 mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Carry Forward Delta</label>
                          <Input
                            type="number"
                            value={rightCFDelta}
                            onChange={(e) => setRightCFDelta(parseInt(e.target.value) || 0)}
                            className="font-mono text-xs h-8 mt-0.5"
                          />
                        </div>
                      </div>

                      {/* Qualification Volume */}
                      <div className="space-y-3 bg-background/35 p-3 rounded-lg border border-border/30">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-sans">Accumulations (BV)</p>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Personal Vol (PV) Delta</label>
                          <Input
                            type="number"
                            value={pvDelta}
                            onChange={(e) => setPvDelta(parseInt(e.target.value) || 0)}
                            className="font-mono text-xs h-8 mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Sponsor Vol (BV) Delta</label>
                          <Input
                            type="number"
                            value={bvDelta}
                            onChange={(e) => setBvDelta(parseInt(e.target.value) || 0)}
                            className="font-mono text-xs h-8 mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Team Vol (TV) Delta</label>
                          <Input
                            type="number"
                            value={tvDelta}
                            onChange={(e) => setTvDelta(parseInt(e.target.value) || 0)}
                            className="font-mono text-xs h-8 mt-0.5"
                          />
                        </div>
                      </div>

                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Reason for Adjustment</label>
                      <Input
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="text-xs h-8"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={adjustSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
                    >
                      {adjustSubmitting ? (
                        <>
                          <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Applying Adjustments...
                        </>
                      ) : (
                        'Save & Apply Override Deltas'
                      )}
                    </Button>

                  </div>
                )}

              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: AUDIT LOGS LEDGER */}
        <TabsContent value="audit_logs" className="space-y-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">Binary Tree Mutation Ledger</CardTitle>
                <CardDescription className="text-xs">
                  Sovereign log audit trail of all binary volume, placement, rank, and adjustments.
                </CardDescription>
              </div>
              
              <div className="flex gap-2 self-start flex-wrap">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name/email..."
                    value={auditSearchQuery}
                    onChange={(e) => {
                      setAuditSearchQuery(e.target.value)
                      setAuditPage(1)
                    }}
                    className="pl-8 text-xs h-8"
                  />
                </div>
                
                <div className="flex items-center gap-1 bg-background/50 border border-border/30 rounded-lg px-2 py-0.5">
                  <ListFilter className="size-3.5 text-muted-foreground" />
                  <select
                    value={auditActionFilter}
                    onChange={(e) => {
                      setAuditActionFilter(e.target.value)
                      setAuditPage(1)
                    }}
                    className="bg-transparent border-none text-[10px] text-muted-foreground focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Actions</option>
                    <option value="PLACE">Placement (PLACE)</option>
                    <option value="VOLUME_UPDATE">Volume Updates</option>
                    <option value="BONUS_DISTRIBUTION">Bonus Payments</option>
                    <option value="RANK_UPGRADE">Rank Upgrades</option>
                    <option value="ADMIN_ADJUSTMENT">Admin Adjustments</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {auditLoading ? (
                <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
                  Loading ledger rows...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-20 text-center text-xs text-muted-foreground">
                  No matching logs found in system database
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-xs border-collapse w-full">
                    <TableHeader className="bg-muted/10">
                      <TableRow className="border-b border-border/30">
                        <TableHead className="py-3 pl-4 font-semibold text-muted-foreground text-left">Timestamp</TableHead>
                        <TableHead className="py-3 font-semibold text-muted-foreground text-left">Member Profile</TableHead>
                        <TableHead className="py-3 font-semibold text-muted-foreground text-left">Action Type</TableHead>
                        <TableHead className="py-3 font-semibold text-muted-foreground text-left">Operator</TableHead>
                        <TableHead className="py-3 pr-4 font-semibold text-muted-foreground text-right">Payload</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => {
                        const performedAt = new Date(log.performedAt).toLocaleString()
                        
                        let badgeColor = 'bg-slate-500/20 text-slate-400'
                        if (log.actionType === 'PLACE') badgeColor = 'bg-primary/20 text-primary'
                        if (log.actionType === 'VOLUME_UPDATE') badgeColor = 'bg-emerald-500/20 text-emerald-400'
                        if (log.actionType === 'BONUS_DISTRIBUTION') badgeColor = 'bg-violet-500/20 text-violet-400'
                        if (log.actionType === 'RANK_UPGRADE') badgeColor = 'bg-amber-500/20 text-amber-400'
                        if (log.actionType === 'ADMIN_ADJUSTMENT') badgeColor = 'bg-rose-500/20 text-rose-400 font-semibold'

                        return (
                          <TableRow 
                            key={log.id} 
                            onClick={() => openAuditDetails(log)}
                            className="border-b border-border/20 last:border-b-0 hover:bg-muted/10 cursor-pointer"
                          >
                            <TableCell className="py-2.5 pl-4 font-mono text-[10px] text-muted-foreground text-left">{performedAt}</TableCell>
                            <TableCell className="py-2.5 text-left">
                              <div className="font-semibold">{log.user?.name || 'Unknown'}</div>
                              <div className="text-[10px] text-muted-foreground">{log.user?.email || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="py-2.5 text-left">
                              <Badge className={`${badgeColor} text-[9px] px-1.5 py-0 border-none font-semibold uppercase tracking-wider`}>
                                {log.actionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 font-mono text-[10px] text-muted-foreground text-left">{log.performedBy || 'SYSTEM'}</TableCell>
                            <TableCell className="py-2.5 pr-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[9px] text-emerald-400 hover:text-emerald-300 px-2 py-0 border border-emerald-500/15 hover:bg-emerald-500/10"
                              >
                                View Payload &raquo;
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination controls */}
              {auditTotalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-border/30 text-xs">
                  <span className="text-muted-foreground font-mono">
                    Page {auditPage} of {auditTotalPages} ({auditTotal} logs)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditPage === 1}
                      onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                      className="h-8 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditPage === auditTotalPages}
                      onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                      className="h-8 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* NODE DETAILS MODAL */}
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

              {/* Action buttons inside Dialog */}
              <div className="flex gap-2.5 pt-3 border-t border-border/30 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close Profile
                </Button>
                {selectedNode.id !== activeRootId && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => {
                      setBreadcrumbs(prev => [...prev, { id: selectedNode.id, name: selectedNode.name }])
                      setActiveRootId(selectedNode.id)
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

      {/* AUDIT LOG DETAILS MODAL */}
      {selectedAuditLog && (
        <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
          <DialogContent className="max-w-xl bg-card border border-border/50 text-foreground rounded-xl">
            <DialogHeader className="pb-3 border-b border-border/30">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldAlert className="size-4 text-violet-400" />
                Ledger Transaction Payload Audit
              </DialogTitle>
              <DialogDescription className="text-xs">
                JSON parameters and delta mappings stored in transaction audit logs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3 text-[11px] bg-background/40 p-3 rounded-lg border border-border/20">
                <div>
                  <span className="text-muted-foreground block">Log Event ID:</span>
                  <span className="font-mono text-foreground font-bold">{selectedAuditLog.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Performed At:</span>
                  <span className="font-mono text-foreground font-bold">{new Date(selectedAuditLog.performedAt).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block">Member Name (Email):</span>
                  <span className="text-foreground font-bold">{selectedAuditLog.user?.name || 'N/A'}</span>
                  <span className="text-muted-foreground block text-[10px] font-mono">{selectedAuditLog.user?.email || 'N/A'}</span>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block">Event Action Type:</span>
                  <span className="font-mono text-emerald-400 font-bold uppercase">{selectedAuditLog.actionType}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1.5">Action Details Payload</span>
                <pre className="bg-black/60 border border-border/30 p-3 rounded-lg text-[10px] font-mono text-cyan-400 overflow-x-auto max-h-64 leading-normal select-text">
                  {JSON.stringify(selectedAuditLog.actionDetails, null, 2)}
                </pre>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-border/30 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAuditModalOpen(false)}
                >
                  Close Audit log
                </Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}