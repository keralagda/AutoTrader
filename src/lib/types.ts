export interface PlanType {
  id: string
  name: string
  entryFee: number
  minDeposit: number
  maxDeposit: number
  dailyEarningPercent: number
  maxEarningLimit: number
  isActive: boolean
}

export interface DepositType {
  id: string
  userId: string
  planId: string
  amount: number
  status: string
  earnedSoFar: number
  createdAt: string
  plan?: PlanType
}

export interface EarningType {
  id: string
  userId: string
  depositId?: string
  amount: number
  type: string
  level?: number
  createdAt: string
}

export interface WithdrawalType {
  id: string
  userId: string
  amount: number
  walletAddress: string
  status: string
  txHash?: string
  createdAt: string
}

export interface LeaderboardEntryType {
  id: string
  userId: string
  userName: string
  totalEarnings: number
  rank: number
  period: string
}

export interface ChallengeType {
  id: string
  title: string
  description: string
  reward: number
  startDate: string
  endDate: string
  isActive: boolean
}

export interface ReferralLevelType {
  level: number
  percent: number
  earnings: number
  count: number
}

export interface ProfitDistributionType {
  id: string
  depositId: string
  amount: number
  riskMode: string
  dayOfWeek: string
  createdAt: string
}

// Referral distribution percentages
export const REFERRAL_LEVELS = [
  { level: 1, percent: 25 },
  { level: 2, percent: 20 },
  { level: 3, percent: 15 },
  { level: 4, percent: 10 },
  { level: 5, percent: 10 },
  { level: 6, percent: 10 },
  { level: 7, percent: 10 },
]

// Platform distribution
export const PLATFORM_DISTRIBUTION = {
  accountHolder: 50,
  tradeProfitShare: 30,
  rewardsOffers: 15,
  platformFee: 5,
}

// Subscription fee distribution
export const SUBSCRIPTION_DISTRIBUTION = {
  referralAndProfit: 80,
  rewardsOffers: 15,
  platformFee: 5,
}

// Default plans
export const DEFAULT_PLANS = [
  {
    name: 'Starter',
    entryFee: 25,
    minDeposit: 100,
    maxDeposit: 1000,
    dailyEarningPercent: 6,
    maxEarningLimit: 1000,
  },
  {
    name: 'Silver',
    entryFee: 100,
    minDeposit: 100,
    maxDeposit: 2500,
    dailyEarningPercent: 8,
    maxEarningLimit: 2500,
  },
  {
    name: 'Gold',
    entryFee: 250,
    minDeposit: 100,
    maxDeposit: 5000,
    dailyEarningPercent: 10,
    maxEarningLimit: 5000,
  },
  {
    name: 'Platinum',
    entryFee: 500,
    minDeposit: 100,
    maxDeposit: 25000,
    dailyEarningPercent: 15,
    maxEarningLimit: 25000,
  },
]
