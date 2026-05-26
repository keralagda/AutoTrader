import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Transfer funds between user's wallets (both directions)
export async function POST(request: Request) {
  try {
    const { userId, amount, direction } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'User ID and valid amount required' }, { status: 400 })
    }

    const validDirections = ['trading_to_withdrawal', 'withdrawal_to_trading']
    if (!validDirections.includes(direction)) {
      return NextResponse.json({ error: 'Invalid direction. Use trading_to_withdrawal or withdrawal_to_trading' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let newTradingBalance: number
    let newWithdrawalBalance: number

    if (direction === 'trading_to_withdrawal') {
      if (user.role !== 'admin' && amount > user.tradingBalance) {
        return NextResponse.json({ error: 'Insufficient trading balance' }, { status: 400 })
      }
      newTradingBalance = user.tradingBalance - amount
      newWithdrawalBalance = user.withdrawalBalance + amount
    } else {
      // withdrawal_to_trading
      if (user.role !== 'admin' && amount > user.withdrawalBalance) {
        return NextResponse.json({ error: 'Insufficient withdrawal balance' }, { status: 400 })
      }
      newTradingBalance = user.tradingBalance + amount
      newWithdrawalBalance = user.withdrawalBalance - amount
    }

    await db.user.update({
      where: { id: userId },
      data: {
        tradingBalance: newTradingBalance,
        withdrawalBalance: newWithdrawalBalance,
      },
    })

    // Transaction log
    await db.transactionLog.create({
      data: {
        userId,
        type: 'transfer',
        amount,
        balanceBefore: direction === 'trading_to_withdrawal' ? user.tradingBalance : user.withdrawalBalance,
        balanceAfter: direction === 'trading_to_withdrawal' ? newTradingBalance : newWithdrawalBalance,
        wallet: direction === 'trading_to_withdrawal' ? 'trading' : 'withdrawal',
        description: direction === 'trading_to_withdrawal'
          ? 'Transfer: Trading → Withdrawal'
          : 'Transfer: Withdrawal → Trading',
        status: 'completed',
      },
    })

    return NextResponse.json({
      tradingBalance: newTradingBalance,
      withdrawalBalance: newWithdrawalBalance,
    })
  } catch (error) {
    console.error('Transfer wallet error:', error)
    return NextResponse.json({ error: 'Failed to transfer' }, { status: 500 })
  }
}
