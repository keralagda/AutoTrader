export interface PlanType {
  id: string
  name: string
  description?: string
  entryFee: number
  minDeposit: number
  maxDeposit: number
  dailyEarningPercent: number
  maxEarningLimit: number
  // Time-based Plan Configuration
  returnType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'after_end'
  returnPeriodHours: number
  totalReturnPercent: number
  durationDays: number
  capitalReturn: 'included' | 'end' | 'none'
  repeatCount: number
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
  
  // Customization & Capping Fields
  depositMultipleOf?: number
  strictMultiples?: boolean
  dailyEarningCapPercent?: number
  cappingAppliesTo?: string
  registrationReferralLevels?: number

  // Advanced Profit & Loss Configuration
  minLossPercent?: number
  maxLossPercent?: number
  allowNegativeBalance?: boolean
  maxConsecutiveLossDays?: number
  drawdownLimit?: number
  profitTarget?: number
  hedgingRatio?: number
  lossLimitAction?: string
  pnlLogicDescription?: string

  // Extra Fund-Sharing Percentages
  charityDonationPercent?: number
  insuranceReservePercent?: number
  developerFundPercent?: number
  liquidityPoolPercent?: number

  // Scheduling & Limits
  profitDays?: string
  profitHours?: string
  holidayPauses?: string
  gracePeriodDays?: number
  autoReinvest?: boolean
  reinvestBonus?: number
  minReinvestAmount?: number
  reinvestLockPeriod?: number
  customReferralPct?: number
  volatilityMode?: string
  lossDayChance?: number
  bonusDayChance?: number
  minVipTier?: string
  spotsLimit?: number
  planBadge?: string
  teamRequirement?: number
  countdownEnd?: string

  isActive: boolean
  sortOrder: number
  referralRules?: any[]

  // Binary MLM Configuration
  isBinaryMlmEnabled?: boolean
  binaryPairingBonusPercent?: number
  binaryPairingBonusType?: 'percent' | 'fixed'
  binaryPairingBonusFixed?: number
  binaryMatchingType?: 'weaker_leg' | 'both_legs' | 'stronger_leg'
  binaryDailyPairingCap?: number
  binaryWeeklyPairingCap?: number
  binaryCarryForward?: boolean
  binarySpilloverPlacement?: 'left' | 'right' | 'balanced' | 'cycle_fill'
  binaryDepthLimit?: number
  binaryFlushBonusEnabled?: boolean
  binaryFlushBonusPercent?: number
  binaryFlushBonusThreshold?: number
  binaryCycleEnabled?: boolean
  binaryCycleRatio?: string
  binaryCycleBonusPercent?: number
  binaryCycleBonusType?: 'percent' | 'fixed'
  binaryCycleBonusFixed?: number
  binaryPvRatio?: number
  binaryBvRatio?: number
  binaryTvRatio?: number
  mlmRewardsConfig?: string | null
  mlmPoolsConfig?: string | null
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
  category: ChallengeCategory
  challengeType: ChallengeTypeKind
  targetValue: number
  reward: number
  xpReward: number
  badgeIcon: string
  difficulty: ChallengeDifficulty
  colorTheme: ChallengeColorTheme
  streakBased: boolean
  requireStreakDays: number
  bonusMultiplier: number
  isRecurring: boolean
  recurrencePeriod: RecurrencePeriod
  startDate: string
  endDate?: string | null
  isActive: boolean
  sortOrder: number
}

export interface UserChallengeType {
  id: string
  userId: string
  challengeId: string
  progress: number
  completed: boolean
  claimed: boolean
  startedAt: string
  completedAt?: string | null
  streakCount: number
  lastProgressAt?: string | null
  challenge?: ChallengeType
}

export interface UserStatsType {
  id: string
  userId: string
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  lastCheckIn?: string | null
  totalCheckIns: number
  challengesCompleted: number
  challengesClaimed: number
  totalXpEarned: number
  totalUsdcRewards: number
}

export interface BadgeType {
  id: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  rarity: BadgeRarity
  xpRequired: number
  condition: string
  colorTheme: string
  isActive: boolean
}

export interface UserBadgeType {
  id: string
  userId: string
  badgeId: string
  earnedAt: string
  badge?: BadgeType
}

export interface DailyCheckInType {
  id: string
  userId: string
  checkDate: string
  xpEarned: number
  bonusEarned: number
  streakDay: number
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
  type: string // "crypto" or "indian" or "manual"
  network?: string
  address?: string
  apiKey?: string
  apiSecret?: string
  webhookUrl?: string
  minAmount: number
  maxAmount: number
  feePercent: number
  isActive: boolean
  sortOrder: number
  qrImage?: string
  instructions?: string
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

// ─── Gamification Enums & Constants ────────────────────────────────

export type ChallengeCategory = 'daily' | 'weekly' | 'milestone' | 'special' | 'streak' | 'referral' | 'deposit'
export type ChallengeTypeKind = 'target' | 'streak' | 'action'
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'elite'
export type ChallengeColorTheme = 'emerald' | 'amber' | 'cyan' | 'rose' | 'violet'
export type RecurrencePeriod = 'none' | 'daily' | 'weekly' | 'monthly'
export type BadgeCategory = 'achievement' | 'milestone' | 'streak' | 'social' | 'special'
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// Challenge Category Labels
export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, { label: string; icon: string; color: string }> = {
  daily: { label: 'Daily', icon: '📅', color: 'emerald' },
  weekly: { label: 'Weekly', icon: '📆', color: 'cyan' },
  milestone: { label: 'Milestone', icon: '🏆', color: 'amber' },
  special: { label: 'Special Event', icon: '⭐', color: 'rose' },
  streak: { label: 'Streak', icon: '🔥', color: 'violet' },
  referral: { label: 'Referral', icon: '👥', color: 'cyan' },
  deposit: { label: 'Deposit', icon: '💰', color: 'emerald' },
}

// Difficulty Labels
export const DIFFICULTY_LABELS: Record<ChallengeDifficulty, { label: string; color: string; stars: number }> = {
  easy: { label: 'Easy', color: 'text-emerald-400', stars: 1 },
  medium: { label: 'Medium', color: 'text-amber-400', stars: 2 },
  hard: { label: 'Hard', color: 'text-rose-400', stars: 3 },
  elite: { label: 'Elite', color: 'text-violet-400', stars: 4 },
}

// Badge Rarity Labels
export const BADGE_RARITY_LABELS: Record<BadgeRarity, { label: string; color: string; bgClass: string; borderClass: string }> = {
  common: { label: 'Common', color: 'text-gray-400', bgClass: 'bg-gray-500/20', borderClass: 'border-gray-500/30' },
  uncommon: { label: 'Uncommon', color: 'text-emerald-400', bgClass: 'bg-emerald-500/20', borderClass: 'border-emerald-500/30' },
  rare: { label: 'Rare', color: 'text-cyan-400', bgClass: 'bg-cyan-500/20', borderClass: 'border-cyan-500/30' },
  epic: { label: 'Epic', color: 'text-violet-400', bgClass: 'bg-violet-500/20', borderClass: 'border-violet-500/30' },
  legendary: { label: 'Legendary', color: 'text-amber-400', bgClass: 'bg-amber-500/20', borderClass: 'border-amber-500/30' },
}

// XP Level System
export const XP_PER_LEVEL = 1000 // XP needed per level
export const XP_CHECKIN_BASE = 50 // Base XP for daily check-in
export const XP_CHECKIN_STREAK_BONUS = 10 // Extra XP per streak day
export const CHECKIN_USDC_BONUS_STREAK = 7 // Get USDC bonus every N streak days
export const CHECKIN_USC_BONUS_AMOUNT = 5 // USDC bonus amount

export function xpForLevel(level: number): number {
  return level * XP_PER_LEVEL
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXp(xp)
  const currentLevelXp = (level - 1) * XP_PER_LEVEL
  const current = xp - currentLevelXp
  const needed = XP_PER_LEVEL
  return { current, needed, percent: Math.min((current / needed) * 100, 100) }
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
    minDeposit: 50,
    maxDeposit: 1000,
    dailyEarningPercent: 6,
    maxEarningLimit: 1000,
    returnType: 'daily' as const,
    returnPeriodHours: 24,
    totalReturnPercent: 0,
    durationDays: 0,
    capitalReturn: 'included' as const,
    repeatCount: 0,
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
    returnType: 'daily' as const,
    returnPeriodHours: 24,
    totalReturnPercent: 0,
    durationDays: 30,
    capitalReturn: 'end' as const,
    repeatCount: 0,
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
    returnType: 'daily' as const,
    returnPeriodHours: 24,
    totalReturnPercent: 0,
    durationDays: 60,
    capitalReturn: 'end' as const,
    repeatCount: 0,
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
    returnType: 'daily' as const,
    returnPeriodHours: 24,
    totalReturnPercent: 0,
    durationDays: 90,
    capitalReturn: 'end' as const,
    repeatCount: 0,
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
  // HYIPLab-style new plan types
  {
    name: 'Hourly Flash',
    description: 'Fast-paced hourly returns for active traders. Perfect for those who want to see earnings grow quickly.',
    entryFee: 50,
    minDeposit: 50,
    maxDeposit: 5000,
    dailyEarningPercent: 1,
    maxEarningLimit: 5000,
    returnType: 'hourly' as const,
    returnPeriodHours: 1,
    totalReturnPercent: 0,
    durationDays: 7,
    capitalReturn: 'end' as const,
    repeatCount: 0,
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
    earningMechanism: 'Hourly earnings at 1% per hour (24% daily equivalent). 7-day plan with principal returned at end.',
    withdrawalRule: 'No lock-in. Earnings credited every hour. Principal returned after 7 days.',
    stackingRule: 'Single deposit only per plan.',
    sortOrder: 5,
  },
  {
    name: 'Weekly Wealth',
    description: 'Weekly payout plan for investors who prefer less frequent but larger returns.',
    entryFee: 200,
    minDeposit: 500,
    maxDeposit: 50000,
    dailyEarningPercent: 20,
    maxEarningLimit: 50000,
    returnType: 'weekly' as const,
    returnPeriodHours: 168,
    totalReturnPercent: 0,
    durationDays: 28,
    capitalReturn: 'end' as const,
    repeatCount: 4,
    stackingEnabled: true,
    maxStacks: 2,
    stackingBonusPercent: 5,
    lockPeriodDays: 7,
    autoCompound: false,
    earlyExitPenalty: 20,
    accountHolderPercent: 50,
    tradeProfitSharePercent: 30,
    rewardsOffersPercent: 15,
    platformFeePercent: 5,
    subscriptionReferralPercent: 80,
    subscriptionRewardsPercent: 15,
    subscriptionPlatformPercent: 5,
    earningMechanism: 'Weekly payouts of 20% of deposit. 4 total payouts over 28 days. Principal returned after final payout.',
    withdrawalRule: '7-day lock-in. Early exit penalty of 20% on earned amount.',
    stackingRule: 'Up to 2 simultaneous deposits. Each stack earns 5% bonus on weekly payout.',
    sortOrder: 6,
  },
  {
    name: 'Fixed Return',
    description: 'One-time payout at the end of the term. Highest total return for patient investors.',
    entryFee: 300,
    minDeposit: 1000,
    maxDeposit: 100000,
    dailyEarningPercent: 0,
    maxEarningLimit: 200000,
    returnType: 'after_end' as const,
    returnPeriodHours: 720,
    totalReturnPercent: 150,
    durationDays: 30,
    capitalReturn: 'included' as const,
    repeatCount: 1,
    stackingEnabled: false,
    maxStacks: 1,
    stackingBonusPercent: 0,
    lockPeriodDays: 30,
    autoCompound: false,
    earlyExitPenalty: 50,
    accountHolderPercent: 50,
    tradeProfitSharePercent: 30,
    rewardsOffersPercent: 15,
    platformFeePercent: 5,
    subscriptionReferralPercent: 80,
    subscriptionRewardsPercent: 15,
    subscriptionPlatformPercent: 5,
    earningMechanism: 'One-time 150% return after 30 days. Total includes your principal. Example: $1000 becomes $2500.',
    withdrawalRule: '30-day lock-in. Early exit penalty of 50% on total returns.',
    stackingRule: 'Single deposit only per plan.',
    sortOrder: 7,
  },
]

// Default Challenges for seed
export const DEFAULT_CHALLENGES = [
  // Daily Challenges
  {
    title: 'Daily Check-In',
    description: 'Check in every day to earn NP and keep your streak alive. Consecutive days earn bonus NP!',
    category: 'daily',
    challengeType: 'action',
    targetValue: 1,
    reward: 0,
    xpReward: 50,
    badgeIcon: '📅',
    difficulty: 'easy',
    colorTheme: 'emerald',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: true,
    recurrencePeriod: 'daily',
    sortOrder: 1,
  },
  {
    title: 'Daily Depositor',
    description: 'Make at least one deposit today to earn bonus NP and move up the leaderboard.',
    category: 'daily',
    challengeType: 'target',
    targetValue: 1,
    reward: 2,
    xpReward: 75,
    badgeIcon: '💰',
    difficulty: 'easy',
    colorTheme: 'emerald',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: true,
    recurrencePeriod: 'daily',
    sortOrder: 2,
  },
  // Weekly Challenges
  {
    title: 'Weekly Warrior',
    description: 'Complete 5 daily check-ins this week to earn a substantial NP bonus and USDC reward.',
    category: 'weekly',
    challengeType: 'target',
    targetValue: 5,
    reward: 10,
    xpReward: 300,
    badgeIcon: '⚔️',
    difficulty: 'medium',
    colorTheme: 'cyan',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: true,
    recurrencePeriod: 'weekly',
    sortOrder: 3,
  },
  {
    title: 'Weekly Deposit Goal',
    description: 'Deposit a total of $500 or more this week to unlock this challenge reward.',
    category: 'weekly',
    challengeType: 'target',
    targetValue: 500,
    reward: 25,
    xpReward: 500,
    badgeIcon: '🎯',
    difficulty: 'medium',
    colorTheme: 'cyan',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: true,
    recurrencePeriod: 'weekly',
    sortOrder: 4,
  },
  // Streak Challenges
  {
    title: '7-Day Streak',
    description: 'Check in for 7 consecutive days to earn a streak bonus! Missing a day resets your progress.',
    category: 'streak',
    challengeType: 'streak',
    targetValue: 7,
    reward: 15,
    xpReward: 500,
    badgeIcon: '🔥',
    difficulty: 'medium',
    colorTheme: 'violet',
    streakBased: true,
    requireStreakDays: 7,
    bonusMultiplier: 1,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 5,
  },
  {
    title: '30-Day Legend',
    description: 'Maintain a 30-day check-in streak to achieve legendary status and earn a massive reward.',
    category: 'streak',
    challengeType: 'streak',
    targetValue: 30,
    reward: 100,
    xpReward: 3000,
    badgeIcon: '🌟',
    difficulty: 'elite',
    colorTheme: 'violet',
    streakBased: true,
    requireStreakDays: 30,
    bonusMultiplier: 2,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 6,
  },
  // Milestone Challenges
  {
    title: 'First Deposit',
    description: 'Make your very first deposit on BNFX to kickstart your earning journey!',
    category: 'milestone',
    challengeType: 'action',
    targetValue: 1,
    reward: 10,
    xpReward: 200,
    badgeIcon: '🎉',
    difficulty: 'easy',
    colorTheme: 'amber',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 7,
  },
  {
    title: 'Earn $100',
    description: 'Accumulate $100 in total earnings across all your plans.',
    category: 'milestone',
    challengeType: 'target',
    targetValue: 100,
    reward: 20,
    xpReward: 500,
    badgeIcon: '💯',
    difficulty: 'medium',
    colorTheme: 'amber',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 8,
  },
  {
    title: 'Earn $1,000',
    description: 'Reach $1,000 in total earnings. A true trader milestone!',
    category: 'milestone',
    challengeType: 'target',
    targetValue: 1000,
    reward: 75,
    xpReward: 1500,
    badgeIcon: '🏆',
    difficulty: 'hard',
    colorTheme: 'amber',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 9,
  },
  {
    title: 'Earn $10,000',
    description: 'Accumulate $10,000 in total earnings. You are among the elite traders on the platform.',
    category: 'milestone',
    challengeType: 'target',
    targetValue: 10000,
    reward: 500,
    xpReward: 5000,
    badgeIcon: '👑',
    difficulty: 'elite',
    colorTheme: 'amber',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 2,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 10,
  },
  // Referral Challenges
  {
    title: 'Refer 3 Friends',
    description: 'Invite 3 friends to join BNFX using your referral code and earn a bonus.',
    category: 'referral',
    challengeType: 'target',
    targetValue: 3,
    reward: 25,
    xpReward: 400,
    badgeIcon: '👥',
    difficulty: 'medium',
    colorTheme: 'cyan',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 11,
  },
  {
    title: 'Refer 10 Friends',
    description: 'Build your network! Refer 10 friends to become a Referral Champion.',
    category: 'referral',
    challengeType: 'target',
    targetValue: 10,
    reward: 100,
    xpReward: 1500,
    badgeIcon: '🤝',
    difficulty: 'hard',
    colorTheme: 'cyan',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1.5,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 12,
  },
  // Deposit Challenges
  {
    title: 'Power Depositor',
    description: 'Make a single deposit of $1,000 or more in any plan to unlock Power Depositor status.',
    category: 'deposit',
    challengeType: 'target',
    targetValue: 1000,
    reward: 30,
    xpReward: 600,
    badgeIcon: '💎',
    difficulty: 'hard',
    colorTheme: 'emerald',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 1,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 13,
  },
  {
    title: 'Whale Deposit',
    description: 'Deposit $10,000 or more in a single transaction. True whales earn true rewards.',
    category: 'deposit',
    challengeType: 'target',
    targetValue: 10000,
    reward: 200,
    xpReward: 2000,
    badgeIcon: '🐋',
    difficulty: 'elite',
    colorTheme: 'emerald',
    streakBased: false,
    requireStreakDays: 0,
    bonusMultiplier: 2,
    isRecurring: false,
    recurrencePeriod: 'none',
    sortOrder: 14,
  },
]

// Default Badges for seed
export const DEFAULT_BADGES = [
  {
    name: 'First Steps',
    description: 'Made your first deposit on BNFX',
    icon: '👶',
    category: 'achievement',
    rarity: 'common',
    xpRequired: 0,
    condition: 'Make your first deposit',
    colorTheme: 'emerald',
  },
  {
    name: 'Rising Star',
    description: 'Reached Level 5 on BNFX',
    icon: '⭐',
    category: 'achievement',
    rarity: 'uncommon',
    xpRequired: 4000,
    condition: 'Reach Level 5 (earn 4,000 NP)',
    colorTheme: 'amber',
  },
  {
    name: 'Streak Starter',
    description: 'Maintained a 7-day check-in streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'uncommon',
    xpRequired: 0,
    condition: 'Check in for 7 consecutive days',
    colorTheme: 'violet',
  },
  {
    name: 'Streak Master',
    description: 'Maintained a 30-day check-in streak',
    icon: '🌟',
    category: 'streak',
    rarity: 'epic',
    xpRequired: 0,
    condition: 'Check in for 30 consecutive days',
    colorTheme: 'violet',
  },
  {
    name: 'Network Builder',
    description: 'Referred 3 friends to BNFX',
    icon: '👥',
    category: 'social',
    rarity: 'uncommon',
    xpRequired: 0,
    condition: 'Refer 3 friends using your referral code',
    colorTheme: 'cyan',
  },
  {
    name: 'Social Butterfly',
    description: 'Referred 10 friends to BNFX',
    icon: '🦋',
    category: 'social',
    rarity: 'rare',
    xpRequired: 0,
    condition: 'Refer 10 friends using your referral code',
    colorTheme: 'cyan',
  },
  {
    name: 'Century Club',
    description: 'Earned $100 in total earnings',
    icon: '💯',
    category: 'milestone',
    rarity: 'uncommon',
    xpRequired: 0,
    condition: 'Accumulate $100 in total earnings',
    colorTheme: 'amber',
  },
  {
    name: 'Thousandaire',
    description: 'Earned $1,000 in total earnings',
    icon: '🏆',
    category: 'milestone',
    rarity: 'rare',
    xpRequired: 0,
    condition: 'Accumulate $1,000 in total earnings',
    colorTheme: 'amber',
  },
  {
    name: 'Crypto Whale',
    description: 'Deposited $10,000 or more in a single transaction',
    icon: '🐋',
    category: 'milestone',
    rarity: 'epic',
    xpRequired: 0,
    condition: 'Make a single deposit of $10,000+',
    colorTheme: 'emerald',
  },
  {
    name: 'Veteran Trader',
    description: 'Reached Level 10 on BNFX',
    icon: '🎖️',
    category: 'achievement',
    rarity: 'rare',
    xpRequired: 9000,
    condition: 'Reach Level 10 (earn 9,000 NP)',
    colorTheme: 'amber',
  },
  {
    name: 'Elite Trader',
    description: 'Reached Level 25 on BNFX',
    icon: '👑',
    category: 'achievement',
    rarity: 'epic',
    xpRequired: 24000,
    condition: 'Reach Level 25 (earn 24,000 NP)',
    colorTheme: 'amber',
  },
  {
    name: 'Legendary',
    description: 'Reached Level 50 on BNFX. A true legend!',
    icon: '🐉',
    category: 'achievement',
    rarity: 'legendary',
    xpRequired: 49000,
    condition: 'Reach Level 50 (earn 49,000 NP)',
    colorTheme: 'amber',
  },
  {
    name: 'Challenge Champion',
    description: 'Completed 10 challenges',
    icon: '🥇',
    category: 'achievement',
    rarity: 'rare',
    xpRequired: 0,
    condition: 'Complete 10 challenges',
    colorTheme: 'emerald',
  },
  {
    name: 'Challenge Legend',
    description: 'Completed 50 challenges',
    icon: '🏅',
    category: 'achievement',
    rarity: 'legendary',
    xpRequired: 0,
    condition: 'Complete 50 challenges',
    colorTheme: 'emerald',
  },
  {
    name: 'Early Adopter',
    description: 'Joined BNFX during the launch period',
    icon: '🚀',
    category: 'special',
    rarity: 'uncommon',
    xpRequired: 0,
    condition: 'Register during the platform launch period',
    colorTheme: 'rose',
  },
]

// Payment method options
export const CRYPTO_PAYMENT_METHODS = [
  { value: 'crypto_usdc', label: 'USDC (Polygon)', icon: '₮' },
  { value: 'crypto_btc', label: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'crypto_eth', label: 'Ethereum (ETH)', icon: 'Ξ' },
]

export const INDIAN_PAYMENT_METHODS = [
  { value: 'wire_eu', label: 'EU Wire Transfer (SEPA)', icon: '🇪🇺' },
  { value: 'wire_us', label: 'US Wire Transfer (ACH/Fedwire)', icon: '🇺🇸' },
  { value: 'bank_transfer', label: 'International Wire (SWIFT)', icon: '🏦' },
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

export interface UserType {
  id: string
  email: string
  name: string
  role: string
  referralCode: string
  referredById?: string | null
  tradingBalance: number
  withdrawalBalance: number
  totalEarnings: number
  totalDeposited: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  binaryTreePosition?: string
  binaryTreeParentId?: string | null
  binaryTreeLeftChildId?: string | null
  binaryTreeRightChildId?: string | null
  binaryTreeLeftVolume?: number
  binaryTreeRightVolume?: number
  binaryTreeLeftVolumeCarryForward?: number
  binaryTreeRightVolumeCarryForward?: number
  autoUpgradeEnabled?: boolean
  autoUpgradePercent?: number
  autoUpgradeAccumulated?: number
  autoUpgradeTargetPlanId?: string | null
  autoInvestmentEnabled?: boolean
}
