import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { role: 'user' },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        balance: true,
        totalEarnings: true,
        totalDeposited: true,
        isActive: true,
        createdAt: true,
        referredById: true,
        _count: {
          select: {
            deposits: true,
            referrals: true,
            withdrawals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, ...data } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: userId },
      data,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
