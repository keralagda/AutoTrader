import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import speakeasy from 'speakeasy'

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: 'User ID and token required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not setup' }, { status: 400 })
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of drift
    })

    if (!verified) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
    }

    // Enable 2FA
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
