import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { name, email, password, referralCode } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Generate unique referral code for new user
    const userRefCode = `AT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    // Find referrer if code provided
    let referredById: string | null = null
    if (referralCode) {
      const referrer = await db.user.findUnique({ where: { referralCode } })
      if (!referrer) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
      }
      referredById = referrer.id
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password,
        referralCode: userRefCode,
        referredById,
        tradingBalance: 0,
        withdrawalBalance: 0,
        totalEarnings: 0,
        totalDeposited: 0,
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referralCode: user.referralCode,
      tradingBalance: user.tradingBalance,
      withdrawalBalance: user.withdrawalBalance,
      totalEarnings: user.totalEarnings,
      totalDeposited: user.totalDeposited,
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
