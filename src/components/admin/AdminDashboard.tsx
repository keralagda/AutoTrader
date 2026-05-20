'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AdminSidebar } from './AdminSidebar'
import { PlansTab } from './PlansTab'
import { ProfitsTab } from './ProfitsTab'
import { UsersTab } from './UsersTab'
import { WithdrawalsTab } from './WithdrawalsTab'
import { SettingsTab } from './SettingsTab'
import { Card, CardContent } from '@/components/ui/card'
import { Users, DollarSign, Clock, TrendingUp, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalUsers: number
  totalDeposits: number
  pendingWithdrawals: number
  platformEarnings: number
}

export function AdminDashboard() {
  const { adminTab } = useAppStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDeposits: 0,
    pendingWithdrawals: 0,
    platformEarnings: 0,
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        const [usersRes, withdrawalsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/withdrawals'),
        ])

        const users = usersRes.ok ? await usersRes.json() : []
        const withdrawals = withdrawalsRes.ok ? await withdrawalsRes.json() : []

        if (cancelled) return

        const totalUsers = users.length
        const totalDeposits = users.reduce((sum: number, u: any) => sum + (u.totalDeposited || 0), 0)
        const pendingWithdrawals = withdrawals
          .filter((w: any) => w.status === 'pending')
          .reduce((sum: number, w: any) => sum + (w.amount || 0), 0)
        const platformEarnings = users.reduce((sum: number, u: any) => sum + (u.totalEarnings || 0), 0)

        setStats({ totalUsers, totalDeposits, pendingWithdrawals, platformEarnings })
      } catch {
        // Stats will remain at default
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [])

  const renderTab = () => {
    switch (adminTab) {
      case 'plans': return <PlansTab />
      case 'profits': return <ProfitsTab />
      case 'users': return <UsersTab />
      case 'withdrawals': return <WithdrawalsTab />
      case 'settings': return <SettingsTab />
      default: return <PlansTab />
    }
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Total Deposits',
      value: `$${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Pending Withdrawals',
      value: `$${stats.pendingWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Platform Earnings',
      value: `$${stats.platformEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - always visible on lg, toggle on mobile */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-lg font-bold text-foreground">Auto Trade Admin</h1>
        </div>

        <div className="p-4 lg:p-8 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {statCards.map(stat => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="bg-card/50 border-border/50 hover:border-emerald-500/20 transition-colors">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                        <p className="text-lg lg:text-xl font-bold text-foreground truncate">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tab Content */}
          {renderTab()}
        </div>
      </div>
    </div>
  )
}
