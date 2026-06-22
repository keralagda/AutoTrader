import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  try {
    // Try to access the User model
    console.log('Trying to access User model...')
    const count = await db.user.count()
    console.log(`Success! Found ${count} users.`)
  } catch (error: any) {
    console.error('Error accessing User model:', error.message)
  } finally {
    await db.$disconnect()
  }
}

main()