import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all fund deposits (payments) for admin review
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // "pending", "confirmed", "failed"

    const where: any = {}
    if (status) where.status = status

    const payments = await db.payment.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get deposits' }, { status: 500 })
  }
}

// PUT - Confirm or reject a pending deposit
export async function PUT(request: Request) {
  try {
    const { paymentId, action, adminId } = await request.json() // action: "confirm" or "reject"

    if (!paymentId || !action) {
      return NextResponse.json({ error: 'Payment ID and action required' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    if (action === 'confirm') {
      // Update payment status
      await db.payment.update({ where: { id: paymentId }, data: { status: 'confirmed' } })

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
            userId: user.id, type: 'deposit', amount: payment.amount,
            balanceBefore: user.tradingBalance, balanceAfter: newBalance,
            wallet: 'trading', description: `Deposit confirmed via ${payment.method}`,
            referenceId: paymentId, status: 'completed',
          },
        })

        // Notification
        await db.notification.create({
          data: {
            userId: user.id, title: 'Deposit Confirmed',
            message: `Your deposit of $${payment.amount.toFixed(2)} has been confirmed and added to your trading wallet.`,
            type: 'success',
          },
        })
      }

      // Activity log
      await db.activityLog.create({
        data: { userId: adminId, action: 'deposit_confirmed', details: JSON.stringify({ paymentId, amount: payment.amount, userId: payment.userId }) },
      })

      return NextResponse.json({ success: true, status: 'confirmed' })
    } else if (action === 'reject') {
      await db.payment.update({ where: { id: paymentId }, data: { status: 'failed' } })

      // Notification
      await db.notification.create({
        data: {
          userId: payment.userId, title: 'Deposit Rejected',
          message: `Your deposit of $${payment.amount.toFixed(2)} was rejected. Please contact support.`,
          type: 'warning',
        },
      })

      await db.activityLog.create({
        data: { userId: adminId, action: 'deposit_rejected', details: JSON.stringify({ paymentId, amount: payment.amount, userId: payment.userId }) },
      })

      return NextResponse.json({ success: true, status: 'rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 })
  }
}
