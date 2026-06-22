import { db } from '../src/lib/db'

async function main() {
  const users = await db.user.findMany({
    where: {
      role: 'admin'
    },
    select: {
      id: true,
      email: true,
      name: true,
    }
  })
  console.log('Admin Users in DB:')
  console.log(JSON.stringify(users, null, 2))

  const specificUser = await db.user.findUnique({
    where: {
      email: 'admin@autotrade.com'
    }
  })
  if (specificUser) {
    console.log('admin@autotrade.com exists in DB:', JSON.stringify(specificUser, null, 2))
  } else {
    console.log('admin@autotrade.com does NOT exist in DB.')
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
