import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function POST(req: NextRequest) {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    const { userId, pin, password } = await req.json()

    if (!userId || !pin || !password) {
      return NextResponse.json({ error: 'User ID, PIN, and password are required' }, { status: 400 })
    }

    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password first
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Incorrect account password' }, { status: 400 })
    }

    // Hash the 6-digit PIN using bcrypt
    const hashedPin = await bcrypt.hash(pin, 10)

    await db.user.update({
      where: { id: userId },
      data: { transactionPin: hashedPin }
    })

    return NextResponse.json({ success: true, message: 'Transaction PIN set successfully' })
  } catch (error) {
    console.error('Transaction PIN error:', error)
    return NextResponse.json({ error: 'Failed to set transaction PIN' }, { status: 500 })
  }
}
