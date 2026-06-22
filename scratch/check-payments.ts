import { db } from '../src/lib/db'

async function main() {
  const payments = await db.payment.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  console.log('=== PAYMENTS ===')
  console.log(JSON.stringify(payments, null, 2))
}

main().catch(console.error).finally(() => process.exit(0))
