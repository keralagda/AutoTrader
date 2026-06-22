import { db } from '../src/lib/db'

async function main() {
  const plans = await db.plan.findMany({
    select: {
      id: true,
      name: true,
      entryFee: true,
      subscriptionReferralPercent: true,
      subscriptionRewardsPercent: true,
      subscriptionPlatformPercent: true,
    }
  })

  console.log('=== PLANS SUBSCRIPTION PERCENTAGES ===')
  console.dir(plans, { depth: null })
}

main().catch(console.error).finally(() => process.exit(0))
