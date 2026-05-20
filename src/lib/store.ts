import { create } from 'zustand'

export type AppView = 'landing' | 'dashboard' | 'admin'
export type DashboardTab = 'earnings' | 'withdraw' | 'leaderboard' | 'challenges'
export type AdminTab = 'plans' | 'profits' | 'users' | 'settings' | 'withdrawals'

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
}

export interface UserData {
  id: string
  email: string
  name: string
  role: string
  referralCode: string
  walletAddress?: string
  balance: number
  totalEarnings: number
  totalDeposited: number
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  dashboardTab: 'earnings',
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
  logout: () => set({
    isAuthenticated: false,
    user: null,
    currentView: 'landing',
  }),
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setAuthMode: (mode) => set({ authMode: mode }),
}))
