'use client'

import { useAppStore, type AdminTab } from '@/lib/store'
import { Settings, TrendingUp, Users, Wallet, Wrench, ArrowLeft, LogOut, Shield, CreditCard, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems: { tab: AdminTab; label: string; icon: React.ElementType }[] = [
  { tab: 'plans', label: 'Plan Builder', icon: Settings },
  { tab: 'profits', label: 'Add Profits', icon: TrendingUp },
  { tab: 'challenges', label: 'Challenges & Badges', icon: Target },
  { tab: 'users', label: 'Users', icon: Users },
  { tab: 'withdrawals', label: 'Withdrawals', icon: Wallet },
  { tab: 'payments', label: 'Payments', icon: CreditCard },
  { tab: 'settings', label: 'Settings', icon: Wrench },
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
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ tab, label, icon: Icon }) => (
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
      </nav>

      <Separator className="bg-border/50" />

      {/* Bottom Actions */}
      <div className="p-3 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => setView('dashboard')}
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
