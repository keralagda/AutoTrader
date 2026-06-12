import { db } from '../src/lib/db'

async function listUsers() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log(`Total users in DB: ${users.length}`)
    console.log(JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error listing users:', error)
  } finally {
    process.exit(0)
  }
}

listUsers()
