import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEarningType(type: string, hasDeposit?: boolean): string {
  const map: Record<string, string> = {
    daily: 'Trade Bonus',
    referral: 'Referral Reward',
    profit_share: 'Team Profit Share',
    rank_promotion_bonus: 'Leadership Rank Bonus',
    binary_pairing_bonus: 'Binary Pairing Reward',
    binary_cycle_bonus: 'Binary Cycle Reward',
    binary_flush_bonus: 'Binary Flush Reward',
    bonus: 'System Bonus',
    platform_fee: hasDeposit ? 'Trade Bonus (Platform Split)' : 'Referral Reward (Platform Split)',
    rewards: hasDeposit ? 'Trade Bonus (Rewards Split)' : 'Referral Reward (Rewards Split)',
    charity: hasDeposit ? 'Trade Bonus (Charity Split)' : 'Referral Reward (Charity Split)',
    developer_fee: hasDeposit ? 'Trade Bonus (Developer Split)' : 'Referral Reward (Developer Split)',
    liquidity_pool: hasDeposit ? 'Trade Bonus (Liquidity Split)' : 'Referral Reward (Liquidity Split)',
    subtract: 'Debit Adjustment'
  }
  
  if (type in map) return map[type]

  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
