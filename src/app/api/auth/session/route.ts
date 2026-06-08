import { NextRequest, NextResponse } from 'next/server'
import { getSession, clearSession, verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

// GET - Validate current session and return user data
export async function GET() {
  try {
    // Check for Bearer token first (spectate mode)
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    let session: any = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      session = verifyToken(token)
    }

    // Fall back to cookie session
    if (!session) {
      session = await getSession()
    }

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: session.userId } })
    if (!user) {
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
        hasTransactionPin: !!user.transactionPin,
        usdcBscAddress: user.usdcBscAddress,
        usdcTronAddress: user.usdcTronAddress,
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
