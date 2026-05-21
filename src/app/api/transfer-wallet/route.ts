import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Transfer funds between user's wallets (Trading -> Withdrawal)
export async function POST(request: Request) {
  try {
    const { userId, amount, direction } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'User ID and valid amount required' }, { status: 400 })
    }

    // Only allow trading -> withdrawal direction
    if (direction !== 'trading_to_withdrawal') {
      return NextResponse.json({ error: 'Only trading to withdrawal transfers are supported' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (amount > user.tradingBalance) {
      return NextResponse.json({ error: 'Insufficient trading balance' }, { status: 400 })
    }

    await db.user.update({
      where: { id: userId },
      data: {
        tradingBalance: user.tradingBalance - amount,
        withdrawalBalance: user.withdrawalBalance + amount,
      },
    })

    return NextResponse.json({
      tradingBalance: user.tradingBalance - amount,
      withdrawalBalance: user.withdrawalBalance + amount,
    })
  } catch (error) {
    console.error('Transfer wallet error:', error)
    return NextResponse.json({ error: 'Failed to transfer' }, { status: 500 })
  }
}
