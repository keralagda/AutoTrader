import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  try {
    // Try to access the TestModel
    console.log('Trying to access TestModel...')
    const count = await db.testModel.count()
    console.log(`Success! Found ${count} test models.`)
  } catch (error: any) {
    console.error('Error accessing TestModel:', error.message)
  } finally {
    await db.$disconnect()
  }
}

main()