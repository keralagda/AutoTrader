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
    const { userId, amount, walletAddress } = await request.json()

    if (!userId || !amount || !walletAddress) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (amount > user.balance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    if (amount < 10) {
      return NextResponse.json({ error: 'Minimum withdrawal is $10' }, { status: 400 })
    }

    // Create withdrawal request
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount,
        walletAddress,
        status: 'pending',
      },
    })

    // Deduct from balance
    await db.user.update({
      where: { id: userId },
      data: { balance: user.balance - amount },
    })

    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error) {
    console.error('Create withdrawal error:', error)
    return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 })
  }
}
