import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
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

    const { userId, amount, walletAddress, paymentMethod, pin } = await request.json()

    if (!userId || !amount || !walletAddress || !pin) {
      return NextResponse.json({ error: 'All fields are required, including transaction PIN' }, { status: 400 })
    }

    if (amount < 10) {
      return NextResponse.json({ error: 'Minimum withdrawal is $10' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transaction PIN verification
    if (!user.transactionPin) {
      return NextResponse.json({ error: 'Transaction PIN is not set. Please set it in Settings.' }, { status: 400 })
    }
    const pinMatch = await bcrypt.compare(pin, user.transactionPin)
    if (!pinMatch) {
      return NextResponse.json({ error: 'Incorrect transaction PIN' }, { status: 400 })
    }

    // Email verification check
    if (!user.isEmailVerified) {
      return NextResponse.json({ error: 'Email verification is required to withdraw funds.' }, { status: 403 })
    }

    // Admin has unlimited funds - skip balance check
    if (user.role !== 'admin' && amount > user.withdrawalBalance) {
      return NextResponse.json({
        error: `Insufficient withdrawal balance. You have $${user.withdrawalBalance.toFixed(2)} available. Transfer funds from your Trading Wallet first.`
      }, { status: 400 })
    }

    try {
      const withdrawal = await db.$transaction(async (tx) => {
        if (user.role !== 'admin') {
          const freshUser = await tx.user.findUnique({ where: { id: userId } })
          if (!freshUser || amount > freshUser.withdrawalBalance) {
            throw new Error('Insufficient withdrawal balance')
          }
        }

        const w = await tx.withdrawal.create({
          data: {
            userId,
            amount,
            walletAddress,
            paymentMethod: paymentMethod || 'crypto_usdc',
            status: 'pending',
          },
        })

        await tx.user.update({
          where: { id: userId },
          data: { withdrawalBalance: { decrement: amount } },
        })

        return w
      })

      return NextResponse.json(withdrawal, { status: 201 })
    } catch (txError: any) {
      return NextResponse.json({ error: txError.message || 'Transaction failed' }, { status: 400 })
    }
  } catch (error) {
    console.error('Create withdrawal error:', error)
    return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 })
  }
}
