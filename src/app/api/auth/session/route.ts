import { NextRequest, NextResponse } from 'next/server'
import { getSession, clearSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Validate current session and return user data
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: session.userId } })
    if (!user || !user.isActive) {
      await clearSession()
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
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
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

// DELETE - Logout (clear session)
export async function DELETE() {
  try {
    await clearSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
