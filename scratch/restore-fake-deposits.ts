import { db } from '../src/lib/db'

async function main() {
  const fakeUsers = await db.user.findMany({
    where: {
      isFake: true,
      totalDeposited: 0,
    },
    select: {
      id: true,
      name: true,
    }
  })

  console.log(`Found ${fakeUsers.length} fake users with 0 deposits. Restoring random deposit values...`)

  let updatedCount = 0
  for (const user of fakeUsers) {
    const randomDeposit = Math.round((1000 + Math.random() * 24000) * 100) / 100
    await db.user.update({
      where: { id: user.id },
      data: {
        totalDeposited: randomDeposit,
      }
    })
    updatedCount++
  }

  console.log(`Successfully restored deposit values for ${updatedCount} fake user(s).`)
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
