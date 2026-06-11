'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AdminSidebar } from './AdminSidebar'
import { PlansTab } from './PlansTab'
import { ProfitsTab } from './ProfitsTab'
import { UsersTab } from './UsersTab'
import { WithdrawalsTab } from './WithdrawalsTab'
import { SettingsTab } from './SettingsTab'
import { PaymentGatewaysTab } from './PaymentGatewaysTab'
import { AdminChallengesTab } from './AdminChallengesTab'
import { AdminMessagesTab } from './AdminMessagesTab'
import { AdminNewsTab } from './AdminNewsTab'
import { AdminFakeNotificationsTab } from './AdminFakeNotificationsTab'
import { AdminFakeProfilesTab } from './AdminFakeProfilesTab'
import { AdminTradingConfigTab } from './AdminTradingConfigTab'
import { AdminKycTab } from './AdminKycTab'
import { AdminTicketsTab } from './AdminTicketsTab'
import { AdminActivityLogTab } from './AdminActivityLogTab'
import { AdminTestimonialsTab } from './AdminTestimonialsTab'
import { AdminPromotionsTab } from './AdminPromotionsTab'
import { AdminLandingEditorTab } from './AdminLandingEditorTab'
import { AdminCronTab } from './AdminCronTab'
import { AdminDepositsTab } from './AdminDepositsTab'
import { AdminAnalyticsTab } from './AdminAnalyticsTab'
import { AdminWithdrawalLimitsTab } from './AdminWithdrawalLimitsTab'
import { AdminSystemHealthTab } from './AdminSystemHealthTab'
import { AdminBulkOperationsTab } from './AdminBulkOperationsTab'
import { AdminGeoBlockingTab } from './AdminGeoBlockingTab'
import { AdminNotificationTemplatesTab } from './AdminNotificationTemplatesTab'
import { PageBuilderTab } from './PageBuilder'
import { AdminTemplatesTab } from './AdminTemplatesTab'
import { AdminDuplicatesTab } from './AdminDuplicatesTab'
import { AdminRiskCategoriesTab } from './AdminRiskCategoriesTab'
import { AdminReferralConfigTab } from './AdminReferralConfigTab'
import { AdminRolesTab } from './AdminRolesTab'
import { AdminChatbotTab } from './AdminChatbotTab'
import { AdminNovaPointsTab } from './AdminNovaPointsTab'
import { AdminLogicBuilderTab } from './AdminLogicBuilderTab'
import { AdminFeatureFlagsTab } from './AdminFeatureFlagsTab'
import { AdminEcommerceTab } from './AdminEcommerceTab'
import { AdminHelpCenter } from './AdminHelpCenter'
import { AdminEarningsTab } from './AdminEarningsTab'
import { AdminFinancialLogsTab } from './AdminFinancialLogsTab'
import { AdminVoiceNavigationTab } from './AdminVoiceNavigationTab'
import { AdminPdfBuilderTab } from './AdminPdfBuilderTab'
import { AdminTransferFundsTab } from './AdminTransferFundsTab'

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

    const handleRefresh = () => {
      loadStats()
    }
    window.addEventListener('admin-stats-refresh', handleRefresh)

    return () => {
      cancelled = true
      window.removeEventListener('admin-stats-refresh', handleRefresh)
    }
  }, [adminTab])

  const renderTab = () => {
    switch (adminTab) {
      case 'plans': return <PlansTab />
      case 'profits': return <ProfitsTab />
      case 'cron': return <AdminCronTab />
      case 'deposits': return <AdminDepositsTab />
      case 'challenges': return <AdminChallengesTab />
      case 'users': return <UsersTab />
      case 'kyc': return <AdminKycTab />
      case 'withdrawals': return <WithdrawalsTab />
      case 'payments': return <PaymentGatewaysTab />
      case 'tickets': return <AdminTicketsTab />
      case 'messages': return <AdminMessagesTab />
      case 'news': return <AdminNewsTab />
      case 'notifications': return <AdminFakeNotificationsTab />
      case 'fakeProfiles': return <AdminFakeProfilesTab />
      case 'tradingConfig': return <AdminTradingConfigTab />
      case 'testimonials': return <AdminTestimonialsTab />
      case 'promotions': return <AdminPromotionsTab />
      case 'landingEditor': return <AdminLandingEditorTab />
      case 'activityLog': return <AdminActivityLogTab />
      case 'settings': return <SettingsTab />
      case 'analytics': return <AdminAnalyticsTab />
      case 'withdrawalLimits': return <AdminWithdrawalLimitsTab />
      case 'systemHealth': return <AdminSystemHealthTab />
      case 'bulkOps': return <AdminBulkOperationsTab />
      case 'geoBlocking': return <AdminGeoBlockingTab />
      case 'notifTemplates': return <AdminNotificationTemplatesTab />
      case 'pageBuilder': return <PageBuilderTab />
      case 'templates': return <AdminTemplatesTab />
      case 'duplicates': return <AdminDuplicatesTab />
      case 'riskCategories': return <AdminRiskCategoriesTab />
      case 'referralConfig': return <AdminReferralConfigTab />
      case 'roles': return <AdminRolesTab />
      case 'chatbot': return <AdminChatbotTab />
      case 'novaPoints': return <AdminNovaPointsTab />
      case 'logicBuilder': return <AdminLogicBuilderTab />
      case 'featureFlags': return <AdminFeatureFlagsTab />
      case 'ecommerce': return <AdminEcommerceTab />
      case 'helpCenter': return <AdminHelpCenter />
      case 'earnings': return <AdminEarningsTab />
      case 'financialLogs': return <AdminFinancialLogsTab />
      case 'voiceNavigation': return <AdminVoiceNavigationTab />
      case 'pdfBuilder': return <AdminPdfBuilderTab />
      case 'transferFunds': return <AdminTransferFundsTab />
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
    <div className="min-h-screen flex bg-background cyber-mesh">
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
          <h1 className="text-lg font-bold text-foreground">BNFX Admin</h1>
        </div>

        <div className="p-4 lg:p-8 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {statCards.map(stat => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="cyber-card hover:border-emerald-500/20">
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
