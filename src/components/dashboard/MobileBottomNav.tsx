'use client'

import { useAppStore, type DashboardTab } from '@/lib/store'
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Wallet,
  User,
} from 'lucide-react'

const navItems: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'deposit', label: 'Deposit', icon: CreditCard },
  { id: 'investment', label: 'Invest', icon: TrendingUp },
  { id: 'withdraw', label: 'Withdraw', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: User },
]

export function MobileBottomNav() {
  const { dashboardTab, setDashboardTab } = useAppStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(item => {
          const isActive = dashboardTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setDashboardTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className={`size-5 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
