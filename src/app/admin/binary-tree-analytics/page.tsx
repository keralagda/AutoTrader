'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Users, TrendingUp, Wallet, Activity, Zap } from 'lucide-react'

export default function BinaryTreeAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      console.error('Failed to fetch binary tree analytics:', err)
      setError('Failed to load binary tree analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="space-y-4">
            <div className="h-8 w-32 bg-muted rounded"></div>
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-8 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <h2 className="text-xl font-bold mb-4">Error Loading Analytics</h2>
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            setError(null)
            fetchAnalytics()
          }}
          className="btn btn-primary mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">No Data Available</h2>
        <p className="text-muted-foreground">No binary tree analytics data found.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Binary MLM Analytics Dashboard</h1>
        <p className="text-muted-foreground">Real-time insights into your binary tree structure and performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg p-2 bg-primary/20 text-primary">
                <Users className="size-4" />
              </div>
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                Total Users
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Total Registered Users</p>
            <p className="text-2xl font-bold">{data.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg p-2 bg-emerald-500/20 text-emerald-400">
                <Activity className="size-4" />
              </div>
              <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400">
                Today's Activity
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Audit Logs Today</p>
            <p className="text-2xl font-bold">{data.auditMetrics.auditLogsToday}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg p-2 bg-cyan-500/20 text-cyan-400">
                <TrendingUp className="size-4" />
              </div>
              <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-400">
                Tree Balance
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Balance Ratio (Lower = Better)</p>
            <p className="text-2xl font-bold">{data.treeStructure.balanceRatio.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.treeStructure.balanceRatio === 0 ? 'Perfectly Balanced' : 'Some Imbalance'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg p-2 bg-violet-500/20 text-violet-400">
                <Wallet className="size-4" />
              </div>
              <Badge variant="secondary" className="text-xs bg-violet-500/20 text-violet-400">
                Volume Statistics
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Total Left Volume</p>
            <p className="text-2xl font-bold">{data.volumeStatistics.leftVolume.total.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tree Structure */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tree Structure Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="font-medium">Root Users (No Parent)</p>
              <p className="text-lg font-bold">{data.treeStructure.rootUsers}</p>
            </div>
            <div className="space-y-3">
              <p className="font-medium">Users with Left Child Only</p>
              <p className="text-lg font-bold">{data.treeStructure.usersWithLeftChild}</p>
            </div>
            <div className="space-y-3">
              <p className="font-medium">Users with Right Child Only</p>
              <p className="text-lg font-bold">{data.treeStructure.usersWithRightChild}</p>
            </div>
            <div className="space-y-3">
              <p className="font-medium">Users with Both Children</p>
              <p className="text-lg font-bold">{data.treeStructure.usersWithBothChildren}</p>
            </div>
            <div className="space-y-3">
              <p className="font-medium">Users with No Children (Leaf Nodes)</p>
              <p className="text-lg font-bold">{data.treeStructure.usersWithNoChildren}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Statistics */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Volume Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Left Volume</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-mono">{data.volumeStatistics.leftVolume.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-mono">{data.volumeStatistics.leftVolume.average.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Right Volume</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-mono">{data.volumeStatistics.rightVolume.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-mono">{data.volumeStatistics.rightVolume.average.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Left Carry Forward</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-mono">{data.volumeStatistics.leftCarryForward.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-mono">{data.volumeStatistics.leftCarryForward.average.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Right Carry Forward</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-mono">{data.volumeStatistics.rightCarryForward.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-mono">{data.volumeStatistics.rightCarryForward.average.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Metrics */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Audit Activity (Totals)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-t pt-4">
              <p className="font-medium mb-2">Placement Events</p>
              <p className="text-lg font-bold text-primary">{data.auditMetrics.placementsToday}</p>
              <p className="text-xs text-muted-foreground">Total 'PLACE' actions logged</p>
            </div>
            <div className="border-t pt-4">
              <p className="font-medium mb-2">Volume Updates</p>
              <p className="text-lg font-bold text-emerald-400">{data.auditMetrics.volumeUpdatesToday}</p>
              <p className="text-xs text-muted-foreground">Total 'VOLUME_UPDATE' actions logged</p>
            </div>
            <div className="border-t pt-4">
              <p className="font-medium mb-2">Bonus Distributions</p>
              <p className="text-lg font-bold text-violet-400">{data.auditMetrics.bonusDistributionsToday}</p>
              <p className="text-xs text-muted-foreground">Total 'BONUS_DISTRIBUTION' actions logged</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}