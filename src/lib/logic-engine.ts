import { db } from './db'

export interface EvaluationContext {
  planId: string
  dailyPercent: number
  spotsFilled: number
  activeDepositsTotal: number
  consecutiveLossDays: number
  dayOfWeek: string // "mon", "tue", etc.
  maxEarningMultiplier: number
  pauseReferrals: boolean
  accountHolderPercent: number
  tradeProfitSharePercent: number
  platformFeePercent: number
  disablePlan: boolean
}

function evalCondition(val: any, op: string, compareVal: string): boolean {
  const numVal = parseFloat(val)
  const numCompare = parseFloat(compareVal)

  if (op === '>' && !isNaN(numVal) && !isNaN(numCompare)) return numVal > numCompare
  if (op === '<' && !isNaN(numVal) && !isNaN(numCompare)) return numVal < numCompare
  if (op === '==' && !isNaN(numVal) && !isNaN(numCompare)) return numVal === numCompare
  if (op === '==' && typeof val === 'string') return val === compareVal.toLowerCase()
  if (op === 'contains' && typeof val === 'string') return compareVal.toLowerCase().includes(val)

  return false
}

export async function evaluatePlanLogics(
  planId: string,
  initialYield: number,
  planObj: any
): Promise<{
  dailyPercent: number
  maxEarningMultiplier: number
  pauseReferrals: boolean
  accountHolderPercent: number
  tradeProfitSharePercent: number
  platformFeePercent: number
  disablePlan: boolean
}> {
  // Determine context values
  const spotsFilled = await db.deposit.count({ where: { planId, status: 'active' } })
  const activeDepositsList = await db.deposit.findMany({
    where: { planId, status: 'active' },
    select: { amount: true }
  })
  const activeDepositsTotal = activeDepositsList.reduce((sum, d) => sum + d.amount, 0)

  const pnlLogs = await db.planPnLLog.findMany({
    where: { planId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  let consecutiveLossDays = 0
  for (const log of pnlLogs) {
    if (log.isLoss) consecutiveLossDays++
    else break
  }

  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()

  const ctx: EvaluationContext = {
    planId,
    dailyPercent: initialYield,
    spotsFilled,
    activeDepositsTotal,
    consecutiveLossDays,
    dayOfWeek,
    maxEarningMultiplier: planObj.maxEarningMultiplier ?? 2.0,
    pauseReferrals: false,
    accountHolderPercent: planObj.accountHolderPercent ?? 75.0,
    tradeProfitSharePercent: planObj.tradeProfitSharePercent ?? 20.0,
    platformFeePercent: planObj.platformFeePercent ?? 5.0,
    disablePlan: false
  }

  // Load rules
  const logics = await db.planConditionalLogic.findMany({
    where: { planId, enabled: true },
    orderBy: { priority: 'asc' }
  })

  for (const logic of logics) {
    let triggered = false
    if (logic.conditionType === 'daily_yield') {
      triggered = evalCondition(ctx.dailyPercent, logic.operator, logic.value)
    } else if (logic.conditionType === 'consecutive_loss_days') {
      triggered = evalCondition(ctx.consecutiveLossDays, logic.operator, logic.value)
    } else if (logic.conditionType === 'active_deposits') {
      triggered = evalCondition(ctx.activeDepositsTotal, logic.operator, logic.value)
    } else if (logic.conditionType === 'day_of_week') {
      triggered = evalCondition(ctx.dayOfWeek, logic.operator, logic.value)
    } else if (logic.conditionType === 'spots_filled') {
      triggered = evalCondition(ctx.spotsFilled, logic.operator, logic.value)
    }

    if (triggered) {
      if (logic.actionType === 'adjust_yield') {
        const val = logic.actionValue
        if (val.startsWith('+') || val.startsWith('-')) {
          ctx.dailyPercent += parseFloat(val) || 0
        } else {
          ctx.dailyPercent = parseFloat(val) || 0
        }
      } else if (logic.actionType === 'adjust_multiplier') {
        ctx.maxEarningMultiplier = parseFloat(logic.actionValue) || 2.0
      } else if (logic.actionType === 'pause_referrals') {
        ctx.pauseReferrals = logic.actionValue === 'true'
      } else if (logic.actionType === 'adjust_splits') {
        const parts = logic.actionValue.split(',')
        parts.forEach(p => {
          const [key, vStr] = p.split(':')
          const v = parseFloat(vStr) || 0
          if (key === 'holder') ctx.accountHolderPercent = v
          else if (key === 'shared') ctx.tradeProfitSharePercent = v
          else if (key === 'platform') ctx.platformFeePercent = v
        })
      } else if (logic.actionType === 'disable_plan') {
        ctx.disablePlan = logic.actionValue === 'true'
      }
    }
  }

  return {
    dailyPercent: ctx.dailyPercent,
    maxEarningMultiplier: ctx.maxEarningMultiplier,
    pauseReferrals: ctx.pauseReferrals,
    accountHolderPercent: ctx.accountHolderPercent,
    tradeProfitSharePercent: ctx.tradeProfitSharePercent,
    platformFeePercent: ctx.platformFeePercent,
    disablePlan: ctx.disablePlan
  }
}
