import { db } from '../src/lib/db'

async function listGateways() {
  try {
    const gateways = await db.paymentGateway.findMany({})
    console.log(`Total gateways in DB: ${gateways.length}`)
    console.log(JSON.stringify(gateways, null, 2))
  } catch (error) {
    console.error('Error listing gateways:', error)
  } finally {
    process.exit(0)
  }
}

listGateways()
