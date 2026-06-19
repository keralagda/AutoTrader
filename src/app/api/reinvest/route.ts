import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Reinvest: original deposit + earned amount into same or different plan
export async function POST(request: Request) {
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

    const { userId, planId, sourceDepositId } = await request.json()

    if (!userId || !planId) {
      return NextResponse.json({ error: 'User ID and plan ID required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 })

    // If reinvesting from a specific deposit, use deposit amount + earnings
    let reinvestAmount: number
    let sourceDeposit: any = null

    if (sourceDepositId) {
      sourceDeposit = await db.deposit.findUnique({ where: { id: sourceDepositId } })
      if (!sourceDeposit || sourceDeposit.userId !== userId) {
        return NextResponse.json({ error: 'Source deposit not found' }, { status: 404 })
      }
      if (sourceDeposit.status !== 'active' && sourceDeposit.status !== 'completed' && sourceDeposit.status !== 'ended') {
        return NextResponse.json({ error: 'Source deposit is not eligible for reinvestment' }, { status: 400 })
      }

      // Reinvest = original deposit amount + all earnings from that deposit
      reinvestAmount = sourceDeposit.amount + sourceDeposit.earnedSoFar

      // Deduct the earned amount from user's trading balance (it was already credited there by cron)
      // The original deposit amount was already deducted when first invested
      // So we only need to deduct the earnedSoFar from trading balance for the reinvestment
      if (user.role !== 'admin' && sourceDeposit.earnedSoFar > user.tradingBalance) {
        return NextResponse.json({ error: `Insufficient balance. Need $${sourceDeposit.earnedSoFar.toFixed(2)} from earnings in trading wallet.` }, { status: 400 })
      }

      // Close the source deposit
      await db.deposit.update({
        where: { id: sourceDepositId },
        data: { status: 'completed' },
      })
    } else {
      // Manual reinvest from trading balance (legacy flow)
      const body = await request.clone().json()
      reinvestAmount = body.amount || 0
      if (reinvestAmount <= 0) {
        return NextResponse.json({ error: 'Valid amount required' }, { status: 400 })
      }
      if (user.role !== 'admin' && reinvestAmount > user.tradingBalance) {
        return NextResponse.json({ error: 'Insufficient trading balance' }, { status: 400 })
      }
    }

    // Validate amount range
    if (user.role !== 'admin') {
      const minRequired = plan.minReinvestAmount > 0 ? plan.minReinvestAmount : plan.minDeposit
      if (reinvestAmount < minRequired) {
        return NextResponse.json({ error: `Reinvestment amount $${reinvestAmount.toFixed(2)} is below minimum $${minRequired}` }, { status: 400 })
      }
      if (reinvestAmount > plan.maxDeposit) {
        reinvestAmount = plan.maxDeposit // Cap at max
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
    const lockPeriod = plan.reinvestLockPeriod > 0 ? plan.reinvestLockPeriod : plan.lockPeriodDays
    const lockedUntil = lockPeriod > 0 ? new Date(now.getTime() + lockPeriod * 86400000) : null
    const endsAt = plan.durationDays > 0 ? new Date(now.getTime() + plan.durationDays * 86400000) : null
    const nextProfitAt = new Date(now.getTime() + plan.returnPeriodHours * 3600000)

    // Create reinvested deposit with full amount (original + earnings)
    const deposit = await db.deposit.create({
      data: {
        userId, planId, amount: reinvestAmount,
        status: lockPeriod > 0 ? 'locked' : 'active',
        earnedSoFar: 0, stackIndex, lockedUntil, endsAt, nextProfitAt,
        isReinvested: true,
        riskLevel: sourceDeposit?.riskLevel || user.riskCategory || 'medium',
      },
    })

    // Update binary MLM volumes
    try {
      const { updateBinaryTreeVolumes } = await import('@/lib/binary-tree')
      await updateBinaryTreeVolumes(userId, reinvestAmount)
    } catch (err) {
      console.error('Failed to update binary tree volumes for reinvest deposit:', err)
    }

    // Reinvestment Bonus
    const REINVEST_BONUS_PERCENT = plan.reinvestBonus !== undefined ? plan.reinvestBonus : 2
    const reinvestBonus = (reinvestAmount * REINVEST_BONUS_PERCENT) / 100

    // Update user balances
    // Deduct earnings portion from trading balance (original was already invested)
    const deductAmount = sourceDepositId ? sourceDeposit.earnedSoFar : reinvestAmount
    const newBalance = user.role === 'admin' ? user.tradingBalance : user.tradingBalance - deductAmount + reinvestBonus

    await db.user.update({
      where: { id: userId },
      data: {
        tradingBalance: Math.max(0, newBalance),
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
        userId, type: 'reinvest', amount: -deductAmount,
        balanceBefore: user.tradingBalance, balanceAfter: Math.max(0, newBalance),
        wallet: 'trading',
        description: sourceDepositId
          ? `Reinvested $${reinvestAmount.toFixed(2)} (original $${sourceDeposit.amount.toFixed(2)} + earnings $${sourceDeposit.earnedSoFar.toFixed(2)}) into ${plan.name} (+$${reinvestBonus.toFixed(2)} bonus)`
          : `Reinvested $${reinvestAmount.toFixed(2)} into ${plan.name} (+$${reinvestBonus.toFixed(2)} bonus)`,
        referenceId: deposit.id,
      },
    })

    // Notification
    await db.notification.create({
      data: {
        userId,
        title: 'Reinvestment Successful! 🔄',
        message: sourceDepositId
          ? `$${sourceDeposit.amount.toFixed(2)} + $${sourceDeposit.earnedSoFar.toFixed(2)} earnings = $${reinvestAmount.toFixed(2)} reinvested into ${plan.name}. Bonus: +$${reinvestBonus.toFixed(2)}`
          : `$${reinvestAmount.toFixed(2)} reinvested into ${plan.name}. Bonus: +$${reinvestBonus.toFixed(2)}`,
        type: 'success',
      },
    })

    return NextResponse.json({
      success: true,
      deposit: { id: deposit.id, amount: reinvestAmount, planName: plan.name, status: deposit.status },
      bonus: reinvestBonus,
      breakdown: sourceDepositId ? { original: sourceDeposit.amount, earnings: sourceDeposit.earnedSoFar, total: reinvestAmount } : null,
    }, { status: 201 })
  } catch (error) {
    console.error('Reinvest error:', error)
    return NextResponse.json({ error: 'Failed to reinvest' }, { status: 500 })
  }
}
