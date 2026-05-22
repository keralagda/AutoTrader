import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Support both session-based and legacy userId query param
    let userId: string | null = null

    // Try session first
    const session = await getSession()
    if (session) {
      userId = session.userId
    }

    // Fallback to query param (for backward compatibility during migration)
    if (!userId) {
      userId = request.nextUrl.searchParams.get('userId')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
      kycStatus: user.kycStatus,
      twoFactorEnabled: user.twoFactorEnabled,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
