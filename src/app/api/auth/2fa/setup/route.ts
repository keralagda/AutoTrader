import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import speakeasy from 'speakeasy'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `AutoTrade-${user.email}`,
      length: 20,
    })

    // Save secret to database
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
      },
    })

    // Return QR code URL for TOTP app
    const qrUrl = secret.otpauth_url

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrUrl,
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}
