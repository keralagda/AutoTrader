'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Shield, Activity, Wallet, Bot, Settings, MessageSquare, Zap } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Administrative controls and system oversight</p>
      </div>

      {/* Admin Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <Link href="/admin/binary-tree-analytics" className="block hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg p-2 bg-primary/20 text-primary">
                  <Activity className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                  Analytics
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Binary Tree Analytics</p>
              <p className="text-2xl font-bold mt-2">View Stats</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <Link href="/admin/users" className="block hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg p-2 bg-emerald-500/20 text-emerald-400">
                  <Users className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400">
                  Management
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">User Management</p>
              <p className="text-2xl font-bold mt-2">Manage Users</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <Link href="/admin/financial-logs" className="block hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg p-2 bg-amber-500/20 text-amber-400">
                  <Wallet className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400">
                  Financial
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Financial Logs</p>
              <p className="text-2xl font-bold mt-2">View Logs</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <Link href="/admin/settings" className="block hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg p-2 bg-violet-500/20 text-violet-400">
                  <Settings className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs bg-violet-500/20 text-violet-400">
                  Configuration
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">System Settings</p>
              <p className="text-2xl font-bold mt-2">Configure</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <Link href="/admin/notifications" className="block hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg p-2 bg-cyan-500/20 text-cyan-400">
                  <MessageSquare className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-400">
                  Communications
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Notifications</p>
              <p className="text-2xl font-bold mt-2">Manage Alerts</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <Link href="/admin/challenges" className="block hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg p-2 bg-rose-500/20 text-rose-400">
                  <Zap className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs bg-rose-500/20 text-rose-400">
                  Engagement
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Challenges</p>
              <p className="text-2xl font-bold mt-2">Manage Programs</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Connection</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Status</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Binary MLM Module</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}