import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Request account deletion
export async function POST(req: NextRequest) {
  try {
    const { userId, password, reason } = await req.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'userId and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify password
    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.count({
      where: { userId, status: 'pending' },
    })

    if (pendingWithdrawals > 0) {
      return NextResponse.json({
        error: 'Cannot delete account with pending withdrawals. Please wait for them to be processed.',
      }, { status: 400 })
    }

    // Check for active deposits
    const activeDeposits = await prisma.deposit.count({
      where: { userId, status: 'active' },
    })

    if (activeDeposits > 0) {
      return NextResponse.json({
        error: 'Cannot delete account with active investments. Please wait for them to complete.',
      }, { status: 400 })
    }

    // Deactivate account (soft delete)
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
        name: 'Deleted User',
        phone: null,
        walletAddress: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'account_deleted',
        details: JSON.stringify({ reason: reason || 'User requested deletion' }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account has been deactivated and personal data removed.',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
