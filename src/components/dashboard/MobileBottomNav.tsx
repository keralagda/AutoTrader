'use client'

import { useState } from 'react'
import { useAppStore, type DashboardTab } from '@/lib/store'
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Wallet,
  MoreHorizontal,
  User,
  Target,
  Trophy,
  MessageSquare,
  Newspaper,
  ScrollText,
  Shield,
  Users,
  X,
} from 'lucide-react'

const mainNavItems: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'deposit', label: 'Deposit', icon: CreditCard },
  { id: 'investment', label: 'Invest', icon: TrendingUp },
  { id: 'withdraw', label: 'Withdraw', icon: Wallet },
]

const moreNavItems: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'earnings', label: 'Earnings', icon: TrendingUp },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'challenges', label: 'Challenges', icon: Target },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'transactions', label: 'Transactions', icon: ScrollText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
]

export function MobileBottomNav() {
  const { dashboardTab, setDashboardTab } = useAppStore()
  const [showMore, setShowMore] = useState(false)

  const handleNav = (id: DashboardTab) => {
    setDashboardTab(id)
    setShowMore(false)
    // Haptic feedback on supported devices
    if (navigator.vibrate) navigator.vibrate(10)
  }

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-card border-t border-border/50 rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">More</h3>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {moreNavItems.map(item => {
                const Icon = item.icon
                const isActive = dashboardTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95 ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-t border-border/50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around px-1 py-1.5">
          {mainNavItems.map(item => {
            const isActive = dashboardTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all active:scale-90 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary" />
                )}
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                  <Icon className="size-5" />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all active:scale-90 ${
              moreNavItems.some(i => i.id === dashboardTab) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {moreNavItems.some(i => i.id === dashboardTab) && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary" />
            )}
            <MoreHorizontal className="size-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
