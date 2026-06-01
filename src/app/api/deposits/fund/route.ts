import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get fund deposit history for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const payments = await db.payment.findMany({
      where: { userId, planId: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get deposits' }, { status: 500 })
  }
}

// POST - Submit deposit with proof (requires admin approval for all users except admin)
export async function POST(request: Request) {
  try {
    const { userId, amount, method, proofUrl, txHash, notes } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'User ID and valid amount required' }, { status: 400 })
    }

    // Proof is mandatory for non-admin users
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const isAdmin = user.role === 'admin' || user.role === 'super_admin'
    if (!isAdmin && !txHash && !proofUrl) {
      return NextResponse.json({ error: 'Transaction hash or proof screenshot is required' }, { status: 400 })
    }

    // Create payment record with proof
    const payment = await db.payment.create({
      data: {
        userId,
        amount,
        method: method || 'crypto_usdc',
        status: isAdmin ? 'confirmed' : 'pending',
        txHash: txHash || null,
        gatewayRef: JSON.stringify({
          proofUrl: proofUrl || null,
          notes: notes || null,
          submittedAt: new Date().toISOString(),
        }),
      },
    })

    if (isAdmin) {
      // Admin: auto-confirm immediately
      const newBalance = user.tradingBalance + amount
      await db.user.update({
        where: { id: userId },
        data: {
          tradingBalance: newBalance,
          totalDeposited: user.totalDeposited + amount,
        },
      })

      await db.transactionLog.create({
        data: {
          userId, type: 'deposit', amount,
          balanceBefore: user.tradingBalance, balanceAfter: newBalance,
          wallet: 'trading', description: `Admin deposit via ${method || 'crypto_usdc'}`,
          referenceId: payment.id, status: 'completed',
        },
      })

      return NextResponse.json({
        tradingBalance: newBalance,
        withdrawalBalance: user.withdrawalBalance,
        status: 'confirmed',
        paymentId: payment.id,
      }, { status: 201 })
    }

    // Regular user: pending admin approval
    // Notify user
    await db.notification.create({
      data: {
        userId,
        title: 'Deposit Submitted',
        message: `Your deposit of $${amount.toFixed(2)} has been submitted and is awaiting admin verification. You'll be notified once approved.`,
        type: 'info',
      },
    })

    // Notify all admins
    const admins = await db.user.findMany({ where: { role: 'admin' } })
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'New Deposit Pending',
          message: `${user.name} submitted a deposit of $${amount.toFixed(2)} via ${method || 'crypto'}. Proof attached. Review required.`,
          type: 'info',
        },
      })
    }

    // Activity log
    await db.activityLog.create({
      data: {
        userId,
        action: 'deposit_submitted',
        details: JSON.stringify({ amount, method, txHash, proofUrl, paymentId: payment.id }),
      },
    })

    return NextResponse.json({
      tradingBalance: user.tradingBalance,
      withdrawalBalance: user.withdrawalBalance,
      status: 'pending',
      paymentId: payment.id,
      message: 'Deposit submitted successfully. Awaiting admin approval.',
    }, { status: 201 })
  } catch (error) {
    console.error('Fund deposit error:', error)
    return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 })
  }
}
