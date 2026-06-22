import { db } from '../src/lib/db'
import { updateBinaryTreeVolumes } from '../src/lib/binary-tree'

async function main() {
  console.log('Starting DB fix and seed script...')

  // 1. Get users
  const admin = await db.user.findUnique({ where: { email: 'admin@bnfx.com' } })
  const tredge = await db.user.findUnique({ where: { email: 'tredgefund@gmail.com' } })
  const william = await db.user.findUnique({ where: { email: 'williamblerk69@gmail.com' } })
  const jameson = await db.user.findUnique({ where: { email: 'udstoken@gmail.com' } })
  const philips = await db.user.findUnique({ where: { email: 'phytogulf@gmail.com' } })

  if (!tredge || !william || !jameson || !philips) {
    throw new Error('Could not find all users in DB.')
  }

  // 2. Correct Philips referredById to William Blerk
  console.log('Updating Philips sponsor to William Blerk...')
  await db.user.update({
    where: { id: philips.id },
    data: { referredById: william.id }
  })
  console.log('✓ Philips sponsor updated.')

  // 3. Fix registration commissions
  console.log('Adjusting registration commissions in database...')

  // Find William blerk's activation earning for Tredge fund
  const williamActivationEarning = await db.earning.findFirst({
    where: {
      userId: tredge.id,
      type: 'referral',
      level: 1,
      amount: 0.25,
      createdAt: {
        gte: new Date('2026-06-21T07:48:00.000Z'),
        lte: new Date('2026-06-21T07:54:00.000Z')
      }
    }
  })
  if (williamActivationEarning) {
    await db.earning.update({
      where: { id: williamActivationEarning.id },
      data: { amount: 5.0 }
    })
    console.log(`✓ Updated William's activation earning for Tredge (0.25 -> 5.0)`)
  } else {
    console.log(`✗ Could not find William's activation earning for Tredge. Creating one instead.`)
    await db.earning.create({
      data: {
        userId: tredge.id,
        amount: 5.0,
        type: 'referral',
        level: 1,
        walletTarget: 'trading'
      }
    })
  }

  // Find Jameson's activation earning for Tredge fund
  const jamesonActivationEarning = await db.earning.findFirst({
    where: {
      userId: tredge.id,
      type: 'referral',
      level: 1,
      amount: 0.25,
      createdAt: {
        gte: new Date('2026-06-21T08:04:00.000Z'),
        lte: new Date('2026-06-21T08:10:00.000Z')
      }
    }
  })
  if (jamesonActivationEarning) {
    await db.earning.update({
      where: { id: jamesonActivationEarning.id },
      data: { amount: 5.0 }
    })
    console.log(`✓ Updated Jameson's activation earning for Tredge (0.25 -> 5.0)`)
  } else {
    console.log(`✗ Could not find Jameson's activation earning for Tredge. Creating one instead.`)
    await db.earning.create({
      data: {
        userId: tredge.id,
        amount: 5.0,
        type: 'referral',
        level: 1,
        walletTarget: 'trading'
      }
    })
  }

  // Find Philips's activation earning for Tredge fund
  const philipsActivationEarning = await db.earning.findFirst({
    where: {
      userId: tredge.id,
      type: 'referral',
      level: 1,
      amount: 0.25,
      createdAt: {
        gte: new Date('2026-06-21T07:58:00.000Z'),
        lte: new Date('2026-06-21T08:04:00.000Z')
      }
    }
  })
  if (philipsActivationEarning) {
    await db.earning.update({
      where: { id: philipsActivationEarning.id },
      data: {
        level: 2,
        amount: 1.0 // Level 2 default commission (20% of 5% pool = 1.0)
      }
    })
    console.log(`✓ Updated Philips's activation earning for Tredge (Level 1, 0.25 -> Level 2, 1.0)`)
  } else {
    console.log(`✗ Could not find Philips's activation earning for Tredge. Creating one instead.`)
    await db.earning.create({
      data: {
        userId: tredge.id,
        amount: 1.0,
        type: 'referral',
        level: 2,
        walletTarget: 'trading'
      }
    })
  }

  // Create Level 1 registration commission earning for William blerk (from Philips)
  await db.earning.create({
    data: {
      userId: william.id,
      amount: 5.0,
      type: 'referral',
      level: 1,
      walletTarget: 'trading'
    }
  })
  console.log(`✓ Created Level 1 registration commission for William blerk (5.0 from Philips)`)

  // Update user balances for registration commission correction
  const tredgeDiff = 10.25 // (5 + 5 + 1) - 0.75
  const williamDiff = 5.0

  await db.user.update({
    where: { id: tredge.id },
    data: {
      tradingBalance: tredge.tradingBalance + tredgeDiff,
      totalEarnings: tredge.totalEarnings + tredgeDiff
    }
  })
  console.log(`✓ Updated Tredge fund balance (+${tredgeDiff})`)

  await db.user.update({
    where: { id: william.id },
    data: {
      tradingBalance: william.tradingBalance + williamDiff,
      totalEarnings: william.totalEarnings + williamDiff
    }
  })
  console.log(`✓ Updated William blerk balance (+${williamDiff})`)


  // 4. Seed Jameson's $2,500 investment in Nova Supreme
  console.log('Seeding $2,500 investment in Nova Supreme plan for Jameson...')
  const supremePlan = await db.plan.findUnique({ where: { id: 'nova-supreme' } })
  if (!supremePlan) {
    throw new Error('Could not find Nova Supreme plan in DB. Seed plans first!')
  }

  // Add Nova Supreme to Jameson's activated plans list
  const activatedSettingKey = `activated_plans_${jameson.id}`
  const activatedSetting = await db.setting.findUnique({ where: { key: activatedSettingKey } })
  let activatedList: string[] = []
  if (activatedSetting) {
    activatedList = JSON.parse(activatedSetting.value)
  }
  if (!activatedList.includes('nova-supreme')) {
    activatedList.push('nova-supreme')
  }
  await db.setting.upsert({
    where: { key: activatedSettingKey },
    update: { value: JSON.stringify(activatedList) },
    create: { key: activatedSettingKey, value: JSON.stringify(activatedList) }
  })
  console.log(`✓ Nova Supreme added to Jameson's activated plans list.`)

  // Create deposit record
  const endsAt = new Date()
  endsAt.setDate(endsAt.getDate() + 400) // 400 days duration

  const newDeposit = await db.deposit.create({
    data: {
      userId: jameson.id,
      planId: supremePlan.id,
      amount: 2500.0,
      status: 'active',
      earnedSoFar: 0,
      stackIndex: 1,
      riskLevel: 'medium',
      endsAt,
      nextProfitAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Profit in 24 hours
    }
  })
  console.log(`✓ Deposit record of $2,500 created for Jameson.`)

  // Pay 5% referral commission ($125) to Tredge fund
  const freshTredge = await db.user.findUnique({ where: { id: tredge.id } })
  if (freshTredge) {
    await db.user.update({
      where: { id: tredge.id },
      data: {
        tradingBalance: freshTredge.tradingBalance + 125.0,
        totalEarnings: freshTredge.totalEarnings + 125.0
      }
    })
  }

  // Create Earning record for Tredge
  await db.earning.create({
    data: {
      userId: tredge.id,
      depositId: newDeposit.id,
      amount: 125.0,
      type: 'referral',
      level: 1,
      walletTarget: 'trading'
    }
  })
  console.log(`✓ Credited $125 deposit commission to Tredge fund.`)

  // Create Notification for Tredge
  await db.notification.create({
    data: {
      userId: tredge.id,
      title: 'Referral Earnings!',
      message: `You earned $125.00 from Jameson's deposit (Level 1)`,
      type: 'referral'
    }
  })

  // 5. Recursively update binary tree volumes for Jameson's new deposit
  console.log('Running binary tree volume update for Jameson\'s $2,500 deposit...')
  await updateBinaryTreeVolumes(jameson.id, 2500.0, supremePlan.id)
  console.log('✓ Binary tree volumes updated.')

  console.log('DB fix and seed script completed successfully!')
}

main().catch(console.error).finally(() => process.exit(0))
