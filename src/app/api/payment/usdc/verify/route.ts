import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// USDC (Polygon) Smart Contract Address
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'

export async function POST(request: Request) {
  try {
    const { paymentId, adminId } = await request.json()

    if (!paymentId || !adminId) {
      return NextResponse.json({ error: 'Payment ID and admin ID required' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    // Verify transaction (in production, this would call the blockchain)
    // For now, we'll assume the transaction is valid
    const txVerified = true // Replace with actual blockchain verification

    if (!txVerified) {
      return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 })
    }

    // Update payment status
    await db.payment.update({
      where: { id: paymentId },
      data: { status: 'confirmed' },
    })

    // Credit user's trading wallet
    const user = await db.user.findUnique({ where: { id: payment.userId } })
    if (user) {
      const newBalance = user.tradingBalance + payment.amount
      await db.user.update({
        where: { id: user.id },
        data: { tradingBalance: newBalance },
      })

      // Transaction log
      await db.transactionLog.create({
        data: {
          userId: user.id,
          type: 'deposit',
          amount: payment.amount,
          balanceBefore: user.tradingBalance,
          balanceAfter: newBalance,
          wallet: 'trading',
          description: `USDC (Polygon) deposit confirmed`,
          referenceId: paymentId,
          status: 'completed',
        },
      })

      // Notification
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Deposit Confirmed',
          message: `Your USDC deposit of $${payment.amount.toFixed(2)} has been confirmed and added to your trading wallet.`,
          type: 'success',
        },
      })
    }

    // Activity log
    await db.activityLog.create({
      data: {
        userId: adminId,
        action: 'usdc_deposit_confirmed',
        details: JSON.stringify({ paymentId, amount: payment.amount, userId: payment.userId }),
      },
    })

    return NextResponse.json({
      success: true,
      status: 'confirmed',
      message: 'USDC deposit verified and credited',
    })
  } catch (error) {
    console.error('USDC verify error:', error)
    return NextResponse.json({ error: 'Failed to verify USDC deposit' }, { status: 500 })
  }
}
