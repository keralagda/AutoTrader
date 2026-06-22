import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  try {
    // Try to access the binaryTreeAuditLog model
    console.log('Trying to access binaryTreeAuditLog model...')
    const count = await db.binaryTreeAuditLog.count()
    console.log(`Success! Found ${count} audit log entries.`)
  } catch (error: any) {
    console.error('Error accessing binaryTreeAuditLog model:', error.message)

    // Let's see what models are available
    console.log('\nAvailable models on db object:')
    const modelNames = Object.keys(db).filter(key =>
      typeof db[key as keyof PrismaClient] === 'function' &&
      key !== '$connect' &&
      key !== '$disconnect' &&
      key !== '$on' &&
      key !== '$once' &&
      key !== '$use' &&
      key !== '$transaction'
    )
    console.log(modelNames)
  } finally {
    await db.$disconnect()
  }
}

main()