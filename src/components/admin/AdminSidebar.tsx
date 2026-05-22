'use client'

import { useAppStore, type AdminTab } from '@/lib/store'
import { Settings, TrendingUp, Users, Wallet, Wrench, ArrowLeft, LogOut, Shield, CreditCard, Target, MessageSquare, Newspaper, Bell, UserPlus, Activity, ShieldCheck, LifeBuoy, ScrollText, Star, Megaphone, Layout, Clock, Banknote, BarChart3, DollarSign, PieChart, Zap, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems: { tab: AdminTab; label: string; icon: React.ElementType; group: string }[] = [
  // Platform Management
  { tab: 'plans', label: 'Plan Builder', icon: Settings, group: 'platform' },
  { tab: 'profits', label: 'Add Profits', icon: TrendingUp, group: 'platform' },
  { tab: 'cron', label: 'Auto Profits (Cron)', icon: Clock, group: 'platform' },
  { tab: 'deposits', label: 'Deposit Confirm', icon: Banknote, group: 'platform' },
  
  // User Management
  { tab: 'users', label: 'Users', icon: Users, group: 'users' },
  { tab: 'kyc', label: 'KYC Verification', icon: ShieldCheck, group: 'users' },
  { tab: 'fakeProfiles', label: 'Fake Profiles', icon: UserPlus, group: 'users' },
  { tab: 'bulkOps', label: 'Bulk Operations', icon: Zap, group: 'users' },
  
  // Financial Management
  { tab: 'withdrawals', label: 'Withdrawals', icon: Wallet, group: 'finance' },
  { tab: 'withdrawalLimits', label: 'Withdrawal Limits', icon: DollarSign, group: 'finance' },
  { tab: 'payments', label: 'Payment Gateways', icon: CreditCard, group: 'finance' },
  
  // Content Management
  { tab: 'challenges', label: 'Challenges & Badges', icon: Target, group: 'content' },
  { tab: 'testimonials', label: 'Testimonials', icon: Star, group: 'content' },
  { tab: 'promotions', label: 'Promotions', icon: Megaphone, group: 'content' },
  { tab: 'landingEditor', label: 'Landing Page', icon: Layout, group: 'content' },
  { tab: 'news', label: 'News', icon: Newspaper, group: 'content' },
  { tab: 'notifications', label: 'Fake Notifications', icon: Bell, group: 'content' },
  
  // Trading Configuration
  { tab: 'tradingConfig', label: 'Trading Config', icon: Activity, group: 'trading' },
  
  // Support & Analytics
  { tab: 'tickets', label: 'Support Tickets', icon: LifeBuoy, group: 'support' },
  { tab: 'messages', label: 'Messages', icon: MessageSquare, group: 'support' },
  { tab: 'activityLog', label: 'Activity Log', icon: ScrollText, group: 'support' },
  { tab: 'analytics', label: 'Analytics', icon: BarChart3, group: 'analytics' },
  { tab: 'systemHealth', label: 'System Health', icon: Activity, group: 'analytics' },
  
  // System Settings
  { tab: 'settings', label: 'Settings', icon: Wrench, group: 'system' },
  { tab: 'geoBlocking', label: 'Geo-Blocking', icon: Shield, group: 'system' },
  { tab: 'notifTemplates', label: 'Notif Templates', icon: Bell, group: 'system' },
]

export function AdminSidebar() {
  const { adminTab, setAdminTab, user, logout, setView } = useAppStore()

  return (
    <aside className="w-64 min-h-screen bg-card/80 border-r border-border/50 flex flex-col backdrop-blur-sm">
      {/* Admin Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-emerald-500/50">
            <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
              <Shield className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{user?.name || 'Admin'}</p>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Admin
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Platform Management */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Management</p>
          {navItems.filter(i => i.group === 'platform').map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                adminTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground'
              )} />
              {label}
              {adminTab === tab && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* User Management */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Management</p>
          {navItems.filter(i => i.group === 'users').map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                adminTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground'
              )} />
              {label}
              {adminTab === tab && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* Financial Management */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Management</p>
          {navItems.filter(i => i.group === 'finance').map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                adminTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground'
              )} />
              {label}
              {adminTab === tab && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* Content Management */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Management</p>
          {navItems.filter(i => i.group === 'content').map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                adminTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground'
              )} />
              {label}
              {adminTab === tab && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* Trading Configuration */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trading Configuration</p>
          {navItems.filter(i => i.group === 'trading').map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                adminTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground'
              )} />
              {label}
              {adminTab === tab && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* Support & Analytics */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Support & Analytics</p>
          {navItems.filter(i => i.group === 'support' || i.group === 'analytics').map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                adminTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground'
              )} />
              {label}
              {adminTab === tab && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* System Settings */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Settings</p>
          {navItems.filter(i => i.group === 'system').map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                adminTab === tab
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground'
              )} />
              {label}
              {adminTab === tab && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <Separator className="bg-border/50" />

      {/* Bottom Actions */}
      <div className="p-3 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => { window.location.href = '/dashboard' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
