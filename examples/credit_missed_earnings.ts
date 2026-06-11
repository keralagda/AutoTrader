import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('--- Starting Missed Earnings Recovery Script ---')

  // Find all active/locked deposits
  const deposits = await db.deposit.findMany({
    where: {
      status: { in: ['active', 'locked'] },
    },
    include: { plan: true, user: true },
  })

  console.log(`Found ${deposits.length} active/locked deposits to review.`)

  const now = new Date()

  for (const deposit of deposits) {
    const user = deposit.user
    const plan = deposit.plan

    // Calculate days elapsed since deposit was created
    const createdTime = new Date(deposit.createdAt).getTime()
    const daysElapsed = Math.floor((now.getTime() - createdTime) / (24 * 60 * 60 * 1000))

    // Determine how many days of profit are expected vs actual
    const expectedDays = daysElapsed
    const actualDays = deposit.profitCount
    const missedDays = expectedDays - actualDays

    console.log(`Deposit ID: ${deposit.id} | User: ${user.name} (${user.email})`)
    console.log(`  Created: ${deposit.createdAt.toISOString()} (${daysElapsed} days ago)`)
    console.log(`  Expected profit runs: ${expectedDays} | Actual: ${actualDays} | Missed: ${missedDays}`)

    if (missedDays > 0) {
      console.log(`  --> Processing ${missedDays} missed days...`)

      // Calculate daily return percent: plan.dailyEarningPercent
      // Stacking bonus
      const stackingBonus = plan.stackingEnabled && deposit.stackIndex > 1
        ? plan.stackingBonusPercent * (deposit.stackIndex - 1)
        : 0
      
      const dailyPercent = plan.dailyEarningPercent + stackingBonus
      const dailyProfitUSD = (deposit.amount * dailyPercent) / 100

      // Calculate user's share (accountHolderPercent)
      const accountHolderPct = plan.accountHolderPercent ?? 50
      const investorShare = (dailyProfitUSD * accountHolderPct) / 100

      const totalMissedEarning = investorShare * missedDays

      if (totalMissedEarning > 0) {
        console.log(`  --> Crediting $${totalMissedEarning.toFixed(2)} to user's trading wallet ($${investorShare.toFixed(2)}/day for ${missedDays} days)`)

        // Update user: increment tradingBalance and totalEarnings, ensure isActive is true
        const userBefore = user.tradingBalance
        const userAfter = userBefore + totalMissedEarning

        await db.user.update({
          where: { id: user.id },
          data: {
            tradingBalance: { increment: totalMissedEarning },
            totalEarnings: { increment: totalMissedEarning },
            isActive: true,
          },
        })

        // Update deposit: increment earnedSoFar and profitCount, set lastProfitAt to now
        await db.deposit.update({
          where: { id: deposit.id },
          data: {
            earnedSoFar: { increment: totalMissedEarning },
            profitCount: { increment: missedDays },
            lastProfitAt: now,
          },
        })

        // Create Earning records for each missed day
        for (let i = 0; i < missedDays; i++) {
          const dateOfEarning = new Date(createdTime + (actualDays + i) * 24 * 60 * 60 * 1000)
          await db.earning.create({
            data: {
              userId: user.id,
              depositId: deposit.id,
              amount: investorShare,
              type: 'daily',
              walletTarget: 'trading',
              createdAt: dateOfEarning < now ? dateOfEarning : now,
            },
          })
        }

        // Create Transaction Log
        await db.transactionLog.create({
          data: {
            userId: user.id,
            type: 'profit',
            amount: totalMissedEarning,
            balanceBefore: userBefore,
            balanceAfter: userAfter,
            wallet: 'trading',
            description: `Credited $${totalMissedEarning.toFixed(2)} missed profit for ${missedDays} active days of ${plan.name} plan (recovery run)`,
            referenceId: deposit.id,
            status: 'completed',
          },
        })

        // Send a notification
        await db.notification.create({
          data: {
            userId: user.id,
            title: 'Missed Earnings Credited 💰',
            message: `We've credited $${totalMissedEarning.toFixed(2)} of missed profit for ${missedDays} active days of your ${plan.name} plan.`,
            type: 'success',
          },
        })

        console.log(`  --> Success!`)
      }
    } else {
      console.log(`  --> No missed days.`)
    }
  }

  console.log('--- Finished Missed Earnings Recovery Script ---')
  process.exit(0)
}

main().catch(err => {
  console.error('Error running script:', err)
  process.exit(1)
})
