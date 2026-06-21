import { create } from 'zustand'

export type AppView = 'landing' | 'dashboard' | 'admin' | 'leader'
export type DashboardTab = 'overview' | 'profile' | 'earnings' | 'investment' | 'deposit' | 'withdraw' | 'team' | 'challenges' | 'leaderboard' | 'messages' | 'news' | 'transactions' | 'security' | 'rewards' | 'resources' | 'help' | 'mlm_rewards'
export type AdminTab = 'plans' | 'profits' | 'users' | 'settings' | 'withdrawals' | 'payments' | 'challenges' | 'messages' | 'news' | 'notifications' | 'fakeProfiles' | 'tradingConfig' | 'kyc' | 'tickets' | 'activityLog' | 'testimonials' | 'promotions' | 'landingEditor' | 'cron' | 'deposits' | 'analytics' | 'withdrawalLimits' | 'systemHealth' | 'bulkOps' | 'geoBlocking' | 'notifTemplates' | 'pageBuilder' | 'templates' | 'duplicates' | 'riskCategories' | 'referralConfig' | 'roles' | 'chatbot' | 'novaPoints' | 'logicBuilder' | 'featureFlags' | 'ecommerce' | 'helpCenter' | 'earnings' | 'financialLogs' | 'voiceNavigation' | 'pdfBuilder' | 'transferFunds' | 'mlmRewards' | 'emailVerifier'


interface AppState {
  // Navigation
  currentView: AppView
  dashboardTab: DashboardTab
  adminTab: AdminTab

  // Auth
  isAuthenticated: boolean
  user: UserData | null

  // Modals / Themes
  showAuthModal: boolean
  authMode: 'login' | 'register'
  transferModalOpen: boolean
  dashboardTheme: 'dark' | 'light-skeuo' | 'liquid-glass'

  // Actions
  setView: (view: AppView) => void
  setDashboardTab: (tab: DashboardTab) => void
  setAdminTab: (tab: AdminTab) => void
  login: (user: UserData) => void
  logout: () => void
  setShowAuthModal: (show: boolean) => void
  setAuthMode: (mode: 'login' | 'register') => void
  setTransferModalOpen: (open: boolean) => void
  setDashboardTheme: (theme: 'dark' | 'light-skeuo' | 'liquid-glass') => void
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
  isEmailVerified?: boolean
  hasTransactionPin?: boolean
  usdcBscAddress?: string
  usdcTronAddress?: string
  depositWallets?: string
  withdrawWallets?: string
  binaryTreePosition?: string
  binaryTreeParentId?: string | null
  binaryTreeLeftChildId?: string | null
  binaryTreeRightChildId?: string | null
  binaryTreeLeftVolume?: number
  binaryTreeRightVolume?: number
  binaryTreeLeftVolumeCarryForward?: number
  binaryTreeRightVolumeCarryForward?: number
  personalVolume?: number
  businessVolume?: number
  teamVolume?: number
  mlmRank?: string
  mlmLevel?: number
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  dashboardTab: 'overview',
  adminTab: 'plans',
  isAuthenticated: false,
  user: null,
  showAuthModal: false,
  authMode: 'login',
  transferModalOpen: false,
  dashboardTheme: (typeof window !== 'undefined' ? localStorage.getItem('dashboard_theme') as any : 'dark') || 'dark',

  setView: (view) => set({ currentView: view }),
  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  login: (user) => set({
    isAuthenticated: true,
    user,
    currentView: ['admin', 'super_admin', 'moderator', 'support'].includes(user.role)
      ? 'admin'
      : (user.role === 'leader' ? 'leader' : 'dashboard'),
    showAuthModal: false,
  }),
  logout: () => {
    // Clear session cookie via API then redirect
    fetch('/api/auth/session', { method: 'DELETE' })
      .catch(() => {})
      .finally(() => {
        localStorage.removeItem('bnfx_user')
        document.cookie = 'bnfx_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        window.location.href = '/'
      })
    set({ isAuthenticated: false, user: null, currentView: 'landing' })
  },
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setAuthMode: (mode) => set({ authMode: mode }),
  setTransferModalOpen: (open) => set({ transferModalOpen: open }),
  setDashboardTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_theme', theme)
    }
    set({ dashboardTheme: theme })
  },
  updateUserWallets: (tradingBalance, withdrawalBalance) => set((state) => ({
    user: state.user ? { ...state.user, tradingBalance, withdrawalBalance } : null,
  })),
  updateUserProfile: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null,
  })),
}))
