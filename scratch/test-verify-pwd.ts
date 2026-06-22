import { verifyPassword } from '../src/lib/auth'

async function run() {
  const result1 = await verifyPassword('admin123', 'admin123')
  console.log("verifyPassword('admin123', 'admin123') result:", result1)
}

run().catch(console.error)
