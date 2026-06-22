import { db } from '../src/lib/db'

async function main() {
  console.log('=== EARNINGS ===')
  const earnings = await db.earning.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })
  console.log(JSON.stringify(earnings, null, 2))

  console.log('=== TRANSACTIONS ===')
  const transactions = await db.transaction.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })
  console.log(JSON.stringify(transactions, null, 2))
}

main().catch(console.error).finally(() => process.exit(0))
