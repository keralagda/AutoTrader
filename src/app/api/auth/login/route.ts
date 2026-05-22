import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Record login history
    const headers = request.headers
    const userAgent = headers.get('user-agent') || ''
    const ipAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown'
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)

    await db.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : 'unknown',
        userAgent: userAgent.substring(0, 200),
        device: isMobile ? 'mobile' : 'desktop',
      },
    })

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        referralCode: user.referralCode,
        walletAddress: user.walletAddress,
        tradingBalance: user.tradingBalance,
        withdrawalBalance: user.withdrawalBalance,
        totalEarnings: user.totalEarnings,
        totalDeposited: user.totalDeposited,
        requires2FA: true,
      })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      referralCode: user.referralCode,
      walletAddress: user.walletAddress,
      tradingBalance: user.tradingBalance,
      withdrawalBalance: user.withdrawalBalance,
      totalEarnings: user.totalEarnings,
      totalDeposited: user.totalDeposited,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
