import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// USDC (Polygon) Smart Contract Address
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
const USDC_DECIMALS = 6

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

    const { userId, amount, txHash, walletAddress, method } = await request.json()

    if (!userId || !amount || !txHash) {
      return NextResponse.json({ error: 'User ID, amount, and transaction hash required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Email verification check
    if (!user.isEmailVerified) {
      return NextResponse.json({ error: 'Email verification is required to initiate deposits.' }, { status: 403 })
    }

    // Validate amount
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        amount: amountNum,
        method: method || 'crypto_usdc',
        status: 'pending',
        txHash,
        gatewayRef: txHash, // Use txHash as gateway reference
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Deposit initiated. Please wait for confirmation.',
      txHash,
      amount: amountNum,
    })
  } catch (error) {
    console.error('USDC deposit error:', error)
    return NextResponse.json({ error: 'Failed to create USDC deposit' }, { status: 500 })
  }
}

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
    const txHash = searchParams.get('txHash')

    if (!userId && !txHash) {
      return NextResponse.json({ error: 'User ID or transaction hash required' }, { status: 400 })
    }

    // Get pending USDC deposits
    const where: any = {
      method: 'crypto_usdc',
      status: 'pending',
    }

    if (userId) where.userId = userId
    if (txHash) where.txHash = txHash

    const payments = await db.payment.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payments, count: payments.length })
  } catch (error) {
    console.error('USDC deposit status error:', error)
    return NextResponse.json({ error: 'Failed to get deposit status' }, { status: 500 })
  }
}
