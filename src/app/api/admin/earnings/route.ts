import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List pending investment deposits (awaiting approval) and recent earnings
export async function GET(req: NextRequest) {
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

    const action = req.nextUrl.searchParams.get('action')

    if (action === 'pending-investments') {
      // Get all pending investment deposits
      const pendingDeposits = await db.deposit.findMany({
        where: { status: 'pending' },
        include: {
          user: { select: { id: true, name: true, email: true, totalDeposited: true } },
          plan: { select: { name: true, dailyEarningPercent: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(pendingDeposits)
    }

    if (action === 'recent-earnings') {
      // Get recent earnings for review
      const earnings = await db.earning.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          deposit: { select: { amount: true, status: true, plan: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json(earnings)
    }

    // Default: summary stats
    const [pendingCount, todayEarnings, totalEarnings] = await Promise.all([
      db.deposit.count({ where: { status: 'pending' } }),
      db.earning.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.earning.aggregate({ _sum: { amount: true } }),
    ])

    return NextResponse.json({
      pendingInvestments: pendingCount,
      todayEarnings: todayEarnings._sum.amount || 0,
      totalEarnings: totalEarnings._sum.amount || 0,
    })
  } catch (error) {
    console.error('Admin earnings GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT - Approve or reject pending investment deposits
export async function PUT(req: NextRequest) {
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

    const { depositId, action, reason } = await req.json()

    if (!depositId || !action) {
      return NextResponse.json({ error: 'depositId and action required' }, { status: 400 })
    }

    const deposit = await db.deposit.findUnique({
      where: { id: depositId },
      include: { plan: true, user: true },
    })

    if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    if (deposit.status !== 'pending') {
      return NextResponse.json({ error: 'Deposit is not pending' }, { status: 400 })
    }

    if (action === 'approve') {
      const plan = deposit.plan
      const now = new Date()
      
      // Calculate next profit time including grace period days
      const graceDays = plan.gracePeriodDays || 0
      const nextProfitAt = new Date(now.getTime() + (plan.returnPeriodHours * 60 * 60 * 1000) + (graceDays * 24 * 60 * 60 * 1000))

      // Activate the deposit
      await db.deposit.update({
        where: { id: depositId },
        data: {
          status: plan.lockPeriodDays > 0 ? 'locked' : 'active',
          nextProfitAt,
          lockedUntil: plan.lockPeriodDays > 0 ? new Date(now.getTime() + plan.lockPeriodDays * 86400000) : null,
        },
      })


      // Also set the user's isActive to true so they receive profit distribution
      await db.user.update({
        where: { id: deposit.userId },
        data: {
          isActive: true,
        },
      })

      // Update binary tree volumes recursively for ancestors
      if (plan.isBinaryMlmEnabled) {
        const { updateBinaryTreeVolumes } = await import('@/lib/binary-tree')
        await updateBinaryTreeVolumes(deposit.userId, deposit.amount, plan.id)
      }

      // Process referral earnings from deposit bonus
      const referralRules = await db.planReferralRule.findMany({
        where: { planId: plan.id, type: 'deposit', enabled: true }
      })

      const DEFAULT_DEP_PERCENTS = [5, 3, 2, 1, 1, 0.5, 0.5]
      const maxLevels = plan.registrationReferralLevels || 7

      let currentReferrerId = deposit.user.referredById
      let level = 0

      while (currentReferrerId && level < maxLevels) {
        const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
        if (!referrer) break

        const directReferrals = await db.user.count({ where: { referredById: referrer.id } })

        // Enforce direct referrals condition: Level L (1-indexed) requires >= L direct referrals
        const requiredReferrals = level + 1
        if (directReferrals < requiredReferrals) {
          currentReferrerId = referrer.referredById
          level++
          continue
        }

        const activeDepositsList = await db.deposit.findMany({
          where: { userId: referrer.id, status: 'active' },
          select: { amount: true }
        })
        const activeDepositsTotal = activeDepositsList.reduce((sum, d) => sum + d.amount, 0)

        // Process Deposit Bonus (based on deposit amount)
        let depEarning = 0
        const depRule = referralRules.find(r => r.level === (level + 1) && r.type === 'deposit')
        if (depRule) {
          if (activeDepositsTotal >= depRule.minSponsorDeposit && directReferrals >= depRule.minDirectReferrals) {
            depEarning = depRule.amount > 0 ? depRule.amount : (deposit.amount * depRule.commission) / 100
          }
        } else {
          const rate = DEFAULT_DEP_PERCENTS[level] !== undefined ? DEFAULT_DEP_PERCENTS[level] : 0
          depEarning = (deposit.amount * rate) / 100
        }

        if (depEarning > 0) {
          const depWallet = depRule?.targetWallet === 'withdrawal' ? 'withdrawal' : 'trading'

          // Payout deposit bonus referral earnings
          if (depWallet === 'withdrawal') {
            await db.user.update({
              where: { id: referrer.id },
              data: {
                withdrawalBalance: referrer.withdrawalBalance + depEarning,
                totalEarnings: referrer.totalEarnings + depEarning
              }
            })
          } else {
            await db.user.update({
              where: { id: referrer.id },
              data: {
                tradingBalance: referrer.tradingBalance + depEarning,
                totalEarnings: referrer.totalEarnings + depEarning
              }
            })
          }
          await db.earning.create({
            data: {
              userId: referrer.id,
              depositId: deposit.id,
              amount: depEarning,
              type: 'referral',
              level: level + 1,
              walletTarget: depWallet
            }
          })

          await db.notification.create({
            data: {
              userId: referrer.id,
              title: 'Referral Earnings!',
              message: `You earned $${depEarning.toFixed(2)} from ${deposit.user.name}'s deposit (Level ${level + 1})`,
              type: 'referral'
            }
          })
        }

        currentReferrerId = referrer.referredById
        level++
      }

      // Notify user
      await db.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Investment Approved ✅',
          message: `Your $${deposit.amount.toFixed(2)} investment in ${plan.name} plan has been approved. Earnings will start accruing.`,
          type: 'success',
        },
      })

      // Send email notification
      const investUser = await db.user.findUnique({ where: { id: deposit.userId } })
      if (investUser) {
        const { sendInvestmentApproved } = await import('@/lib/email')
        sendInvestmentApproved(investUser.email, investUser.name, deposit.amount, plan.name).catch(() => {})
      }

      await db.activityLog.create({
        data: { userId: deposit.userId, action: 'investment_approved', details: JSON.stringify({ depositId, amount: deposit.amount, plan: plan.name }) },
      })

      return NextResponse.json({ success: true, status: 'approved' })
    }

    if (action === 'reject') {
      // Reject and refund the amount back to trading wallet
      await db.deposit.update({ where: { id: depositId }, data: { status: 'cancelled' } })

      // Refund to user's trading wallet
      await db.user.update({
        where: { id: deposit.userId },
        data: {
          tradingBalance: { increment: deposit.amount },
        },
      })

      await db.transactionLog.create({
        data: {
          userId: deposit.userId, type: 'bonus', amount: deposit.amount,
          wallet: 'trading', description: `Investment refund: ${deposit.plan.name} plan rejected. ${reason || ''}`,
          status: 'completed',
        },
      })

      await db.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Investment Rejected',
          message: `Your $${deposit.amount.toFixed(2)} investment in ${deposit.plan.name} was rejected and refunded. ${reason || ''}`,
          type: 'warning',
        },
      })

      await db.activityLog.create({
        data: { userId: deposit.userId, action: 'investment_rejected', details: JSON.stringify({ depositId, amount: deposit.amount, reason }) },
      })

      return NextResponse.json({ success: true, status: 'rejected' })
    }

    return NextResponse.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 })
  } catch (error) {
    console.error('Admin earnings PUT error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE - Delete an earning record (admin correction)
export async function DELETE(req: NextRequest) {
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

    const { earningId, userId, amount } = await req.json()
    if (!earningId) return NextResponse.json({ error: 'earningId required' }, { status: 400 })

    const earning = await db.earning.findUnique({ where: { id: earningId } })
    if (!earning) return NextResponse.json({ error: 'Earning not found' }, { status: 404 })

    // Remove the earning
    await db.earning.delete({ where: { id: earningId } })

    // Deduct from user's balance and totalEarnings
    if (earning.userId) {
      await db.user.update({
        where: { id: earning.userId },
        data: {
          totalEarnings: { decrement: earning.amount },
          tradingBalance: { decrement: earning.amount },
        },
      })
    }

    await db.activityLog.create({
      data: { userId: earning.userId, action: 'earning_deleted', details: JSON.stringify({ earningId, amount: earning.amount }) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin earnings DELETE error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
