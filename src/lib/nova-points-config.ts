import { db } from '@/lib/db'

// Default NP config
const DEFAULT_CONFIG = {
  conversionRate: 1000,
  xpPerLevel: 1000,
  checkin: {
    baseNP: 2, streak3NP: 5, streak5NP: 8, streak7NP: 12,
    streak3Bonus: 0.10, streak5Bonus: 0.25, streak7Bonus: 0.50,
    milestone7NP: 12, milestone7Bonus: 1.00, milestone30NP: 25, milestone30Bonus: 2.00,
  },
  gamification: {
    checkinBaseNP: 12, checkinStreakBonus: 3, streakUsdcDay: 7, streakUsdcAmount: 1,
  },
  challengeMultiplier: 0.25,
  storeItems: [],
  luckySpinPrizes: [{ amount: 0.10, weight: 30 }, { amount: 0.25, weight: 25 }, { amount: 0.50, weight: 20 }, { amount: 1, weight: 12 }, { amount: 2, weight: 8 }, { amount: 5, weight: 4 }, { amount: 10, weight: 1 }],
}

export async function loadNPConfig() {
  let resolvedDefault = DEFAULT_CONFIG
  try {
    const defaultTemplateSetting = await db.setting.findUnique({ where: { key: 'default_nova_points_config' } })
    if (defaultTemplateSetting) {
      resolvedDefault = { ...DEFAULT_CONFIG, ...JSON.parse(defaultTemplateSetting.value) }
    }
  } catch (err) {
    console.error('Failed to read default Nova Points template from DB:', err)
  }

  const setting = await db.setting.findUnique({ where: { key: 'nova_points_config' } })
  if (setting) {
    try { return { ...resolvedDefault, ...JSON.parse(setting.value) } } catch {}
  }
  return resolvedDefault
}
