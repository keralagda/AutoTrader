import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    // Disable 2FA
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
