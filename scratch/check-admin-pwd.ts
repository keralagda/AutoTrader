import { db } from '../src/lib/db'

async function checkAdmin() {
  const user = await db.user.findUnique({
    where: { email: 'admin@bnfx.com' }
  })
  console.log('Admin user status:', user ? {
    id: user.id,
    email: user.email,
    role: user.role,
    password: user.password, // print password hash/value
    isActive: user.isActive
  } : 'Not found')
}

checkAdmin()
  .catch(console.error)
  .finally(() => db.$disconnect())
