import { db } from '../src/lib/db'

async function main() {
  console.log('Seeding plans...')

  const plans = [
    {
      id: 'daily-flash',
      name: 'Daily Flash',
      description: 'Daily Flash Plan - Starter Tier',
      entryFee: 100,
      minDeposit: 100,
      maxDeposit: 1000,
      dailyEarningPercent: 1.375,
      maxEarningLimit: 2000,
      maxEarningMultiplier: 2.0,
      durationDays: 400,
      capitalReturn: 'included',
      isBinaryMlmEnabled: true,
      binaryDailyPairingCap: 50, // 50 pairs * $10 = $500 cap
      binaryPairingBonusPercent: 10,
      binarySpilloverPlacement: 'balanced',
      lowRiskMin: 0.75,
      lowRiskMax: 2.0,
      mediumRiskMin: 0.75,
      mediumRiskMax: 2.0,
      highRiskMin: 0.75,
      highRiskMax: 2.0,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'nova-vector',
      name: 'Nova Vector',
      description: 'Nova Vector Plan - Intermediate Tier',
      entryFee: 250,
      minDeposit: 100,
      maxDeposit: 5000,
      dailyEarningPercent: 2.0,
      maxEarningLimit: 10000,
      maxEarningMultiplier: 2.0,
      durationDays: 400,
      capitalReturn: 'included',
      isBinaryMlmEnabled: true,
      binaryDailyPairingCap: 100, // 100 pairs * $10 = $1000 cap
      binaryPairingBonusPercent: 10,
      binarySpilloverPlacement: 'balanced',
      lowRiskMin: 1.0,
      lowRiskMax: 3.0,
      mediumRiskMin: 1.0,
      mediumRiskMax: 3.0,
      highRiskMin: 1.0,
      highRiskMax: 3.0,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'nova-nexus',
      name: 'Nova Nexus',
      description: 'Nova Nexus Plan - Advanced Tier',
      entryFee: 500,
      minDeposit: 100,
      maxDeposit: 10000,
      dailyEarningPercent: 2.75,
      maxEarningLimit: 20000,
      maxEarningMultiplier: 2.0,
      durationDays: 0,
      capitalReturn: 'end',
      isBinaryMlmEnabled: true,
      binaryDailyPairingCap: 250, // 250 pairs * $10 = $2500 cap
      binaryPairingBonusPercent: 10,
      binarySpilloverPlacement: 'balanced',
      lowRiskMin: 1.5,
      lowRiskMax: 4.0,
      mediumRiskMin: 1.5,
      mediumRiskMax: 4.0,
      highRiskMin: 1.5,
      highRiskMax: 4.0,
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'nova-royale',
      name: 'Nova Royale',
      description: 'Nova Royale Plan - VIP Tier',
      entryFee: 1000,
      minDeposit: 100,
      maxDeposit: 100000,
      dailyEarningPercent: 3.5,
      maxEarningLimit: 200000,
      maxEarningMultiplier: 2.0,
      durationDays: 0,
      capitalReturn: 'end',
      isBinaryMlmEnabled: true,
      binaryDailyPairingCap: 500, // 500 pairs * $10 = $5000 cap
      binaryPairingBonusPercent: 10,
      binarySpilloverPlacement: 'balanced',
      lowRiskMin: 2.0,
      lowRiskMax: 5.0,
      mediumRiskMin: 2.0,
      mediumRiskMax: 5.0,
      highRiskMin: 2.0,
      highRiskMax: 5.0,
      isActive: true,
      sortOrder: 4,
      referralRules: [
        { level: 1, commission: 5, amount: 0, type: 'registration', enabled: true }
      ]
    },
    {
      id: 'nova-supreme',
      name: 'Nova Supreme',
      description: 'Nova Supreme Plan - Elite Tier',
      entryFee: 2500,
      minDeposit: 100,
      maxDeposit: 250000,
      dailyEarningPercent: 4.25,
      maxEarningLimit: 500000,
      maxEarningMultiplier: 2.0,
      durationDays: 400,
      capitalReturn: 'end',
      isBinaryMlmEnabled: true,
      binaryDailyPairingCap: 1000, // 1000 pairs * $10 = $10000 cap
      binaryPairingBonusPercent: 10,
      binarySpilloverPlacement: 'balanced',
      binaryCarryForward: true,
      binaryFlushBonusEnabled: true,
      binaryFlushBonusPercent: 10,
      binaryFlushBonusThreshold: 200,
      binaryCycleEnabled: true,
      binaryCycleRatio: '1:1',
      binaryCycleBonusPercent: 10,
      binaryPvRatio: 1.0,
      binaryBvRatio: 1.0,
      binaryTvRatio: 1.0,
      lowRiskMin: 2.5,
      lowRiskMax: 6.0,
      mediumRiskMin: 2.5,
      mediumRiskMax: 6.0,
      highRiskMin: 2.5,
      highRiskMax: 6.0,
      isActive: true,
      sortOrder: 5,
      referralRules: [
        { level: 1, commission: 10, amount: 0, type: 'registration', enabled: true }
      ]
    }
  ]

  for (const p of plans) {
    const data = { ...p } as any
    const id = data.id
    delete data.id

    const rules = data.referralRules
    delete data.referralRules

    const existing = await db.plan.findUnique({ where: { id } })
    if (existing) {
      await db.plan.update({
        where: { id },
        data
      })
      console.log(`Updated plan: ${p.name}`)
    } else {
      await db.plan.create({
        data: {
          id,
          ...data
        }
      })
      console.log(`Created plan: ${p.name}`)
    }

    if (rules) {
      // Upsert rules
      for (const rule of rules) {
        await db.planReferralRule.upsert({
          where: {
            planId_level_type: {
              planId: id,
              level: rule.level,
              type: rule.type
            }
          },
          update: {
            commission: rule.commission,
            amount: rule.amount,
            enabled: rule.enabled
          },
          create: {
            planId: id,
            level: rule.level,
            commission: rule.commission,
            amount: rule.amount,
            type: rule.type,
            enabled: rule.enabled
          }
        })
      }
    }
  }

  console.log('Seeding plans complete.')
}

main().catch(err => {
  console.error(err)
})
