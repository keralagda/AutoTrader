import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get user's activated plans
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

    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Get user's activated plans from settings
    const setting = await db.setting.findUnique({ where: { key: `activated_plans_${userId}` } })
    const activatedPlanIds: string[] = setting ? JSON.parse(setting.value) : []

    // Get full plan details for activated plans
    const activatedPlans = activatedPlanIds.length > 0
      ? await db.plan.findMany({ where: { id: { in: activatedPlanIds }, isActive: true } })
      : []

    // Get all available plans for activation
    const allPlans = await db.plan.findMany({ where: { isActive: true }, orderBy: { entryFee: 'asc' } })

    return NextResponse.json({
      activatedPlans,
      activatedPlanIds,
      availablePlans: allPlans,
    })
  } catch (error) {
    console.error('Plan activation GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST - Activate a plan (pay entry fee)
export async function POST(req: NextRequest) {
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

    const { userId, planId } = await req.json()
    if (!userId || !planId) return NextResponse.json({ error: 'userId and planId required' }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Email verification check
    if (!user.isEmailVerified) {
      return NextResponse.json({ error: 'Email verification is required to activate plans.' }, { status: 403 })
    }

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    // Check if already activated
    const setting = await db.setting.findUnique({ where: { key: `activated_plans_${userId}` } })
    const activatedPlanIds: string[] = setting ? JSON.parse(setting.value) : []

    if (activatedPlanIds.includes(planId)) {
      return NextResponse.json({ error: 'Plan already activated' }, { status: 400 })
    }

    // Check balance for activation fee (entry fee)
    const activationFee = plan.entryFee
    if (user.tradingBalance < activationFee) {
      return NextResponse.json({ error: `Insufficient balance. Need $${activationFee} for activation. You have $${user.tradingBalance.toFixed(2)}` }, { status: 400 })
    }

    // Deduct activation fee and activate user
    const newBalance = user.tradingBalance - activationFee
    await db.user.update({
      where: { id: userId },
      data: {
        tradingBalance: newBalance,
        isActive: true,
      },
    })

    // Send account activated email if this is the first activation
    if (!user.isActive) {
      const { sendAccountActivated } = await import('@/lib/email')
      sendAccountActivated(user.email, user.name).catch(() => {})
    }

    // Save activated plan
    activatedPlanIds.push(planId)
    await db.setting.upsert({
      where: { key: `activated_plans_${userId}` },
      update: { value: JSON.stringify(activatedPlanIds) },
      create: { key: `activated_plans_${userId}`, value: JSON.stringify(activatedPlanIds) },
    })

    // Transaction log
    await db.transactionLog.create({
      data: {
        userId, type: 'fee', amount: -activationFee,
        balanceBefore: user.tradingBalance, balanceAfter: newBalance,
        wallet: 'trading', description: `Plan activation: ${plan.name} ($${activationFee} fee)`,
        status: 'completed',
      },
    })

    // Notification
    await db.notification.create({
      data: {
        userId,
        title: `${plan.name} Plan Activated! ✅`,
        message: `You've activated the ${plan.name} plan. Activation fee: $${activationFee}. You can now invest $${plan.minDeposit}-$${plan.maxDeposit.toLocaleString()} in this plan.`,
        type: 'success',
      },
    })

    return NextResponse.json({
      success: true,
      activatedPlan: plan.name,
      fee: activationFee,
      newBalance,
      message: `${plan.name} plan activated! You can now invest in this plan.`,
    })
  } catch (error) {
    console.error('Plan activation error:', error)
    return NextResponse.json({ error: 'Activation failed' }, { status: 500 })
  }
}
