import fs from 'fs'
import path from 'path'

try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    for (const line of envConfig.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let value = (match[2] || '').trim()
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
      }
    }
  }
} catch (e) {
  console.error('Error loading .env manually:', e)
}

import { db } from '../src/lib/db'

async function main() {
  const count = await db.plan.count()
  console.log(`Total plans in DB: ${count}`)
  
  if (count > 0) {
    const plans = await db.plan.findMany({
      select: {
        id: true,
        name: true,
        entryFee: true,
        isBinaryMlmEnabled: true,
      }
    })
    console.log('Plans:')
    console.log(JSON.stringify(plans, null, 2))
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
