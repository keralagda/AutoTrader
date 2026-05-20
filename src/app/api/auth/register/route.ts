import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { name, email, password, referralCode } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Find referrer if referral code provided
    let referredById: string | null = null
    if (referralCode) {
      const referrer = await db.user.findUnique({ where: { referralCode } })
      if (!referrer) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
      }
      referredById = referrer.id
    }

    const newReferralCode = name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase()

    const user = await db.user.create({
      data: {
        name,
        email,
        password, // In production, hash with bcrypt
        referralCode: newReferralCode,
        referredById,
        role: 'user',
        balance: 0,
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
      walletAddress: user.walletAddress,
      balance: user.balance,
      totalEarnings: user.totalEarnings,
      totalDeposited: user.totalDeposited,
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
