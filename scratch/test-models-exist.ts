import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  try {
    // Try to access the TestModel
    console.log('Trying to access TestModel...')
    const testCount = await db.testModel.count()
    console.log(`Success! Found ${testCount} test models.`)
  } catch (error: any) {
    console.error('Error accessing TestModel:', error.message)
  }

  try {
    // Try to access the BinaryTreeAuditLog model
    console.log('Trying to access BinaryTreeAuditLog model...')
    const auditCount = await db.binaryTreeAuditLog.count()
    console.log(`Success! Found ${auditCount} audit log entries.`)
  } catch (error: any) {
    console.error('Error accessing BinaryTreeAuditLog model:', error.message)
  } finally {
    await db.$disconnect()
  }
}

main()