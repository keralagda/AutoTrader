import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function resetAdmin() {
  const hash = await bcrypt.hash('admin123', 12)
  console.log('Generated hash for admin123:', hash)

  const email = 'admin@bnfx.com'
  const user = await db.user.findUnique({ where: { email } })

  if (user) {
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        role: 'admin',
        isActive: true
      }
    })
    console.log('Reset existing admin password and role. New user details:', {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive
    })
  } else {
    const created = await db.user.create({
      data: {
        email,
        name: 'Admin',
        password: hash,
        role: 'admin',
        referralCode: 'ADMIN001',
        tradingBalance: 1000000,
        withdrawalBalance: 1000000,
        isActive: true
      }
    })
    console.log('Admin did not exist. Created new admin:', {
      id: created.id,
      email: created.email,
      role: created.role
    })
  }
}

resetAdmin()
  .catch(console.error)
  .finally(() => db.$disconnect())
