import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Retrieve saved trading session for a deposit
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const depositId = searchParams.get('depositId')

    if (!depositId) {
      return NextResponse.json({ error: 'Deposit ID required' }, { status: 400 })
    }

    const setting = await db.setting.findUnique({
      where: { key: `trading_session_${depositId}` },
    })

    // Get deposit info for plan rate calculation
    const deposit = await db.deposit.findUnique({
      where: { id: depositId },
      include: { plan: true },
    })

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    }

    // Calculate the allowed daily earning based on plan rate
    const dailyRate = deposit.plan.dailyEarningPercent / 100
    const dailyAllowedEarning = deposit.amount * dailyRate
    const maxEarning = deposit.plan.maxEarningLimit

    // Calculate how many days since deposit was created
    const daysSinceCreation = Math.floor((Date.now() - new Date(deposit.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    const totalAllowedEarning = Math.min(dailyAllowedEarning * Math.max(daysSinceCreation, 1), maxEarning)

    // The credited amount is what's actually been added to user balance (earnedSoFar on deposit)
    const creditedEarnings = deposit.earnedSoFar

    const session = setting ? JSON.parse(setting.value) : null

    return NextResponse.json({
      session,
      planRate: {
        dailyPercent: deposit.plan.dailyEarningPercent,
        dailyAllowedEarning,
        totalAllowedEarning,
        creditedEarnings,
        maxEarning,
        daysSinceCreation,
        depositAmount: deposit.amount,
      },
    })
  } catch (error) {
    console.error('Get trading session error:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}

// POST - Save trading session state and sync earnings
export async function POST(request: Request) {
  try {
    const { depositId, totalProfit, winCount, lossCount, neutralCount, signals, syncEarnings } = await request.json()

    if (!depositId) {
      return NextResponse.json({ error: 'Deposit ID required' }, { status: 400 })
    }

    const sessionData = JSON.stringify({
      totalProfit,
      winCount,
      lossCount,
      neutralCount,
      signals: (signals || []).slice(0, 30),
      savedAt: new Date().toISOString(),
    })

    await db.setting.upsert({
      where: { key: `trading_session_${depositId}` },
      create: { key: `trading_session_${depositId}`, value: sessionData },
      update: { value: sessionData },
    })

    // If syncEarnings is requested, credit the plan-rate earnings to user
    if (syncEarnings) {
      const deposit = await db.deposit.findUnique({
        where: { id: depositId },
        include: { plan: true },
      })

      if (deposit && (deposit.status === 'active' || deposit.status === 'locked')) {
        const dailyRate = deposit.plan.dailyEarningPercent / 100
        const dailyAllowed = deposit.amount * dailyRate
        const maxEarning = deposit.plan.maxEarningLimit

        // Check last credit time
        const lastCreditKey = `last_credit_${depositId}`
        const lastCreditSetting = await db.setting.findUnique({ where: { key: lastCreditKey } })
        const lastCreditTime = lastCreditSetting ? new Date(lastCreditSetting.value).getTime() : 0
        const now = Date.now()

        // Only credit once per hour minimum (to prevent spam)
        const hoursSinceLastCredit = (now - lastCreditTime) / (1000 * 60 * 60)

        if (hoursSinceLastCredit >= 1) {
          // Calculate fractional daily earning based on hours passed
          // (dailyAllowed / 24) * hours passed, capped at dailyAllowed
          const hoursToCredit = Math.min(hoursSinceLastCredit, 24)
          const earningToCredit = Math.min(
            (dailyAllowed / 24) * hoursToCredit,
            maxEarning - deposit.earnedSoFar
          )

          if (earningToCredit > 0) {
            // Update deposit earnedSoFar
            await db.deposit.update({
              where: { id: depositId },
              data: { earnedSoFar: deposit.earnedSoFar + earningToCredit },
            })

            // Update user balance
            const user = await db.user.findUnique({ where: { id: deposit.userId } })
            if (user) {
              await db.user.update({
                where: { id: deposit.userId },
                data: {
                  tradingBalance: user.tradingBalance + earningToCredit,
                  totalEarnings: user.totalEarnings + earningToCredit,
                },
              })

              // Create earning record
              await db.earning.create({
                data: {
                  userId: deposit.userId,
                  depositId: deposit.id,
                  amount: earningToCredit,
                  type: 'daily',
                  walletTarget: 'trading',
                },
              })
            }

            // Update last credit time
            await db.setting.upsert({
              where: { key: lastCreditKey },
              create: { key: lastCreditKey, value: new Date().toISOString() },
              update: { value: new Date().toISOString() },
            })

            // Check if deposit reached max
            if (deposit.earnedSoFar + earningToCredit >= maxEarning) {
              await db.deposit.update({
                where: { id: depositId },
                data: { status: 'completed' },
              })
            }

            return NextResponse.json({
              success: true,
              credited: earningToCredit,
              newEarnedSoFar: deposit.earnedSoFar + earningToCredit,
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save trading session error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}
