import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  try {
    // Try to access the TestModel2
    console.log('Trying to access TestModel2...')
    const count = await db.testModel2.count()
    console.log(`Success! Found ${count} test models.`)
  } catch (error: any) {
    console.error('Error accessing TestModel2:', error.message)
  } finally {
    await db.$disconnect()
  }
}

main()