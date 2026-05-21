import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.plan.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...data }

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

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const createData: Record<string, unknown> = { ...data }

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

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    await db.plan.delete({ where: { id } })

    return NextResponse.json({ message: 'Plan deleted' })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
