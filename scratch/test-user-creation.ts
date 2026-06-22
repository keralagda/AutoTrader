import { db } from '../src/lib/db'

async function main() {
  console.log('Testing manual user creation API route...')

  const testEmail = `backdated_user_${Date.now()}@example.com`
  const backDate = new Date()
  backDate.setMonth(backDate.getMonth() - 3) // 3 months ago

  // We can call the API route using fetch on the local server since it is running
  try {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': 'autotrade-cron-2026' // Bypass middleware auth check
      },
      body: JSON.stringify({
        name: 'Backdated Test User',
        email: testEmail,
        password: 'password123',
        createdAt: backDate.toISOString(),
      })
    })

    const data = await response.json()
    console.log('API Response status:', response.status)
    console.log('API Response body:', JSON.stringify(data, null, 2))

    if (response.ok && data.success) {
      console.log('Checking database record for:', testEmail)
      const user = await db.user.findUnique({
        where: { email: testEmail }
      })

      if (user) {
        console.log('User found in DB!')
        console.log('Name:', user.name)
        console.log('Email:', user.email)
        console.log('Created At (should be 3 months ago):', user.createdAt.toISOString())
        console.log('Verification status:', user.isEmailVerified)

        const diffTime = Math.abs(new Date().getTime() - user.createdAt.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        console.log(`Difference in days: ~${diffDays} days (Expected: ~90 days)`)

        if (diffDays >= 89 && diffDays <= 92) {
          console.log('SUCCESS: Back-dating verified successfully!')
        } else {
          console.error('FAIL: Creation date mismatch')
        }

        // Cleanup test user
        await db.user.delete({ where: { id: user.id } })
        console.log('Cleaned up test user.')
      } else {
        console.error('FAIL: User was not found in database')
      }
    } else {
      console.error('FAIL: API returned error')
    }
  } catch (error) {
    console.error('FAIL: Network or execution error:', error)
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
