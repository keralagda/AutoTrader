import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Process withdrawal (approve with TX hash or reject with reason)
export async function POST(req: NextRequest) {
  try {
    const { withdrawalId, action, txHash, reason } = await req.json()

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'withdrawalId and action required' }, { status: 400 })
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: { select: { id: true, name: true, withdrawalBalance: true } } },
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      // Approve and mark as completed
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'completed',
          txHash: txHash || null,
        },
      })

      // Notify user
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Withdrawal Completed ✅',
          message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been processed.${txHash ? ` TX: ${txHash.substring(0, 10)}...` : ''}`,
          type: 'success',
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: withdrawal.userId,
          action: 'withdrawal_completed',
          details: JSON.stringify({
            withdrawalId,
            amount: withdrawal.amount,
            txHash,
          }),
        },
      })

      return NextResponse.json({ success: true, status: 'completed' })
    }

    if (action === 'reject') {
      // Reject and refund to withdrawal wallet
      await prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'rejected' },
        })

        // Refund to withdrawal wallet
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { withdrawalBalance: { increment: withdrawal.amount } },
        })

        // Create transaction log for refund
        await tx.transactionLog.create({
          data: {
            userId: withdrawal.userId,
            type: 'withdrawal',
            amount: withdrawal.amount,
            wallet: 'withdrawal',
            description: `Withdrawal rejected - refunded. ${reason ? `Reason: ${reason}` : ''}`,
            referenceId: withdrawalId,
            status: 'completed',
          },
        })

        // Notify user
        await tx.notification.create({
          data: {
            userId: withdrawal.userId,
            title: 'Withdrawal Rejected',
            message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} was rejected.${reason ? ` Reason: ${reason}` : ''} The amount has been refunded to your wallet.`,
            type: 'warning',
          },
        })
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: withdrawal.userId,
          action: 'withdrawal_rejected',
          details: JSON.stringify({ withdrawalId, amount: withdrawal.amount, reason }),
        },
      })

      return NextResponse.json({ success: true, status: 'rejected' })
    }

    return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 })
  } catch (error) {
    console.error('Process withdrawal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
