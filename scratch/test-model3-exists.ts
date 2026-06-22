import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  try {
    // Try to access the TestModel3
    console.log('Trying to access TestModel3...')
    const count = await db.testModel3.count()
    console.log(`Success! Found ${count} test models.`)
  } catch (error: any) {
    console.error('Error accessing TestModel3:', error.message)
  } finally {
    await db.$disconnect()
  }
}

main()