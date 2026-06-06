import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    // Database connectivity guard
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        walletAddress: true,
        referralCode: true,
        tradingBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
        totalDeposited: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active plan info
    const activeDeposit = await db.deposit.findFirst({
      where: { userId, status: { in: ['active', 'locked'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    // Get team counts
    const directCount = await db.user.count({ where: { referredById: userId } })

    // Get total team (recursive - simplified to 7 levels)
    let totalTeam = 0
    let currentIds = [userId]
    for (let i = 0; i < 7; i++) {
      const members = await db.user.findMany({
        where: { referredById: { in: currentIds } },
        select: { id: true },
      })
      totalTeam += members.length
      currentIds = members.map(m => m.id)
      if (currentIds.length === 0) break
    }

    // Calculate total deposited on the fly based on confirmed payments
    const confirmedPayments = await db.payment.aggregate({
      where: { userId, status: 'confirmed' },
      _sum: { amount: true }
    })
    const calculatedTotalDeposited = confirmedPayments._sum.amount || 0

    return NextResponse.json({
      ...user,
      totalDeposited: calculatedTotalDeposited,
      activePlan: activeDeposit?.plan?.name || null,
      planCategory: activeDeposit?.plan?.name?.toLowerCase() || null,
      investmentAmount: activeDeposit?.amount || 0,
      directCount,
      totalTeam,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // Database connectivity guard
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    const { userId, name, email, phone, walletAddress } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        walletAddress: true,
        referralCode: true,
        tradingBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
        totalDeposited: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
