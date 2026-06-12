import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Transfer funds between user's wallets (both directions)
export async function POST(request: Request) {
  try {
    // Database connectivity guard
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    const { userId, amount, direction } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'User ID and valid amount required' }, { status: 400 })
    }

    const validDirections = ['trading_to_withdrawal', 'withdrawal_to_trading']
    if (!validDirections.includes(direction)) {
      return NextResponse.json({ error: 'Invalid direction. Use trading_to_withdrawal or withdrawal_to_trading' }, { status: 400 })
    }

    try {
      const result = await db.$transaction(async (tx) => {
        const freshUser = await tx.user.findUnique({ where: { id: userId } })
        if (!freshUser) throw new Error('User not found')

        let nextTradingBalance: number
        let nextWithdrawalBalance: number

        if (direction === 'trading_to_withdrawal') {
          if (freshUser.role !== 'admin' && amount > freshUser.tradingBalance) {
            throw new Error('Insufficient trading balance')
          }
          nextTradingBalance = freshUser.tradingBalance - amount
          nextWithdrawalBalance = freshUser.withdrawalBalance + amount

          await tx.user.update({
            where: { id: userId },
            data: {
              tradingBalance: { decrement: amount },
              withdrawalBalance: { increment: amount },
            },
          })
        } else {
          // withdrawal_to_trading
          if (freshUser.role !== 'admin' && amount > freshUser.withdrawalBalance) {
            throw new Error('Insufficient withdrawal balance')
          }
          nextTradingBalance = freshUser.tradingBalance + amount
          nextWithdrawalBalance = freshUser.withdrawalBalance - amount

          await tx.user.update({
            where: { id: userId },
            data: {
              tradingBalance: { increment: amount },
              withdrawalBalance: { decrement: amount },
            },
          })
        }

        // Transaction log
        await tx.transactionLog.create({
          data: {
            userId,
            type: 'transfer',
            amount,
            balanceBefore: direction === 'trading_to_withdrawal' ? freshUser.tradingBalance : freshUser.withdrawalBalance,
            balanceAfter: direction === 'trading_to_withdrawal' ? nextTradingBalance : nextWithdrawalBalance,
            wallet: direction === 'trading_to_withdrawal' ? 'trading' : 'withdrawal',
            description: direction === 'trading_to_withdrawal'
              ? 'Transfer: Trading → Withdrawal'
              : 'Transfer: Withdrawal → Trading',
            status: 'completed',
          },
        })

        return {
          tradingBalance: nextTradingBalance,
          withdrawalBalance: nextWithdrawalBalance,
        }
      })

      return NextResponse.json(result)
    } catch (txError: any) {
      return NextResponse.json({ error: txError.message || 'Transaction failed' }, { status: 400 })
    }
  } catch (error) {
    console.error('Transfer wallet error:', error)
    return NextResponse.json({ error: 'Failed to transfer' }, { status: 500 })
  }
}
