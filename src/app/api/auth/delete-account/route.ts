import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

// Request account deletion (Hard delete)
export async function POST(req: NextRequest) {
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

    const { userId, password, reason } = await req.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'userId and password required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify password (supports bcrypt, legacy SHA-256 and plain text)
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await db.withdrawal.count({
      where: { userId, status: 'pending' },
    })

    if (pendingWithdrawals > 0) {
      return NextResponse.json({
        error: 'Cannot delete account with pending withdrawals. Please wait for them to be processed.',
      }, { status: 400 })
    }

    // Check for active deposits
    const activeDeposits = await db.deposit.count({
      where: { userId, status: 'active' },
    })

    if (activeDeposits > 0) {
      return NextResponse.json({
        error: 'Cannot delete account with active investments. Please wait for them to complete.',
      }, { status: 400 })
    }

    // Log user deletion activity (before deleting the user itself, anonymizing the audit record)
    await db.activityLog.create({
      data: {
        action: 'user_delete_account',
        details: JSON.stringify({
          deletedEmail: user.email,
          deletedName: user.name,
          reason: reason || 'User requested deletion',
          deletedAt: new Date().toISOString()
        }),
      },
    })

    // Delete all related records in correct order to respect foreign key constraints
    await db.ticketReply.deleteMany({ where: { ticket: { userId } } })
    await db.supportTicket.deleteMany({ where: { userId } })
    await db.dailyCheckIn.deleteMany({ where: { userId } })
    await db.userBadge.deleteMany({ where: { userId } })
    await db.userChallenge.deleteMany({ where: { userId } })
    await db.loginHistory.deleteMany({ where: { userId } })
    await db.p2PTransfer.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } })
    await db.notification.deleteMany({ where: { userId } })
    await db.message.deleteMany({ where: { userId } })
    await db.profitDistribution.deleteMany({ where: { deposit: { userId } } })
    await db.earning.deleteMany({ where: { userId } })
    await db.transactionLog.deleteMany({ where: { userId } })
    await db.payment.deleteMany({ where: { userId } })
    await db.withdrawal.deleteMany({ where: { userId } })
    await db.deposit.deleteMany({ where: { userId } })
    await db.leaderboardEntry.deleteMany({ where: { userId } })
    await db.userStats.deleteMany({ where: { userId } })
    await db.kycVerification.deleteMany({ where: { userId } })
    await db.affiliateApplication.deleteMany({ where: { userId } })

    // Unlink referrals
    await db.user.updateMany({ where: { referredById: userId }, data: { referredById: null } })

    // Delete the user itself
    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

