import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await req.json()

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const hashedCurrent = hashPassword(currentPassword)
    if (user.password !== hashedCurrent) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Update password
    const hashedNew = hashPassword(newPassword)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNew },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'password_changed',
        details: JSON.stringify({ timestamp: new Date().toISOString() }),
      },
    })

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
