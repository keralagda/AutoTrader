import { db } from '../src/lib/db'

async function main() {
  const deposits = await db.deposit.findMany({
    include: {
      plan: {
        select: {
          name: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  console.log('=== DEPOSITS ===')
  console.log(JSON.stringify(deposits, null, 2))
}

main().catch(console.error).finally(() => process.exit(0))
