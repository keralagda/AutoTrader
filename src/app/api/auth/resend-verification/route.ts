import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Database connectivity guard
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ message: 'Email is already verified' }, { status: 400 })
    }

    const verificationToken = crypto.randomUUID()

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken
      }
    })

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken)
    if (!emailSent) {
      return NextResponse.json({ error: 'Verification email delivery failed. Please check SMTP / Resend server credentials.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Verification email resent successfully' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 })
  }
}
