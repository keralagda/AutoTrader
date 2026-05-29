import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

// POST - Create a spectate session (admin views as user)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Create a short-lived token for the spectated user (1 hour)
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      spectating: true, // Flag to show spectate banner
    })

    // Store spectate session
    await db.setting.upsert({
      where: { key: `spectate_${token.slice(-10)}` },
      update: { value: JSON.stringify({ userId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() }) },
      create: { key: `spectate_${token.slice(-10)}`, value: JSON.stringify({ userId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() }) },
    })

    await db.activityLog.create({
      data: { userId, action: 'admin_spectate', details: JSON.stringify({ targetUser: user.email }) },
    })

    return NextResponse.json({ token, userId: user.id, userName: user.name })
  } catch (error) {
    console.error('Spectate error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
