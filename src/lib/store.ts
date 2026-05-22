import { create } from 'zustand'

export type AppView = 'landing' | 'dashboard' | 'admin'
export type DashboardTab = 'overview' | 'profile' | 'earnings' | 'investment' | 'deposit' | 'withdraw' | 'team' | 'challenges' | 'leaderboard' | 'messages' | 'news' | 'transactions' | 'security'
export type AdminTab = 'plans' | 'profits' | 'users' | 'settings' | 'withdrawals' | 'payments' | 'challenges' | 'messages' | 'news' | 'notifications' | 'fakeProfiles' | 'tradingConfig' | 'kyc' | 'tickets' | 'activityLog' | 'testimonials' | 'promotions' | 'landingEditor' | 'cron' | 'deposits' | 'analytics' | 'withdrawalLimits' | 'systemHealth' | 'bulkOps' | 'geoBlocking' | 'notifTemplates'

interface AppState {
  // Navigation
  currentView: AppView
  dashboardTab: DashboardTab
  adminTab: AdminTab

  // Auth
  isAuthenticated: boolean
  user: UserData | null

  // Modals
  showAuthModal: boolean
  authMode: 'login' | 'register'

  // Actions
  setView: (view: AppView) => void
  setDashboardTab: (tab: DashboardTab) => void
  setAdminTab: (tab: AdminTab) => void
  login: (user: UserData) => void
  logout: () => void
  setShowAuthModal: (show: boolean) => void
  setAuthMode: (mode: 'login' | 'register') => void
  updateUserWallets: (tradingBalance: number, withdrawalBalance: number) => void
  updateUserProfile: (data: Partial<UserData>) => void
}

export interface UserData {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  referralCode: string
  walletAddress?: string
  tradingBalance: number
  withdrawalBalance: number
  totalEarnings: number
  totalDeposited: number
  planName?: string
  planCategory?: string
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  dashboardTab: 'overview',
  adminTab: 'plans',
  isAuthenticated: false,
  user: null,
  showAuthModal: false,
  authMode: 'login',

  setView: (view) => set({ currentView: view }),
  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  login: (user) => set({
    isAuthenticated: true,
    user,
    currentView: user.role === 'admin' ? 'admin' : 'dashboard',
    showAuthModal: false,
  }),
  logout: () => {
    // Clear session cookie via API
    fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
    localStorage.removeItem('autotrade_user')
    set({
      isAuthenticated: false,
      user: null,
      currentView: 'landing',
    })
    // Redirect to home
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  },
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setAuthMode: (mode) => set({ authMode: mode }),
  updateUserWallets: (tradingBalance, withdrawalBalance) => set((state) => ({
    user: state.user ? { ...state.user, tradingBalance, withdrawalBalance } : null,
  })),
  updateUserProfile: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null,
  })),
}))
