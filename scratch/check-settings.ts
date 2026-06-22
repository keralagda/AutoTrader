import { db } from '../src/lib/db'

async function main() {
  const settings = await db.setting.findMany()
  console.log('Database Settings:')
  console.log(JSON.stringify(settings, null, 2))
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
