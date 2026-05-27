import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, setSessionCookie, createToken, hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Auto-migrate plain-text/SHA-256 passwords to bcrypt on successful login
    if (!user.password.startsWith('$2')) {
      const hashed = await hashPassword(password)
      await db.user.update({ where: { id: user.id }, data: { password: hashed } })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    // Record login history
    const headers = request.headers
    const userAgent = headers.get('user-agent') || ''
    const ipAddress = (headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown').split(',')[0].trim()
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)

    // IP Login Alert: check if this IP is new
    const previousLogin = await db.loginHistory.findFirst({
      where: { userId: user.id, ipAddress },
      orderBy: { createdAt: 'desc' },
    })

    if (!previousLogin && ipAddress !== 'unknown') {
      // New IP — send alert email (non-blocking)
      sendEmail({
        to: user.email,
        subject: 'New login detected on your BNFX account',
        html: `<h2>New Login Alert</h2><p>Hi ${user.name},</p><p>A new login was detected on your account from a new location:</p><ul><li><strong>IP:</strong> ${ipAddress}</li><li><strong>Device:</strong> ${isMobile ? 'Mobile' : 'Desktop'}</li><li><strong>Time:</strong> ${new Date().toLocaleString()}</li></ul><p>If this was you, no action needed. If not, please change your password immediately.</p>`,
      }).catch(() => {})
    }

    await db.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent: userAgent.substring(0, 200),
        device: isMobile ? 'mobile' : 'desktop',
      },
    })

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const tempToken = createToken({ userId: user.id, email: user.email, role: '2fa_pending' })
      return NextResponse.json({ requires2FA: true, tempToken })
    }

    const token = await setSessionCookie({ userId: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      token,
      user: {
        id: user.id, email: user.email, name: user.name, phone: user.phone,
        role: user.role, referralCode: user.referralCode, walletAddress: user.walletAddress,
        tradingBalance: user.tradingBalance, withdrawalBalance: user.withdrawalBalance,
        totalEarnings: user.totalEarnings, totalDeposited: user.totalDeposited,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

