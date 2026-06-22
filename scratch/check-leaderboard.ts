import { db } from '../src/lib/db'

async function main() {
  const users = await db.user.findMany({
    where: {
      role: 'user',
      isActive: true,
      totalDeposited: { gt: 0 },
      NOT: [
        { email: { contains: '@removed.local' } },
        { name: { startsWith: 'Deleted User' } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      isFake: true,
      totalDeposited: true,
      totalEarnings: true,
      isActive: true,
      role: true,
    }
  })

  console.log(`Found ${users.length} matching users total:`)
  console.log(`Real: ${users.filter(u => !u.isFake).length}`)
  console.log(`Fake: ${users.filter(u => u.isFake).length}`)
  
  console.log('\n--- Detail ---')
  console.log(users.map(u => ({
    name: u.name,
    isFake: u.isFake,
    totalDeposited: u.totalDeposited,
    totalEarnings: u.totalEarnings
  })))
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
