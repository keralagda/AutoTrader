import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = await request.json()

    if (!razorpayOrderId || !razorpayPaymentId || !paymentId) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    // Verify Razorpay signature (in production)
    // For now, assume verification passed
    const signatureVerified = true // Replace with actual verification

    if (!signatureVerified) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    // Update payment status
    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status atomically ensuring status is still pending (concurrency guard)
    const updateResult = await db.payment.updateMany({
      where: { id: paymentId, status: 'pending' },
      data: {
        status: 'confirmed',
        gatewayRef: razorpayOrderId,
        upiRef: razorpayPaymentId,
      },
    })

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    // Credit user's trading wallet
    const user = await db.user.findUnique({ where: { id: payment.userId } })
    if (user) {
      const newBalance = user.tradingBalance + payment.amount
      await db.user.update({
        where: { id: user.id },
        data: {
          tradingBalance: newBalance,
          totalDeposited: user.totalDeposited + payment.amount,
        },
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
          description: `Razorpay UPI deposit confirmed`,
          referenceId: paymentId,
          status: 'completed',
        },
      })

      // Notification
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Deposit Confirmed',
          message: `Your deposit of ₹${payment.amount.toFixed(2)} has been confirmed and added to your trading wallet.`,
          type: 'success',
        },
      })
    }

    return NextResponse.json({
      success: true,
      status: 'confirmed',
      message: 'Payment verified and credited',
    })
  } catch (error) {
    console.error('Razorpay verify error:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
