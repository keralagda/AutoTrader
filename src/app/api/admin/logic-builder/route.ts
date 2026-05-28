import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default logic rules
const DEFAULT_LOGIC = {
  profitRules: [
    { id: 'base', name: 'Base Daily Return', type: 'percentage', enabled: true, priority: 1, condition: 'always', action: 'use_risk_category', description: 'Apply risk category percentage (Low/Medium/High) from plan config' },
    { id: 'skew_low', name: 'Skew Toward Minimum', type: 'modifier', enabled: true, priority: 2, condition: 'always', action: 'power_curve', value: 3, description: 'Use cubic power curve to heavily favor lower end of range' },
    { id: 'weekday_only', name: 'Weekday Trading Only', type: 'schedule', enabled: false, priority: 3, condition: 'day_of_week', days: ['mon', 'tue', 'wed', 'thu', 'fri'], action: 'skip_if_not_match', description: 'Only distribute profits on weekdays' },
    { id: 'loss_day', name: 'Random Loss Day', type: 'modifier', enabled: false, priority: 4, condition: 'random_chance', chance: 5, action: 'multiply', value: -0.5, description: '5% chance of a loss day (negative return)' },
    { id: 'bonus_day', name: 'Random Bonus Day', type: 'modifier', enabled: false, priority: 5, condition: 'random_chance', chance: 3, action: 'multiply', value: 2.0, description: '3% chance of 2x bonus day' },
    { id: 'streak_bonus', name: 'Investment Streak Bonus', type: 'modifier', enabled: false, priority: 6, condition: 'deposit_age_days', minDays: 30, action: 'add_percent', value: 0.1, description: 'Add 0.1% bonus after 30 days of active deposit' },
    { id: 'vip_multiplier', name: 'VIP Tier Multiplier', type: 'modifier', enabled: false, priority: 7, condition: 'user_vip_tier', minTier: 'gold', action: 'multiply', value: 1.1, description: '10% bonus for Gold+ VIP users' },
    { id: 'max_cap', name: 'Daily Cap', type: 'cap', enabled: true, priority: 99, condition: 'always', action: 'cap_daily_percent', value: 15, description: 'Never exceed 15% daily regardless of other rules' },
  ],
  calculatorRules: [
    { id: 'calc_risk_range', name: 'Show Risk Range', type: 'display', enabled: true, description: 'Calculator shows min-max based on selected risk level' },
    { id: 'calc_skew_avg', name: 'Skewed Average', type: 'calculation', enabled: true, skewFactor: 0.35, description: 'Average shown in calculator is skewed toward minimum (35% of range instead of 50%)' },
  ],
  stackingRules: [
    { id: 'stack_bonus', name: 'Stack Bonus', type: 'stacking', enabled: true, bonusPerStack: 0.5, maxStacks: 5, description: 'Each additional stack adds 0.5% to daily rate' },
    { id: 'stack_compound', name: 'Compound on Reinvest', type: 'stacking', enabled: false, compoundRate: 1.02, description: 'Reinvested deposits get 2% compound bonus' },
  ],
  patterns: [
    { id: 'pattern_gradual', name: 'Gradual Increase', type: 'pattern', enabled: false, description: 'Returns start low and gradually increase over deposit lifetime', startMultiplier: 0.5, endMultiplier: 1.5, rampDays: 14 },
    { id: 'pattern_wave', name: 'Wave Pattern', type: 'pattern', enabled: false, description: 'Returns follow a sine wave pattern (peaks and valleys)', amplitude: 0.3, periodDays: 7 },
    { id: 'pattern_decay', name: 'Decay Pattern', type: 'pattern', enabled: false, description: 'Returns slowly decrease over time (encourages reinvestment)', decayRate: 0.01, minMultiplier: 0.5 },
  ],
}

// GET - Load logic config
export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'logic_builder_config' } })
    const config = setting ? { ...DEFAULT_LOGIC, ...JSON.parse(setting.value) } : DEFAULT_LOGIC
    return NextResponse.json(config)
  } catch (error) {
    console.error('Logic builder GET error:', error)
    return NextResponse.json(DEFAULT_LOGIC)
  }
}

// PUT - Save logic config
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    await db.setting.upsert({
      where: { key: 'logic_builder_config' },
      update: { value: JSON.stringify(body) },
      create: { key: 'logic_builder_config', value: JSON.stringify(body) },
    })

    await db.activityLog.create({
      data: { action: 'logic_builder_updated', details: JSON.stringify({ rulesCount: body.profitRules?.length || 0 }) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logic builder PUT error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
