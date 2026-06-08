import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, setSessionCookie } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { name, email, password, referralCode } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password with bcrypt
    const hashedPassword = await hashPassword(password)

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

    const verificationToken = crypto.randomUUID()

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        referralCode: userRefCode,
        referredById,
        isActive: false, // User becomes active only after first deposit or admin balance add
        tradingBalance: 0,
        withdrawalBalance: 0,
        totalEarnings: 0,
        totalDeposited: 0,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
      },
    })

    // Create session cookie
    const token = await setSessionCookie({ userId: user.id, email: user.email, role: user.role })

    // Send verification email (non-blocking)
    sendVerificationEmail(user.email, user.name, verificationToken).catch(() => {})

    // Signup referral bonus: notify referrer
    if (referredById) {
      const referrer = await db.user.findUnique({ where: { id: referredById } })
      if (referrer) {
        // Notify referrer about new team member
        await db.notification.create({
          data: {
            userId: referrer.id,
            title: 'New Referral! 🎉',
            message: `${name} joined using your referral code. You'll earn commissions on their deposits.`,
            type: 'referral',
          },
        })
      }
    }

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        referralCode: user.referralCode,
        tradingBalance: user.tradingBalance,
        withdrawalBalance: user.withdrawalBalance,
        totalEarnings: user.totalEarnings,
        totalDeposited: user.totalDeposited,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
