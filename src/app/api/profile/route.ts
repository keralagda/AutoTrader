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
        depositWallets: true,
        withdrawWallets: true,
        referralCode: true,
        tradingBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
        totalDeposited: true,
        createdAt: true,
        isEmailVerified: true,
        binaryTreePosition: true,
        binaryTreeParentId: true,
        binaryTreeLeftChildId: true,
        binaryTreeRightChildId: true,
        binaryTreeLeftVolume: true,
        binaryTreeRightVolume: true,
        binaryTreeLeftVolumeCarryForward: true,
        binaryTreeRightVolumeCarryForward: true,
        autoUpgradeEnabled: true,
        autoUpgradePercent: true,
        autoUpgradeAccumulated: true,
        autoUpgradeTargetPlanId: true,
        autoInvestmentEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active plan info
    const activeDeposits = await db.deposit.findMany({
      where: { userId, status: { in: ['active', 'locked'] } },
      select: { amount: true, planId: true }
    })
    const totalActiveInvestment = activeDeposits.reduce((sum, d) => sum + d.amount, 0)
    const activePlanIds = activeDeposits.map(d => d.planId)
    const activeDeposit = activeDeposits.length > 0 ? activeDeposits[0] : null

    // Get direct referrals
    const directReferrals = await db.user.findMany({
      where: { referredById: userId },
      select: { id: true, isActive: true }
    })
    const directsCount = directReferrals.length
    const activeDirectsCount = directReferrals.filter(d => d.isActive).length

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

    // Calculate total earnings on the fly based on Earning records (excluding 'subtract' debits)
    const confirmedEarnings = await db.earning.aggregate({
      where: { userId, type: { not: 'subtract' } },
      _sum: { amount: true }
    })
    const calculatedTotalEarnings = confirmedEarnings._sum.amount || 0

    // Self-healing: synchronize cached User fields if out of sync
    let needsUpdate = false
    const updateData: any = {}
    if (user.totalDeposited !== calculatedTotalDeposited) {
      updateData.totalDeposited = calculatedTotalDeposited
      user.totalDeposited = calculatedTotalDeposited
      needsUpdate = true
    }
    if (user.totalEarnings !== calculatedTotalEarnings) {
      updateData.totalEarnings = calculatedTotalEarnings
      user.totalEarnings = calculatedTotalEarnings
      needsUpdate = true
    }
    if (needsUpdate) {
      await db.user.update({
        where: { id: userId },
        data: updateData
      })
    }

    return NextResponse.json({
      ...user,
      activePlan: activePlanIds.length > 0 ? 'Active Alliance Plans' : null,
      planCategory: 'alliance',
      investmentAmount: totalActiveInvestment,
      totalActiveInvestment,
      activePlanIds,
      directsCount,
      activeDirectsCount,
      directCount: directsCount,
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

    const { 
      userId, name, email, phone, walletAddress, depositWallets, withdrawWallets,
      autoUpgradeEnabled, autoUpgradePercent, autoUpgradeTargetPlanId, autoInvestmentEnabled
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress
    if (depositWallets !== undefined) updateData.depositWallets = depositWallets
    if (withdrawWallets !== undefined) updateData.withdrawWallets = withdrawWallets
    if (autoUpgradeEnabled !== undefined) updateData.autoUpgradeEnabled = autoUpgradeEnabled
    if (autoUpgradePercent !== undefined) updateData.autoUpgradePercent = autoUpgradePercent
    if (autoUpgradeTargetPlanId !== undefined) updateData.autoUpgradeTargetPlanId = autoUpgradeTargetPlanId
    if (autoInvestmentEnabled !== undefined) updateData.autoInvestmentEnabled = autoInvestmentEnabled

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        walletAddress: true,
        depositWallets: true,
        withdrawWallets: true,
        referralCode: true,
        tradingBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
        totalDeposited: true,
        isEmailVerified: true,
        autoUpgradeEnabled: true,
        autoUpgradePercent: true,
        autoUpgradeAccumulated: true,
        autoUpgradeTargetPlanId: true,
        autoInvestmentEnabled: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
