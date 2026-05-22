import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Razorpay API credentials (should be set in environment)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_123456789'
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'your_secret_key'

export async function POST(request: Request) {
  try {
    const { userId, amount, paymentMethod } = await request.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: 'User ID and amount required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    // In production, this would create a Razorpay order
    // For now, return mock order data
    const order = {
      id: `order_${payment.id}`,
      amount: Math.round(amountNum * 100), // Razorpay uses paise
      currency: 'INR',
      receipt: payment.id,
      payment_method: paymentMethod || 'upi',
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      paymentMethod: paymentMethod || 'upi',
      keyId: RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Razorpay create order error:', error)
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 })
  }
}
