import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Reinvest earnings into same or different plan
export async function POST(request: Request) {
  try {
    const { userId, planId, amount, sourceDepositId } = await request.json()

    if (!userId || !planId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'User ID, plan ID, and valid amount required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 })

    // Check balance (admin bypasses)
    if (user.role !== 'admin' && amount > user.tradingBalance) {
      return NextResponse.json({ error: 'Insufficient trading balance for reinvestment' }, { status: 400 })
    }

    // Validate amount range (admin bypasses)
    if (user.role !== 'admin') {
      if (amount < plan.minDeposit || amount > plan.maxDeposit) {
        return NextResponse.json({ error: `Amount must be between $${plan.minDeposit} and $${plan.maxDeposit}` }, { status: 400 })
      }
    }

    // Calculate stack index
    const existingDeposits = await db.deposit.findMany({
      where: { userId, planId, status: { in: ['active', 'locked'] } },
      orderBy: { stackIndex: 'desc' },
    })
    const stackIndex = existingDeposits.length > 0 ? existingDeposits[0].stackIndex + 1 : 1

    // Calculate dates
    const now = new Date()
    const lockedUntil = plan.lockPeriodDays > 0 ? new Date(now.getTime() + plan.lockPeriodDays * 24 * 60 * 60 * 1000) : null
    const endsAt = plan.durationDays > 0 ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000) : null
    const nextProfitAt = new Date(now.getTime() + plan.returnPeriodHours * 60 * 60 * 1000)

    // Create reinvested deposit
    const deposit = await db.deposit.create({
      data: {
        userId, planId, amount,
        status: plan.lockPeriodDays > 0 ? 'locked' : 'active',
        earnedSoFar: 0, stackIndex, lockedUntil, endsAt, nextProfitAt,
        isReinvested: true,
      },
    })

    // Reinvestment Bonus: +2% of reinvested amount credited immediately
    const REINVEST_BONUS_PERCENT = 2
    const reinvestBonus = (amount * REINVEST_BONUS_PERCENT) / 100

    // Deduct from trading balance + add reinvest bonus
    const newBalance = user.role === 'admin' ? user.tradingBalance : user.tradingBalance - amount + reinvestBonus
    await db.user.update({
      where: { id: userId },
      data: {
        tradingBalance: newBalance,
        totalDeposited: user.totalDeposited + amount,
        totalEarnings: user.totalEarnings + reinvestBonus,
      },
    })

    // Bonus earning record
    await db.earning.create({
      data: { userId, depositId: deposit.id, amount: reinvestBonus, type: 'bonus', walletTarget: 'trading' },
    })

    // Transaction log
    await db.transactionLog.create({
      data: {
        userId, type: 'reinvest', amount: -amount,
        balanceBefore: user.tradingBalance, balanceAfter: newBalance,
        wallet: 'trading', description: `Reinvested $${amount.toFixed(2)} into ${plan.name} plan (+$${reinvestBonus.toFixed(2)} bonus)`,
        referenceId: deposit.id,
      },
    })

    // Notification
    await db.notification.create({
      data: {
        userId,
        title: 'Reinvestment Successful! 🔄',
        message: `$${amount.toFixed(2)} reinvested into ${plan.name}. Bonus: +$${reinvestBonus.toFixed(2)} (${REINVEST_BONUS_PERCENT}% reinvestment reward)`,
        type: 'success',
      },
    })

    return NextResponse.json({
      success: true,
      deposit: { id: deposit.id, amount, planName: plan.name, status: deposit.status },
      bonus: reinvestBonus,
    }, { status: 201 })
  } catch (error) {
    console.error('Reinvest error:', error)
    return NextResponse.json({ error: 'Failed to reinvest' }, { status: 500 })
  }
}
