import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
