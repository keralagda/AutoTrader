import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'
import { placeUserInBinaryTree } from '../src/lib/binary-tree'
import { updateBinaryTreeVolumes } from '../src/lib/binary-tree'

const db = new PrismaClient()

async function main() {
  console.log('--- Starting Binary Tree Audit Logging Test ---')

  // Clean up any old test data
  await db.binaryTreeAuditLog.deleteMany({})
  await db.earning.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.transactionLog.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.notification.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.deposit.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.user.deleteMany({ where: { email: { startsWith: 'test_audit_' } } })
  await db.plan.deleteMany({ where: { name: { startsWith: 'TEST_AUDIT_PLAN_' } } })

  // 1. Create a test plan with binary MLM enabled
  const plan = await db.plan.create({
    data: {
      name: 'TEST_AUDIT_PLAN_BINARY',
      entryFee: 10,
      minDeposit: 100,
      maxDeposit: 10000,
      dailyEarningPercent: 5.0,
      maxEarningLimit: 5000,
      isBinaryMlmEnabled: true,
      binaryPairingBonusPercent: 10.0,
      binaryMatchingType: 'weaker_leg',
      binaryCarryForward: true,
      binarySpilloverPlacement: 'balanced',
    }
  })
  console.log('✓ Created binary MLM test plan.')

  // 2. Create test users (Sponsor + Child)
  const password = await hashPassword('password123')
  const sponsor = await db.user.create({
    data: {
      email: 'test_audit_sponsor@test.com',
      name: 'Audit Sponsor',
      password,
      referralCode: 'AUDITSP01',
      isActive: true,
    }
  })

  // Activate deposit for sponsor to make their binary configuration preference active
  await db.deposit.create({
    data: {
      userId: sponsor.id,
      planId: plan.id,
      amount: 500,
      status: 'active',
    }
  })

  const child = await db.user.create({
    data: {
      email: 'test_audit_child@test.com',
      name: 'Audit Child',
      password,
      referralCode: 'AUDITCH01',
      referredById: sponsor.id,
    }
  })
  console.log('✓ Created sponsor and child users.')

  // 3. Place the child in the binary tree (should trigger audit log)
  await placeUserInBinaryTree(child.id, sponsor.id)
  console.log('✓ Placed child in binary tree.')

  // 4. Update binary tree volumes for the child's deposit (should trigger audit log)
  await updateBinaryTreeVolumes(child.id, 300) // Child deposits 300
  console.log('✓ Updated binary tree volumes for child.')

  // 5. Check audit logs
  const auditLogs = await db.binaryTreeAuditLog.findMany({
    where: {
      OR: [
        { userId: sponsor.id },
        { userId: child.id }
      ]
    },
    orderBy: {
      performedAt: 'asc'
    }
  })

  console.log(`\n--- Audit Logs Found: ${auditLogs.length} ---`)
  for (const log of auditLogs) {
    console.log(`[${log.performedAt.toISOString()}] ${log.actionType} for user ${log.userId}`)
    console.log(`  Details: ${JSON.stringify(log.actionDetails)}`)
    console.log(`  Performed by: ${log.performedBy}`)
    console.log('')
  }

  // Verify we have at least the placement and volume update logs
  const placementLog = auditLogs.find(log => log.actionType === 'PLACE' && log.userId === child.id)
  const volumeLog = auditLogs.find(log => log.actionType === 'VOLUME_UPDATE' && log.userId === child.id)

  if (!placementLog) {
    throw new Error('Missing placement audit log for child')
  }
  if (!volumeLog) {
    throw new Error('Missing volume update audit log for child')
  }

  console.log('✓ Placement and volume update audit logs found.')

  // Clean up test data
  await db.earning.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.transactionLog.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.notification.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.deposit.deleteMany({ where: { user: { email: { startsWith: 'test_audit_' } } } })
  await db.user.deleteMany({ where: { email: { startsWith: 'test_audit_' } } })
  await db.plan.deleteMany({ where: { name: { startsWith: 'TEST_AUDIT_PLAN_' } } })
  await db.binaryTreeAuditLog.deleteMany({ where: { OR: [{ userId: sponsor.id }, { userId: child.id }] } })

  console.log('✓ Cleaned up test data.')
  console.log('--- ALL AUDIT LOGGING TESTS PASSED! ---')
}

main()
  .catch((e) => {
    console.error('Test failed with error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })