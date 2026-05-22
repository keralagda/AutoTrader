import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const withdrawals = await db.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(withdrawals)
  } catch (error) {
    console.error('Get withdrawals error:', error)
    return NextResponse.json({ error: 'Failed to get withdrawals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, amount, walletAddress, paymentMethod } = await request.json()

    if (!userId || !amount || !walletAddress) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (amount < 10) {
      return NextResponse.json({ error: 'Minimum withdrawal is $10' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Admin has unlimited funds - skip balance check
    if (user.role !== 'admin' && amount > user.withdrawalBalance) {
      return NextResponse.json({
        error: `Insufficient withdrawal balance. You have $${user.withdrawalBalance.toFixed(2)} available. Transfer funds from your Trading Wallet first.`
      }, { status: 400 })
    }

    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount,
        walletAddress,
        paymentMethod: paymentMethod || 'crypto_usdc',
        status: 'pending',
      },
    })

    // Deduct from withdrawal balance
    await db.user.update({
      where: { id: userId },
      data: { withdrawalBalance: user.withdrawalBalance - amount },
    })

    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error) {
    console.error('Create withdrawal error:', error)
    return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 })
  }
}
