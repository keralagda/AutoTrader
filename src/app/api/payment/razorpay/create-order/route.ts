import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Razorpay API credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1'

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

    const { userId, amount, paymentMethod } = await request.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: 'User ID and amount required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Email verification check
    if (!user.isEmailVerified && user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Email verification is required to initiate deposits.' }, { status: 403 })
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 10) {
      return NextResponse.json({ error: 'Minimum amount is ₹10' }, { status: 400 })
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        amount: amountNum,
        method: paymentMethod || 'razorpay',
        status: 'pending',
      },
    })

    let order: any

    // If Razorpay keys are configured, create real order
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      try {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
        const res = await fetch(`${RAZORPAY_API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amountNum * 100), // Razorpay uses paise
            currency: 'INR',
            receipt: payment.id,
            notes: {
              userId,
              paymentId: payment.id,
            },
          }),
        })

        if (res.ok) {
          order = await res.json()
        } else {
          const errorData = await res.json()
          console.error('Razorpay API error:', errorData)
          // Fall back to demo mode
          order = null
        }
      } catch (err) {
        console.error('Razorpay API call failed:', err)
        order = null
      }
    }

    // If real order creation failed or keys not configured, use demo mode
    if (!order) {
      order = {
        id: `order_demo_${payment.id}`,
        amount: Math.round(amountNum * 100),
        currency: 'INR',
        receipt: payment.id,
        status: 'created',
        _demo: true,
      }
    }

    // Update payment with gateway reference
    await db.payment.update({
      where: { id: payment.id },
      data: { gatewayRef: order.id },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: payment.id,
      paymentMethod: paymentMethod || 'upi',
      keyId: RAZORPAY_KEY_ID || 'demo_mode',
      demoMode: !RAZORPAY_KEY_ID || order._demo === true,
    })
  } catch (error) {
    console.error('Razorpay create order error:', error)
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 })
  }
}
