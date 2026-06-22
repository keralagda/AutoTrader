import { db } from '../src/lib/db'

async function main() {
  console.log('=== PLANS ===')
  const plans = await db.plan.findMany({
    include: {
      referralRules: true
    }
  })
  console.log(JSON.stringify(plans, null, 2))

  console.log('=== USERS ===')
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      referredById: true,
      tradingBalance: true,
      withdrawalBalance: true,
      totalEarnings: true,
      totalDeposited: true,
      isActive: true,
      isFake: true,
      createdAt: true
    }
  })
  console.log(JSON.stringify(users, null, 2))
}

main().catch(console.error).finally(() => process.exit(0))
