'use client'

import { useState } from 'react'
import { useAppStore, type DashboardTab } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NotificationCenter } from './NotificationCenter'
import {
  LayoutDashboard,
  User,
  TrendingUp,
  Wallet,
  Users,
  Trophy,
  Target,
  MessageSquare,
  Newspaper,
  LogOut,
  Copy,
  Check,
  Menu,
  PiggyBank,
  CreditCard,
  ScrollText,
  Bell,
  Shield,
  Sparkles,
  Gift,
  Mic,
} from 'lucide-react'

interface NavItem {
  id: DashboardTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'earnings', label: 'My Earnings', icon: TrendingUp },
  { id: 'investment', label: 'Investment', icon: PiggyBank },
  { id: 'deposit', label: 'Deposit', icon: CreditCard },
  { id: 'withdraw', label: 'Withdrawal', icon: Wallet },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'mlm_rewards', label: 'Gifts & Rewards', icon: Trophy },
  { id: 'rewards', label: 'Rewards Store', icon: Sparkles, badge: 'NP' },
  { id: 'challenges', label: 'Competition', icon: Target },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'messages', label: 'Message Centre', icon: MessageSquare },
  { id: 'transactions', label: 'Transactions', icon: ScrollText },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'resources', label: 'Resources', icon: Gift },
  { id: 'help', label: 'Help Center', icon: Shield },
  { id: 'security', label: 'Security', icon: Shield },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, dashboardTab, setDashboardTab, logout, setTransferModalOpen } = useAppStore()
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    if (user?.referralCode) {
      await navigator.clipboard.writeText(user.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNavClick = (tab: DashboardTab) => {
    setDashboardTab(tab)
    onNavClick?.()
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const tradingBalance = user?.tradingBalance || 0
  const withdrawalBalance = user?.withdrawalBalance || 0

  return (
    <div className="flex h-full flex-col">
      {/* User Info */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-2 ring-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <NotificationCenter />
        </div>

        {/* Dual Wallet Display (My Wallet) */}
        <div className="rounded-xl border border-border/50 bg-card/30 p-3 space-y-3">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">💳 My Wallet</p>
          <div className="space-y-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-emerald-400 font-medium">Trading Wallet</span>
                <TrendingUp className="size-3 text-emerald-400/70" />
              </div>
              <p className="text-base font-bold text-emerald-400">${tradingBalance.toFixed(2)}</p>
            </div>

            <div className="rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-cyan-400 font-medium">Withdrawal Wallet</span>
                <Wallet className="size-3 text-cyan-400/70" />
              </div>
              <p className="text-base font-bold text-cyan-400">${withdrawalBalance.toFixed(2)}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setTransferModalOpen(true)}
            className="w-full h-8 gap-1.5 text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/></svg>
            Transfer Funds
          </Button>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {navItems.filter((item) => {
            if (item.id === 'mlm_rewards') {
              return (user?.teamVolume || 0) >= 1000
            }
            return true
          }).map((item) => {
            const isActive = dashboardTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium cyber-nav-item ${
                  isActive
                    ? 'active text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`size-4 ${isActive ? 'text-primary' : ''}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/20 text-amber-400 border-amber-500/30"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            )
          })}
      </nav>

      <Separator />

      {/* Referral Code */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Your Referral Code</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono tracking-wider">
            {user?.referralCode || 'N/A'}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={handleCopyCode}
          >
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Dashboard View Switcher (for admin, super_admin, leader, moderator, support) */}
      {user?.role && ['admin', 'super_admin', 'moderator', 'support', 'leader'].includes(user.role) && (
        <div className="px-4 pb-2">
          <label className="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Active View</label>
          <select 
            className="w-full bg-muted border border-border/50 text-[11px] rounded px-2 py-1.5 text-foreground cursor-pointer focus:outline-none"
            value={typeof window !== 'undefined' && window.location.pathname.startsWith('/leader') ? 'leader' : (typeof window !== 'undefined' && window.location.pathname.startsWith('/control-hub') ? 'admin' : 'user')}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'user') window.location.href = '/dashboard'
              if (val === 'admin') window.location.href = '/control-hub'
              if (val === 'leader') window.location.href = '/leader'
            }}
          >
            <option value="admin">🔧 Admin Console</option>
            <option value="user">👤 User Dashboard</option>
            <option value="leader">👑 Leader Dashboard</option>
          </select>
        </div>
      )}

      {/* Voice Control Launch Shortcut */}
      <div className="px-4 pb-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 group relative"
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'v' });
            window.dispatchEvent(event);
          }}
        >
          <Mic className="size-4 animate-pulse group-hover:scale-110 transition-transform text-amber-400" />
          Voice Control
          <span className="ml-auto text-[9px] font-mono border border-amber-500/35 px-1 py-0.5 rounded bg-amber-500/10">
            [V]
          </span>
        </Button>
      </div>

      {/* Logout */}
      <div className="p-4 pt-0">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="size-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}

export function UserSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col cyber-sidebar h-screen sticky top-0 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-40">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent onNavClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
