import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
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

    const plans = await db.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { referralRules: true, conditionalLogics: true, pairingRules: true }
    })
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 })
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

    const { id, referralRules, conditionalLogics, pairingRules, ...data } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const updateData: any = { ...data }

    if (updateData.minReinvestAmount !== undefined) updateData.minReinvestAmount = Number(updateData.minReinvestAmount || 0)
    if (updateData.reinvestLockPeriod !== undefined) updateData.reinvestLockPeriod = Math.round(Number(updateData.reinvestLockPeriod || 0))
    if (updateData.reinvestBonus !== undefined) updateData.reinvestBonus = Number(updateData.reinvestBonus || 0)
    if (updateData.autoReinvest !== undefined) updateData.autoReinvest = Boolean(updateData.autoReinvest)

    // Auto-generate plain English descriptions only if not explicitly provided
    if (data.earningMechanism === undefined && (data.dailyEarningPercent !== undefined || data.maxEarningLimit !== undefined || data.autoCompound !== undefined)) {
      const daily = data.dailyEarningPercent ?? 0
      const cap = data.maxEarningLimit ?? 0
      const compound = data.autoCompound ? ' Auto-compound available to reinvest earnings.' : ''
      updateData.earningMechanism = `Daily earnings at ${daily}% of deposit amount, capped at $${cap.toLocaleString()} total. Earnings accrue Monday to Friday.${compound}`
    }

    if (data.withdrawalRule === undefined && (data.lockPeriodDays !== undefined || data.earlyExitPenalty !== undefined || data.autoCompound !== undefined)) {
      const lock = data.lockPeriodDays ?? 0
      const penalty = data.earlyExitPenalty ?? 0
      const lockText = lock > 0 ? `${lock}-day lock-in on principal.` : 'No lock-in period.'
      const penaltyText = penalty > 0 ? ` Early exit incurs ${penalty}% penalty on earnings.` : ''
      const compoundText = data.autoCompound ? ' Auto-compound earnings locked for cycle.' : ''
      updateData.withdrawalRule = lockText + penaltyText + compoundText
    }

    if (data.stackingRule === undefined && (data.stackingEnabled !== undefined || data.maxStacks !== undefined || data.stackingBonusPercent !== undefined)) {
      if (data.stackingEnabled) {
        updateData.stackingRule = `Up to ${data.maxStacks || 1} simultaneous deposits allowed. Each additional stack earns ${data.stackingBonusPercent || 0}% bonus on daily rate.`
      } else {
        updateData.stackingRule = 'Single deposit only per plan.'
      }
    }

    const plan = await db.plan.update({
      where: { id },
      data: updateData,
    })

    if (referralRules && Array.isArray(referralRules)) {
      await db.planReferralRule.deleteMany({ where: { planId: id } })
      if (referralRules.length > 0) {
        await db.planReferralRule.createMany({
          data: referralRules.map((r: any) => ({
            planId: id,
            level: Number(r.level),
            commission: Number(r.commission || 0),
            amount: Number(r.amount || 0),
            type: r.type || 'registration',
            minSponsorDeposit: Number(r.minSponsorDeposit || 0),
            minDirectReferrals: Number(r.minDirectReferrals || 0),
            targetWallet: r.targetWallet || 'trading',
            enabled: r.enabled !== false,
          }))
        })
      }
    }

    if (conditionalLogics && Array.isArray(conditionalLogics)) {
      await db.planConditionalLogic.deleteMany({ where: { planId: id } })
      if (conditionalLogics.length > 0) {
        await db.planConditionalLogic.createMany({
          data: conditionalLogics.map((l: any) => ({
            planId: id,
            enabled: l.enabled !== false,
            priority: Number(l.priority || 1),
            conditionType: l.conditionType,
            operator: l.operator,
            value: String(l.value),
            actionType: l.actionType,
            actionValue: String(l.actionValue),
            description: l.description || '',
          }))
        })
      }
    }
    if (pairingRules && Array.isArray(pairingRules)) {
      await db.planPairingRule.deleteMany({ where: { planId: id } })
      if (pairingRules.length > 0) {
        await db.planPairingRule.createMany({
          data: pairingRules.map((r: any) => ({
            planId: id,
            levelRange: r.levelRange,
            ratio: r.ratio || '100:100',
            bonusType: r.bonusType || 'percent',
            bonusValue: Number(r.bonusValue ?? 10.0),
            minDirectLeft: Number(r.minDirectLeft ?? 0),
            minDirectRight: Number(r.minDirectRight ?? 0),
            minPersonalIv: Number(r.minPersonalIv ?? 0),
            minTeamTv: Number(r.minTeamTv ?? 0),
            perks: r.perks || '',
          }))
        })
      }
    }

    const updatedPlan = await db.plan.findUnique({
      where: { id },
      include: { referralRules: true, conditionalLogics: true, pairingRules: true }
    })

    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

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

    const data = await request.json()

    // Remove fields that shouldn't be in create
    const { id, createdAt, updatedAt, deposits, isEditing, isNew, isExpanded, referralRules, conditionalLogics, pairingRules, ...createData } = data as any

    createData.minReinvestAmount = Number(createData.minReinvestAmount || 0)
    createData.reinvestLockPeriod = Math.round(Number(createData.reinvestLockPeriod || 0))
    createData.reinvestBonus = Number(createData.reinvestBonus || 0)
    createData.autoReinvest = Boolean(createData.autoReinvest)

    // Auto-generate plain English descriptions as fallback
    const daily = data.dailyEarningPercent ?? 0
    const cap = data.maxEarningLimit ?? 0
    const compound = data.autoCompound ? ' Auto-compound available to reinvest earnings.' : ''
    createData.earningMechanism = data.earningMechanism ||
      `Daily earnings at ${daily}% of deposit amount, capped at $${cap.toLocaleString()} total. Earnings accrue Monday to Friday.${compound}`

    const lock = data.lockPeriodDays ?? 0
    const penalty = data.earlyExitPenalty ?? 0
    const lockText = lock > 0 ? `${lock}-day lock-in on principal.` : 'No lock-in period. Earnings available for withdrawal anytime.'
    const penaltyText = penalty > 0 ? ` Early exit incurs ${penalty}% penalty on earnings.` : ''
    const compoundText = data.autoCompound ? ' Auto-compound earnings locked for cycle.' : ''
    createData.withdrawalRule = data.withdrawalRule || lockText + penaltyText + compoundText

    if (data.stackingEnabled) {
      createData.stackingRule = data.stackingRule ||
        `Up to ${data.maxStacks || 1} simultaneous deposits allowed. Each additional stack earns ${data.stackingBonusPercent || 0}% bonus on daily rate.`
    } else {
      createData.stackingRule = data.stackingRule || 'Single deposit only per plan.'
    }

    const plan = await db.plan.create({ data: createData })

    if (referralRules && Array.isArray(referralRules) && referralRules.length > 0) {
      await db.planReferralRule.createMany({
        data: referralRules.map((r: any) => ({
          planId: plan.id,
          level: Number(r.level),
          commission: Number(r.commission || 0),
          amount: Number(r.amount || 0),
          type: r.type || 'registration',
          minSponsorDeposit: Number(r.minSponsorDeposit || 0),
          minDirectReferrals: Number(r.minDirectReferrals || 0),
          targetWallet: r.targetWallet || 'trading',
          enabled: r.enabled !== false,
        }))
      })
    }

    if (conditionalLogics && Array.isArray(conditionalLogics) && conditionalLogics.length > 0) {
      await db.planConditionalLogic.createMany({
        data: conditionalLogics.map((l: any) => ({
          planId: plan.id,
          enabled: l.enabled !== false,
          priority: Number(l.priority || 1),
          conditionType: l.conditionType,
          operator: l.operator,
          value: String(l.value),
          actionType: l.actionType,
          actionValue: String(l.actionValue),
          description: l.description || '',
        }))
      })
    }
    if (pairingRules && Array.isArray(pairingRules) && pairingRules.length > 0) {
      await db.planPairingRule.createMany({
        data: pairingRules.map((r: any) => ({
          planId: plan.id,
          levelRange: r.levelRange,
          ratio: r.ratio || '100:100',
          bonusType: r.bonusType || 'percent',
          bonusValue: Number(r.bonusValue ?? 10.0),
          minDirectLeft: Number(r.minDirectLeft ?? 0),
          minDirectRight: Number(r.minDirectRight ?? 0),
          minPersonalIv: Number(r.minPersonalIv ?? 0),
          minTeamTv: Number(r.minTeamTv ?? 0),
          perks: r.perks || '',
        }))
      })
    }

    const createdPlan = await db.plan.findUnique({
      where: { id: plan.id },
      include: { referralRules: true, conditionalLogics: true, pairingRules: true }
    })

    return NextResponse.json(createdPlan, { status: 201 })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    // Check if plan has active deposits
    const depositCount = await db.deposit.count({ where: { planId: id } })
    if (depositCount > 0) {
      // Soft delete: just deactivate
      await db.plan.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: 'Plan deactivated (has existing deposits)' })
    }

    await db.plan.delete({ where: { id } })
    return NextResponse.json({ message: 'Plan deleted' })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
