import { db } from '../src/lib/db'

async function checkDeletedUsers() {
  try {
    const deletedUsers = await db.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'deleted_' } },
          { email: { contains: '@removed.local' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    console.log(`Found ${deletedUsers.length} soft-deleted users in the database:`)
    console.log(JSON.stringify(deletedUsers, null, 2))
  } catch (error) {
    console.error('Error checking deleted users:', error)
  } finally {
    process.exit(0)
  }
}

checkDeletedUsers()
