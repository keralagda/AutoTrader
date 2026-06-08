'use client'

import { useAppStore, type AdminTab } from '@/lib/store'
import { Settings, TrendingUp, Users, Wallet, Wrench, ArrowLeft, LogOut, Shield, CreditCard, Target, MessageSquare, Newspaper, Bell, UserPlus, Activity, ShieldCheck, LifeBuoy, ScrollText, Star, Megaphone, Layout, Clock, Banknote, BarChart3, DollarSign, PieChart, Zap, FileText, AlertCircle, Palette, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems: { tab: AdminTab; label: string; icon: React.ElementType; group: string }[] = [
  // 📊 Dashboard & Analytics
  { tab: 'analytics', label: 'Analytics', icon: BarChart3, group: 'dashboard' },
  { tab: 'systemHealth', label: 'System Health', icon: Activity, group: 'dashboard' },

  // 👥 User Management
  { tab: 'users', label: 'All Users', icon: Users, group: 'users' },
  { tab: 'roles', label: 'Roles & Permissions', icon: Shield, group: 'users' },
  { tab: 'kyc', label: 'KYC Verification', icon: ShieldCheck, group: 'users' },
  { tab: 'riskCategories', label: 'Risk Categories', icon: Shield, group: 'users' },
  { tab: 'duplicates', label: 'Duplicate Check', icon: AlertCircle, group: 'users' },
  { tab: 'bulkOps', label: 'Bulk Operations', icon: Zap, group: 'users' },
  { tab: 'fakeProfiles', label: 'Fake Profiles', icon: UserPlus, group: 'users' },

  // 💰 Financial
  { tab: 'deposits', label: 'Deposit Approvals', icon: Banknote, group: 'finance' },
  { tab: 'earnings', label: 'Investment Approvals', icon: TrendingUp, group: 'finance' },
  { tab: 'withdrawals', label: 'Withdrawals', icon: Wallet, group: 'finance' },
  { tab: 'withdrawalLimits', label: 'Limits & Fees', icon: DollarSign, group: 'finance' },
  { tab: 'payments', label: 'Payment Gateways', icon: CreditCard, group: 'finance' },
  { tab: 'profits', label: 'Manual Profits', icon: TrendingUp, group: 'finance' },
  { tab: 'financialLogs', label: '5W1H Ledger', icon: ScrollText, group: 'finance' },


  // 📈 Trading & Plans
  { tab: 'plans', label: 'Plan Builder', icon: Settings, group: 'trading' },
  { tab: 'tradingConfig', label: 'Trading Config', icon: Activity, group: 'trading' },
  { tab: 'logicBuilder', label: 'Logic Builder', icon: Zap, group: 'trading' },
  { tab: 'referralConfig', label: 'Referral System', icon: Users, group: 'trading' },
  { tab: 'cron', label: 'Auto Profits (Cron)', icon: Clock, group: 'trading' },

  // 🎨 Site Builder
  { tab: 'templates', label: 'Templates', icon: Palette, group: 'site' },
  { tab: 'pageBuilder', label: 'Page Builder', icon: Layout, group: 'site' },
  { tab: 'landingEditor', label: 'Landing Sections', icon: Layout, group: 'site' },
  { tab: 'pdfBuilder', label: 'PDF Flyer Builder', icon: FileText, group: 'site' },

  // 📝 Content
  { tab: 'news', label: 'News', icon: Newspaper, group: 'content' },
  { tab: 'promotions', label: 'Promotions', icon: Megaphone, group: 'content' },
  { tab: 'testimonials', label: 'Testimonials', icon: Star, group: 'content' },
  { tab: 'challenges', label: 'Challenges & Badges', icon: Target, group: 'content' },
  { tab: 'novaPoints', label: 'Nova Points Pool', icon: Star, group: 'content' },
  { tab: 'ecommerce', label: 'Ecommerce / Products', icon: Target, group: 'content' },
  { tab: 'notifications', label: 'Fake Notifications', icon: Bell, group: 'content' },

  // 🛟 Support
  { tab: 'tickets', label: 'Support Tickets', icon: LifeBuoy, group: 'support' },
  { tab: 'messages', label: 'Messages', icon: MessageSquare, group: 'support' },
  { tab: 'chatbot', label: 'Nova AI Chatbot', icon: MessageSquare, group: 'support' },
  { tab: 'activityLog', label: 'Activity Log', icon: ScrollText, group: 'support' },

  // ⚙️ Settings
  { tab: 'settings', label: 'General Settings', icon: Wrench, group: 'system' },
  { tab: 'voiceNavigation', label: 'Voice Commands', icon: Mic, group: 'system' },
  { tab: 'featureFlags', label: 'Feature Flags', icon: Shield, group: 'system' },
  { tab: 'helpCenter', label: 'Help Center', icon: LifeBuoy, group: 'system' },
  { tab: 'geoBlocking', label: 'Geo-Blocking', icon: Shield, group: 'system' },
  { tab: 'notifTemplates', label: 'Notification Templates', icon: Bell, group: 'system' },
]

export function AdminSidebar() {
  const { adminTab, setAdminTab, user, logout, setView } = useAppStore()

  return (
    <aside className="w-64 min-h-screen cyber-sidebar flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Admin Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <img src="/bnfx-logo-dark.png" alt="BNFX" className="h-10 w-10 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'users', label: '👥 Users' },
          { key: 'finance', label: '💰 Financial' },
          { key: 'trading', label: '📈 Trading & Plans' },
          { key: 'site', label: '🎨 Site Builder' },
          { key: 'content', label: '📝 Content' },
          { key: 'support', label: '🛟 Support' },
          { key: 'system', label: '⚙️ Settings' },
        ].map((group, gi) => {
          const items = navItems.filter(i => i.group === group.key)
          if (items.length === 0) return null
          return (
            <div key={group.key}>
              {gi > 0 && <Separator className="bg-border/50 my-2" />}
              <div className="space-y-0.5">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
                {items.map(({ tab, label, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => setAdminTab(tab)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium cyber-nav-item',
                      adminTab === tab
                        ? 'active text-emerald-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', adminTab === tab ? 'text-emerald-400' : 'text-muted-foreground')} />
                    {label}
                    {adminTab === tab && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
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
          className="w-full justify-start gap-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 group"
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'v' });
            window.dispatchEvent(event);
          }}
        >
          <Mic className="h-4 w-4 text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
          Voice Control
          <span className="ml-auto text-[9px] font-mono border border-amber-500/35 px-1 py-0.5 rounded bg-amber-500/10">
            [V]
          </span>
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
