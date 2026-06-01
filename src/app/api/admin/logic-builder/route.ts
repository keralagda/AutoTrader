import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Advanced Logic Builder with variables, ranges, sliders, and granular control
const DEFAULT_LOGIC = {
  // ─── Global Variables (reusable across rules) ───
  variables: [
    { id: 'var_base_skew', name: 'Base Skew Power', type: 'slider', value: 3, min: 1, max: 10, step: 0.5, description: 'Power curve exponent (higher = more skewed to minimum)' },
    { id: 'var_daily_cap', name: 'Daily Return Cap %', type: 'range', min: 5, max: 20, value: 15, description: 'Maximum daily return percentage regardless of other rules' },
    { id: 'var_min_floor', name: 'Minimum Floor %', type: 'slider', value: 0.1, min: 0, max: 1, step: 0.01, description: 'Absolute minimum daily return (floor)' },
    { id: 'var_volatility', name: 'Volatility Factor', type: 'slider', value: 0.5, min: 0, max: 1, step: 0.05, description: 'How much daily returns vary (0=stable, 1=highly volatile)' },
    { id: 'var_compound_rate', name: 'Compound Bonus Rate', type: 'slider', value: 1.02, min: 1.0, max: 1.1, step: 0.005, description: 'Multiplier applied on reinvestment' },
    { id: 'var_referral_boost', name: 'Referral Network Boost', type: 'slider', value: 0.05, min: 0, max: 0.5, step: 0.01, description: 'Extra % per active referral in network' },
    { id: 'var_loss_threshold', name: 'Loss Day Threshold', type: 'range', min: 0, max: 20, value: 5, description: 'Percentage chance of a loss day occurring' },
    { id: 'var_bonus_threshold', name: 'Bonus Day Threshold', type: 'range', min: 0, max: 15, value: 3, description: 'Percentage chance of a bonus day occurring' },
  ],

  // ─── Profit Distribution Rules ───
  profitRules: [
    { id: 'base', name: 'Base Daily Return', type: 'percentage', enabled: true, priority: 1, condition: 'always', action: 'use_risk_category', description: 'Apply risk category percentage (Low/Medium/High) from plan config', variableRef: null },
    { id: 'skew_low', name: 'Skew Toward Minimum', type: 'modifier', enabled: true, priority: 2, condition: 'always', action: 'power_curve', value: 3, min: 1, max: 10, step: 0.5, description: 'Power curve to favor lower returns', variableRef: 'var_base_skew' },
    { id: 'volatility', name: 'Daily Volatility', type: 'modifier', enabled: true, priority: 3, condition: 'always', action: 'add_noise', value: 0.5, min: 0, max: 1, step: 0.05, description: 'Add random noise to daily returns for realistic variation', variableRef: 'var_volatility' },
    { id: 'weekday_only', name: 'Weekday Trading Only', type: 'schedule', enabled: false, priority: 4, condition: 'day_of_week', days: ['mon', 'tue', 'wed', 'thu', 'fri'], action: 'skip_if_not_match', description: 'Only distribute profits on weekdays' },
    { id: 'weekend_reduced', name: 'Weekend Reduced Returns', type: 'schedule', enabled: false, priority: 4, condition: 'day_of_week', days: ['sat', 'sun'], action: 'multiply', value: 0.3, min: 0, max: 1, step: 0.1, description: 'Reduce returns to 30% on weekends' },
    { id: 'loss_day', name: 'Random Loss Day', type: 'modifier', enabled: false, priority: 5, condition: 'random_chance', chance: 5, action: 'multiply', value: -0.5, min: -1, max: 0, step: 0.1, description: 'Chance of negative return day', variableRef: 'var_loss_threshold' },
    { id: 'bonus_day', name: 'Random Bonus Day', type: 'modifier', enabled: false, priority: 6, condition: 'random_chance', chance: 3, action: 'multiply', value: 2.0, min: 1.5, max: 5, step: 0.5, description: 'Chance of multiplied return day', variableRef: 'var_bonus_threshold' },
    { id: 'streak_bonus', name: 'Investment Age Bonus', type: 'modifier', enabled: false, priority: 7, condition: 'deposit_age_days', minDays: 30, maxDays: 365, action: 'add_percent', value: 0.1, min: 0, max: 1, step: 0.05, description: 'Bonus % added based on deposit age' },
    { id: 'amount_tier', name: 'Amount-Based Tier Bonus', type: 'modifier', enabled: false, priority: 8, condition: 'deposit_amount', tiers: [{ min: 0, max: 500, bonus: 0 }, { min: 500, max: 2000, bonus: 0.1 }, { min: 2000, max: 10000, bonus: 0.2 }, { min: 10000, max: 999999, bonus: 0.3 }], action: 'add_percent', description: 'Higher deposits get bonus percentage' },
    { id: 'vip_multiplier', name: 'VIP Tier Multiplier', type: 'modifier', enabled: false, priority: 9, condition: 'user_vip_tier', tiers: { bronze: 1.0, silver: 1.02, gold: 1.05, platinum: 1.08, diamond: 1.12 }, action: 'multiply', description: 'VIP tier-based return multiplier' },
    { id: 'referral_boost', name: 'Referral Network Boost', type: 'modifier', enabled: false, priority: 10, condition: 'referral_count', minReferrals: 3, action: 'add_percent', value: 0.05, min: 0, max: 0.5, step: 0.01, description: 'Extra % per active referral', variableRef: 'var_referral_boost' },
    { id: 'time_of_day', name: 'Time-of-Day Modifier', type: 'schedule', enabled: false, priority: 11, condition: 'hour_range', startHour: 9, endHour: 17, action: 'multiply', value: 1.1, description: 'Higher returns during market hours (9AM-5PM UTC)' },
    { id: 'monthly_cycle', name: 'Monthly Cycle', type: 'schedule', enabled: false, priority: 12, condition: 'day_of_month', peakDays: [1, 15], troughDays: [7, 21], peakMultiplier: 1.2, troughMultiplier: 0.8, description: 'Returns peak on 1st/15th, dip on 7th/21st' },
    { id: 'min_floor', name: 'Minimum Floor', type: 'cap', enabled: true, priority: 98, condition: 'always', action: 'floor_daily_percent', value: 0.1, min: 0, max: 1, step: 0.01, description: 'Never go below this % daily', variableRef: 'var_min_floor' },
    { id: 'max_cap', name: 'Maximum Cap', type: 'cap', enabled: true, priority: 99, condition: 'always', action: 'cap_daily_percent', value: 15, min: 1, max: 30, step: 0.5, description: 'Never exceed this % daily', variableRef: 'var_daily_cap' },
  ],

  // ─── Calculator Display Rules ───
  calculatorRules: [
    { id: 'calc_risk_range', name: 'Show Risk Range', type: 'display', enabled: true, description: 'Calculator shows min-max based on selected risk level' },
    { id: 'calc_skew_avg', name: 'Skewed Average Display', type: 'calculation', enabled: true, skewFactor: 0.35, min: 0.1, max: 0.9, step: 0.05, description: 'Average shown is skewed toward minimum (0.35 = 35% of range)' },
    { id: 'calc_show_monthly', name: 'Show Monthly Projection', type: 'display', enabled: true, tradingDaysPerMonth: 22, description: 'Show estimated monthly earnings (trading days)' },
    { id: 'calc_show_yearly', name: 'Show Yearly Projection', type: 'display', enabled: false, tradingDaysPerYear: 252, description: 'Show estimated yearly earnings' },
    { id: 'calc_disclaimer', name: 'Risk Disclaimer', type: 'display', enabled: true, text: 'Returns are variable and not guaranteed. Past performance does not indicate future results.', description: 'Show disclaimer below calculator' },
  ],

  // ─── Stacking & Compound Rules ───
  stackingRules: [
    { id: 'stack_bonus', name: 'Stack Bonus Per Deposit', type: 'stacking', enabled: true, bonusPerStack: 0.5, min: 0, max: 5, step: 0.1, maxStacks: 5, description: 'Each additional stack adds bonus % to daily rate' },
    { id: 'stack_compound', name: 'Compound on Reinvest', type: 'stacking', enabled: false, compoundRate: 1.02, min: 1.0, max: 1.2, step: 0.005, description: 'Reinvested deposits get compound bonus multiplier', variableRef: 'var_compound_rate' },
    { id: 'stack_diminishing', name: 'Diminishing Stack Returns', type: 'stacking', enabled: false, diminishRate: 0.9, description: 'Each stack earns 90% of the previous (prevents infinite stacking abuse)' },
    { id: 'stack_lock_bonus', name: 'Lock Period Bonus', type: 'stacking', enabled: false, bonusPerLockDay: 0.01, maxLockBonus: 1.0, description: 'Extra % per day of lock period chosen' },
    { id: 'stack_amount_scaling', name: 'Amount-Based Stack Scaling', type: 'stacking', enabled: false, scaleFactor: 0.001, description: 'Stack bonus scales with deposit amount ($1000 = +1% extra)' },
  ],

  // ─── Time-Based Patterns ───
  patterns: [
    { id: 'pattern_gradual', name: 'Gradual Ramp-Up', type: 'pattern', enabled: false, startMultiplier: 0.5, endMultiplier: 1.5, rampDays: 14, min: 1, max: 60, step: 1, description: 'Returns start low and increase over time' },
    { id: 'pattern_wave', name: 'Sine Wave', type: 'pattern', enabled: false, amplitude: 0.3, periodDays: 7, min: 3, max: 30, step: 1, description: 'Returns oscillate in a wave pattern' },
    { id: 'pattern_decay', name: 'Exponential Decay', type: 'pattern', enabled: false, decayRate: 0.01, minMultiplier: 0.5, description: 'Returns decrease over time (encourages reinvestment)' },
    { id: 'pattern_sawtooth', name: 'Sawtooth (Reset Weekly)', type: 'pattern', enabled: false, peakDay: 5, resetMultiplier: 0.6, peakMultiplier: 1.4, description: 'Returns build up Mon-Fri then reset on Monday' },
    { id: 'pattern_random_walk', name: 'Random Walk', type: 'pattern', enabled: false, stepSize: 0.1, min: 0.01, max: 0.5, step: 0.01, meanReversion: 0.3, description: 'Returns follow a random walk with mean reversion' },
    { id: 'pattern_seasonal', name: 'Seasonal (Monthly)', type: 'pattern', enabled: false, highMonths: [1, 3, 5, 7, 9, 11], lowMonths: [2, 4, 6, 8, 10, 12], highMultiplier: 1.2, lowMultiplier: 0.8, description: 'Alternating high/low months' },
  ],

  // ─── Deposit & Earning Rules (Advanced) ───
  depositRules: [
    { id: 'dep_require_activation', name: 'Require Plan Activation', type: 'config', enabled: true, description: 'Users must activate (pay entry fee) a plan before they can invest in it. New Investment button is disabled until a plan is activated.' },
    { id: 'dep_cooldown', name: 'Investment Cooldown', type: 'timing', enabled: false, cooldownHours: 24, description: 'Minimum time between investments in same plan' },
    { id: 'dep_max_daily', name: 'Max Daily Investment', type: 'limit', enabled: false, maxAmount: 10000, description: 'Maximum total investment per user per day' },
    { id: 'dep_progressive_unlock', name: 'Progressive Plan Unlock', type: 'progression', enabled: false, requirements: [{ plan: 'Starter', minDays: 0 }, { plan: 'Silver', minDays: 7 }, { plan: 'Gold', minDays: 30 }, { plan: 'Platinum', minDays: 60 }], description: 'Users must invest in lower plans first before unlocking higher ones' },
    { id: 'dep_early_exit_scale', name: 'Scaled Early Exit Penalty', type: 'penalty', enabled: false, penaltySchedule: [{ daysBelow: 7, penalty: 20 }, { daysBelow: 14, penalty: 10 }, { daysBelow: 30, penalty: 5 }], description: 'Early exit penalty decreases over time' },
    { id: 'dep_auto_upgrade', name: 'Auto Plan Upgrade', type: 'automation', enabled: false, upgradeThreshold: 2.0, description: 'Auto-upgrade to next plan when earnings reach 2x deposit' },
    { id: 'dep_profit_lock', name: 'Profit Lock Period', type: 'timing', enabled: false, lockHours: 48, description: 'Profits locked for 48h before available for withdrawal' },
    { id: 'dep_reinvest_minimum', name: 'Minimum Reinvest Amount', type: 'limit', enabled: false, minAmount: 50, description: 'Minimum amount required to reinvest' },
    { id: 'dep_earning_schedule', name: 'Earning Distribution Schedule', type: 'schedule', enabled: true, frequency: 'daily', hour: 0, minute: 0, timezone: 'UTC', description: 'When daily earnings are distributed' },
    { id: 'dep_capital_return_mode', name: 'Capital Return Mode', type: 'config', enabled: true, modes: ['included', 'end', 'none', 'partial'], defaultMode: 'included', partialPercent: 50, description: 'How principal is returned at plan end' },
    { id: 'dep_max_earning_action', name: 'Max Earning Reached Action', type: 'config', enabled: true, actions: ['complete', 'reduce_rate', 'auto_reinvest'], defaultAction: 'complete', reducedRate: 0.5, description: 'What happens when max earning limit is reached' },
  ],

  // ─── Risk Engine Rules ───
  riskRules: [
    { id: 'risk_dynamic', name: 'Dynamic Risk Adjustment', type: 'risk', enabled: false, adjustInterval: 'weekly', maxAdjust: 0.5, description: 'Auto-adjust risk ranges based on platform profitability' },
    { id: 'risk_user_history', name: 'User History Factor', type: 'risk', enabled: false, loyaltyBonus: 0.1, minDays: 90, description: 'Long-term users get slightly better rates' },
    { id: 'risk_platform_load', name: 'Platform Load Balancing', type: 'risk', enabled: false, highLoadReduction: 0.2, threshold: 80, description: 'Reduce returns when platform has high active deposits (>80% capacity)' },
    { id: 'risk_market_correlation', name: 'Market Correlation', type: 'risk', enabled: false, correlationFactor: 0.1, description: 'Slightly correlate returns with actual crypto market movement' },
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
      data: { action: 'logic_builder_updated', details: JSON.stringify({ rulesCount: (body.profitRules?.length || 0) + (body.depositRules?.length || 0) + (body.riskRules?.length || 0) }) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logic builder PUT error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
