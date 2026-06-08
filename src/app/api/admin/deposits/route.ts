import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendDepositConfirmation } from '@/lib/email'

// GET - List all fund deposits (payments) for admin review
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // "pending", "confirmed", "failed"

    const where: any = {}
    if (status) where.status = status

    const payments = await db.payment.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get deposits' }, { status: 500 })
  }
}

// PUT - Confirm or reject a pending deposit
export async function PUT(request: Request) {
  try {
    const { paymentId, action, adminId } = await request.json() // action: "confirm" or "reject"

    if (!paymentId || !action) {
      return NextResponse.json({ error: 'Payment ID and action required' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    if (action === 'confirm') {
      // Update payment status atomically ensuring status is still pending (concurrency guard)
      const updateResult = await db.payment.updateMany({
        where: { id: paymentId, status: 'pending' },
        data: { status: 'confirmed' }
      })

      if (updateResult.count === 0) {
        return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
      }

      // Credit user's trading wallet
      const user = await db.user.findUnique({ where: { id: payment.userId } })
      if (user) {
        const newBalance = user.tradingBalance + payment.amount
        await db.user.update({
          where: { id: user.id },
          data: {
            tradingBalance: newBalance,
            totalDeposited: user.totalDeposited + payment.amount,
          },
        })

        // Transaction log
        await db.transactionLog.create({
          data: {
            userId: user.id, type: 'deposit', amount: payment.amount,
            balanceBefore: user.tradingBalance, balanceAfter: newBalance,
            wallet: 'trading', description: `Deposit confirmed via ${payment.method}`,
            referenceId: paymentId, status: 'completed',
          },
        })

        // Notification
        await db.notification.create({
          data: {
            userId: user.id, title: 'Deposit Confirmed',
            message: `Your deposit of $${payment.amount.toFixed(2)} has been confirmed and added to your trading wallet.`,
            type: 'success',
          },
        })

        // Send email (non-blocking)
        sendDepositConfirmation(user.email, user.name, payment.amount).catch(() => {})

        // Referral bonus: credit upline on deposit based on custom rules
        const depositRules = await db.planReferralRule.findMany({
          where: { planId: payment.planId || '', type: 'deposit', enabled: true }
        })

        const REFERRAL_DEPOSIT_PERCENTS = [5, 3, 2, 1, 1, 0.5, 0.5] // 7 levels default
        const planObj = payment.planId ? await db.plan.findUnique({ where: { id: payment.planId } }) : null
        const maxLevels = planObj?.registrationReferralLevels || 7

        let currentReferrerId = user.referredById
        let level = 0
        while (currentReferrerId && level < maxLevels) {
          const referrer = await db.user.findUnique({ where: { id: currentReferrerId } })
          if (!referrer) break

          const directReferrals = await db.user.count({ where: { referredById: referrer.id } })
          const activeDepositsList = await db.deposit.findMany({
            where: { userId: referrer.id, status: 'active' },
            select: { amount: true }
          })
          const activeDepositsTotal = activeDepositsList.reduce((sum, d) => sum + d.amount, 0)

          const rule = depositRules.find(r => r.level === (level + 1))
          let bonus = 0

          if (rule) {
            if (activeDepositsTotal >= rule.minSponsorDeposit && directReferrals >= rule.minDirectReferrals) {
              bonus = rule.amount > 0 ? rule.amount : (payment.amount * rule.commission) / 100
            }
          } else {
            const rate = REFERRAL_DEPOSIT_PERCENTS[level] !== undefined ? REFERRAL_DEPOSIT_PERCENTS[level] : 0
            bonus = (payment.amount * rate) / 100
          }

          if (bonus > 0) {
            const targetWallet = rule?.targetWallet === 'withdrawal' ? 'withdrawal' : 'trading'
            if (targetWallet === 'withdrawal') {
              await db.user.update({
                where: { id: referrer.id },
                data: {
                  withdrawalBalance: referrer.withdrawalBalance + bonus,
                  totalEarnings: referrer.totalEarnings + bonus
                }
              })
            } else {
              await db.user.update({
                where: { id: referrer.id },
                data: {
                  tradingBalance: referrer.tradingBalance + bonus,
                  totalEarnings: referrer.totalEarnings + bonus
                }
              })
            }

            await db.earning.create({
              data: {
                userId: referrer.id,
                depositId: null,
                amount: bonus,
                type: 'referral',
                level: level + 1,
                walletTarget: targetWallet
              }
            })

            await db.notification.create({
              data: {
                userId: referrer.id,
                title: 'Referral Bonus!',
                message: `You earned $${bonus.toFixed(2)} from ${user.name}'s deposit (Level ${level + 1})`,
                type: 'referral'
              }
            })

            // Send referral bonus email
            const { sendReferralBonus } = await import('@/lib/email')
            sendReferralBonus(referrer.email, referrer.name, bonus, user.name, level + 1).catch(() => {})
          }
          currentReferrerId = referrer.referredById
          level++
        }
      }

      // Activity log
      await db.activityLog.create({
        data: { userId: adminId, action: 'deposit_confirmed', details: JSON.stringify({ paymentId, amount: payment.amount, userId: payment.userId }) },
      })

      return NextResponse.json({ success: true, status: 'confirmed' })
    } else if (action === 'reject') {
      // Update payment status atomically ensuring status is still pending (concurrency guard)
      const updateResult = await db.payment.updateMany({
        where: { id: paymentId, status: 'pending' },
        data: { status: 'failed' }
      })

      if (updateResult.count === 0) {
        return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
      }

      // Notification
      await db.notification.create({
        data: {
          userId: payment.userId, title: 'Deposit Rejected',
          message: `Your deposit of $${payment.amount.toFixed(2)} was rejected. Please contact support.`,
          type: 'warning',
        },
      })

      await db.activityLog.create({
        data: { userId: adminId, action: 'deposit_rejected', details: JSON.stringify({ paymentId, amount: payment.amount, userId: payment.userId }) },
      })

      return NextResponse.json({ success: true, status: 'rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 })
  }
}
