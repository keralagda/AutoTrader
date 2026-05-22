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

// POST - Add funds to trading wallet
export async function POST(request: Request) {
  try {
    const { userId, amount, method } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'User ID and valid amount required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if manual confirmation is required
    const manualConfirmSetting = await db.setting.findUnique({ where: { key: 'require_deposit_confirmation' } })
    const requireConfirmation = manualConfirmSetting?.value === 'true'

    // Admin always gets auto-confirmed
    const autoConfirm = user.role === 'admin' || !requireConfirmation

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        amount,
        method: method || 'crypto_usdc',
        status: autoConfirm ? 'confirmed' : 'pending',
      },
    })

    if (autoConfirm) {
      // Immediately credit trading wallet
      const newBalance = user.tradingBalance + amount
      await db.user.update({
        where: { id: userId },
        data: { tradingBalance: newBalance },
      })

      // Transaction log
      await db.transactionLog.create({
        data: {
          userId, type: 'deposit', amount,
          balanceBefore: user.tradingBalance, balanceAfter: newBalance,
          wallet: 'trading', description: `Deposit via ${method || 'crypto_usdc'}`,
          referenceId: payment.id, status: 'completed',
        },
      })

      return NextResponse.json({
        tradingBalance: newBalance,
        withdrawalBalance: user.withdrawalBalance,
        status: 'confirmed',
      }, { status: 201 })
    } else {
      // Pending - admin needs to confirm
      await db.notification.create({
        data: {
          userId, title: 'Deposit Pending',
          message: `Your deposit of $${amount.toFixed(2)} is pending admin confirmation.`,
          type: 'info',
        },
      })

      return NextResponse.json({
        tradingBalance: user.tradingBalance,
        withdrawalBalance: user.withdrawalBalance,
        status: 'pending',
        message: 'Deposit submitted. Awaiting admin confirmation.',
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Fund deposit error:', error)
    return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 })
  }
}
