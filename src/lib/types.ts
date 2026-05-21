export interface PlanType {
  id: string
  name: string
  description?: string
  entryFee: number
  minDeposit: number
  maxDeposit: number
  dailyEarningPercent: number
  maxEarningLimit: number
  // Advanced Plan Builder Fields
  stackingEnabled: boolean
  maxStacks: number
  stackingBonusPercent: number
  lockPeriodDays: number
  autoCompound: boolean
  earlyExitPenalty: number
  // Distribution Rules
  accountHolderPercent: number
  tradeProfitSharePercent: number
  rewardsOffersPercent: number
  platformFeePercent: number
  // Subscription Distribution
  subscriptionReferralPercent: number
  subscriptionRewardsPercent: number
  subscriptionPlatformPercent: number
  // Plan Logic Description
  earningMechanism?: string
  withdrawalRule?: string
  stackingRule?: string
  isActive: boolean
  sortOrder: number
}

export interface DepositType {
  id: string
  userId: string
  planId: string
  amount: number
  status: string
  earnedSoFar: number
  stackIndex: number
  lockedUntil?: string | null
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
  walletTarget: string
  createdAt: string
}

export interface WithdrawalType {
  id: string
  userId: string
  amount: number
  walletAddress: string
  status: string
  txHash?: string
  paymentMethod?: string
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
  operation: string // "add" or "subtract"
  reason?: string
  createdAt: string
}

export interface PaymentGatewayType {
  id: string
  name: string
  type: string // "crypto" or "indian"
  network?: string
  address?: string
  apiKey?: string
  minAmount: number
  maxAmount: number
  feePercent: number
  isActive: boolean
  sortOrder: number
}

export interface PaymentType {
  id: string
  userId: string
  amount: number
  method: string
  status: string
  txHash?: string
  upiRef?: string
  gatewayRef?: string
  planId?: string
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

// Default plans with advanced fields
export const DEFAULT_PLANS = [
  {
    name: 'Starter',
    description: 'Perfect for beginners looking to start their trading journey with steady, reliable returns.',
    entryFee: 25,
    minDeposit: 100,
    maxDeposit: 1000,
    dailyEarningPercent: 6,
    maxEarningLimit: 1000,
    stackingEnabled: false,
    maxStacks: 1,
    stackingBonusPercent: 0,
    lockPeriodDays: 0,
    autoCompound: false,
    earlyExitPenalty: 0,
    accountHolderPercent: 50,
    tradeProfitSharePercent: 30,
    rewardsOffersPercent: 15,
    platformFeePercent: 5,
    subscriptionReferralPercent: 80,
    subscriptionRewardsPercent: 15,
    subscriptionPlatformPercent: 5,
    earningMechanism: 'Daily earnings at 6% of deposit, capped at $1,000 total. Earnings accrue Monday to Friday.',
    withdrawalRule: 'Earnings available for withdrawal anytime. No lock-in period.',
    stackingRule: 'Single deposit only per Starter plan.',
    sortOrder: 1,
  },
  {
    name: 'Silver',
    description: 'For intermediate investors seeking higher returns with moderate stacking flexibility.',
    entryFee: 100,
    minDeposit: 100,
    maxDeposit: 2500,
    dailyEarningPercent: 8,
    maxEarningLimit: 2500,
    stackingEnabled: true,
    maxStacks: 2,
    stackingBonusPercent: 1,
    lockPeriodDays: 7,
    autoCompound: false,
    earlyExitPenalty: 5,
    accountHolderPercent: 50,
    tradeProfitSharePercent: 30,
    rewardsOffersPercent: 15,
    platformFeePercent: 5,
    subscriptionReferralPercent: 80,
    subscriptionRewardsPercent: 15,
    subscriptionPlatformPercent: 5,
    earningMechanism: 'Daily earnings at 8% of deposit, capped at $2,500 total. Trading days: Monday to Friday.',
    withdrawalRule: '7-day lock-in on principal. Early exit incurs 5% penalty on earnings.',
    stackingRule: 'Up to 2 simultaneous deposits. Each additional stack earns 1% bonus on daily rate.',
    sortOrder: 2,
  },
  {
    name: 'Gold',
    description: 'Advanced plan with generous stacking, auto-compound option, and premium earning rates.',
    entryFee: 250,
    minDeposit: 100,
    maxDeposit: 5000,
    dailyEarningPercent: 10,
    maxEarningLimit: 5000,
    stackingEnabled: true,
    maxStacks: 3,
    stackingBonusPercent: 2,
    lockPeriodDays: 14,
    autoCompound: true,
    earlyExitPenalty: 10,
    accountHolderPercent: 50,
    tradeProfitSharePercent: 30,
    rewardsOffersPercent: 15,
    platformFeePercent: 5,
    subscriptionReferralPercent: 80,
    subscriptionRewardsPercent: 15,
    subscriptionPlatformPercent: 5,
    earningMechanism: 'Daily earnings at 10% of deposit, capped at $5,000 total. Auto-compound available to reinvest earnings.',
    withdrawalRule: '14-day lock-in. Early exit penalty of 10% on earned amount. Auto-compound earnings locked for cycle.',
    stackingRule: 'Up to 3 stacks allowed. Stack 2 gets +2% daily bonus, Stack 3 gets +4% daily bonus.',
    sortOrder: 3,
  },
  {
    name: 'Platinum',
    description: 'Elite tier with maximum stacking power, highest returns, and VIP distribution benefits.',
    entryFee: 500,
    minDeposit: 100,
    maxDeposit: 25000,
    dailyEarningPercent: 15,
    maxEarningLimit: 25000,
    stackingEnabled: true,
    maxStacks: 5,
    stackingBonusPercent: 3,
    lockPeriodDays: 30,
    autoCompound: true,
    earlyExitPenalty: 15,
    accountHolderPercent: 50,
    tradeProfitSharePercent: 30,
    rewardsOffersPercent: 15,
    platformFeePercent: 5,
    subscriptionReferralPercent: 80,
    subscriptionRewardsPercent: 15,
    subscriptionPlatformPercent: 5,
    earningMechanism: 'Daily earnings at 15% of deposit, capped at $25,000 total. Auto-compound with accelerated returns on stacks.',
    withdrawalRule: '30-day lock-in. Early exit penalty of 15% on earned. VIP withdrawal processing.',
    stackingRule: 'Up to 5 stacks. Each stack adds +3% daily bonus. Max potential: 27% daily on Stack 5.',
    sortOrder: 4,
  },
]

// Payment method options
export const CRYPTO_PAYMENT_METHODS = [
  { value: 'crypto_usdc', label: 'USDC (Polygon)', icon: '₮' },
  { value: 'crypto_btc', label: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'crypto_eth', label: 'Ethereum (ETH)', icon: 'Ξ' },
]

export const INDIAN_PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI', icon: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer (NEFT/IMPS)', icon: '🏦' },
  { value: 'razorpay', label: 'Razorpay (Cards/Wallets)', icon: 'RP' },
]

export const ALL_PAYMENT_METHODS = [...CRYPTO_PAYMENT_METHODS, ...INDIAN_PAYMENT_METHODS]

// Distribution constants for landing page
export const PLATFORM_DISTRIBUTION = {
  accountHolder: 50,
  tradeProfitShare: 30,
  rewardsOffers: 15,
  platformFee: 5,
}

export const SUBSCRIPTION_DISTRIBUTION = {
  referralAndProfit: 80,
  rewardsOffers: 15,
  platformFee: 5,
}
