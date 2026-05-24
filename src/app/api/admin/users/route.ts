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
        tradingBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
        totalDeposited: true,
        isActive: true,
        isFake: true,
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
    const body = await request.json()
    const { userId, isActive, tradingBalance, withdrawalBalance, name, adjustBalance, amount, wallet, remarks } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Handle balance adjustment with remarks and transaction logging
    if (adjustBalance) {
      const adjustAmount = parseFloat(amount)
      if (isNaN(adjustAmount) || adjustAmount === 0) {
        return NextResponse.json({ error: 'Valid amount required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const targetWallet = wallet === 'withdrawal' ? 'withdrawal' : 'trading'
      const currentBalance = targetWallet === 'withdrawal' ? user.withdrawalBalance : user.tradingBalance

      // Check if subtracting more than available
      if (adjustAmount < 0 && currentBalance + adjustAmount < 0) {
        return NextResponse.json({ error: `Insufficient ${targetWallet} balance. Current: $${currentBalance.toFixed(2)}` }, { status: 400 })
      }

      const newBalance = currentBalance + adjustAmount

      // Update user balance
      const updateData: any = {}
      if (targetWallet === 'withdrawal') {
        updateData.withdrawalBalance = newBalance
      } else {
        updateData.tradingBalance = newBalance
      }

      await db.user.update({ where: { id: userId }, data: updateData })

      // Create transaction log
      await db.transactionLog.create({
        data: {
          userId,
          type: adjustAmount > 0 ? 'bonus' : 'fee',
          amount: adjustAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          wallet: targetWallet,
          description: remarks || `Admin balance ${adjustAmount > 0 ? 'addition' : 'deduction'}`,
          status: 'completed',
        },
      })

      // Log admin activity
      await db.activityLog.create({
        data: {
          userId,
          action: adjustAmount > 0 ? 'admin_add_balance' : 'admin_subtract_balance',
          details: JSON.stringify({
            amount: adjustAmount,
            wallet: targetWallet,
            remarks: remarks || '',
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
          }),
        },
      })

      // Send notification to user
      await db.notification.create({
        data: {
          userId,
          title: adjustAmount > 0 ? 'Balance Credited' : 'Balance Adjusted',
          message: adjustAmount > 0
            ? `$${adjustAmount.toFixed(2)} has been added to your ${targetWallet} wallet. ${remarks ? `Reason: ${remarks}` : ''}`
            : `$${Math.abs(adjustAmount).toFixed(2)} has been deducted from your ${targetWallet} wallet. ${remarks ? `Reason: ${remarks}` : ''}`,
          type: adjustAmount > 0 ? 'success' : 'warning',
        },
      })

      return NextResponse.json({ success: true, newBalance, wallet: targetWallet })
    }

    // Standard user update (toggle active, change name, etc.)
    const data: any = {}
    if (isActive !== undefined) data.isActive = isActive
    if (tradingBalance !== undefined) data.tradingBalance = tradingBalance
    if (withdrawalBalance !== undefined) data.withdrawalBalance = withdrawalBalance
    if (name !== undefined) data.name = name

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
