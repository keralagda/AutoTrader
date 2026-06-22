import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_LOGIC = {
  variables: [
    { id: 'var_base_skew', name: 'Base Skew Power', type: 'slider', value: 3, min: 1, max: 10, step: 0.5 },
    { id: 'var_daily_cap', name: 'Daily Return Cap %', type: 'range', min: 5, max: 20, value: 15 },
    { id: 'var_min_floor', name: 'Minimum Floor %', type: 'slider', value: 0.1, min: 0, max: 1, step: 0.01 },
    { id: 'var_volatility', name: 'Volatility Factor', type: 'slider', value: 0.5, min: 0, max: 1, step: 0.05 },
    { id: 'var_compound_rate', name: 'Compound Bonus Rate', type: 'slider', value: 1.02, min: 1.0, max: 1.1, step: 0.005 },
    { id: 'var_referral_boost', name: 'Referral Network Boost', type: 'slider', value: 0.05, min: 0, max: 0.5, step: 0.01 },
    { id: 'var_loss_threshold', name: 'Loss Day Threshold', type: 'range', min: 0, max: 20, value: 5 },
    { id: 'var_bonus_threshold', name: 'Bonus Day Threshold', type: 'range', min: 0, max: 15, value: 3 },
  ],
  profitRules: [],
  calculatorRules: [],
  stackingRules: [],
  patterns: [],
  depositRules: [],
  riskRules: [],
}

async function checkDbConnection() {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

const dbErrorResponse = () => NextResponse.json({
  error: 'Database connection failed',
  diagnosticTrace: {
    message: 'Failed to connect to the database container or host.',
    actions: [
      'Check DB Container Status (running/healthy)',
      'Verify Network Bridge / port mappings',
      'Validate .env mapping (DATABASE_URL)'
    ]
  }
}, { status: 503 })

export async function GET() {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const defaultTemplateSetting = await db.setting.findUnique({ where: { key: 'default_logic_builder_config' } })
    const resolvedDefaultLogic = defaultTemplateSetting ? JSON.parse(defaultTemplateSetting.value) : DEFAULT_LOGIC

    const setting = await db.setting.findUnique({ where: { key: 'logic_builder_config' } })
    if (setting) {
      return NextResponse.json({ ...resolvedDefaultLogic, ...JSON.parse(setting.value) })
    }
    return NextResponse.json(resolvedDefaultLogic)
  } catch (error) {
    console.error('Public logic builder GET error:', error)
    const defaultTemplateSetting = await db.setting.findUnique({ where: { key: 'default_logic_builder_config' } }).catch(() => null)
    const resolvedDefaultLogic = defaultTemplateSetting ? JSON.parse(defaultTemplateSetting.value) : DEFAULT_LOGIC
    return NextResponse.json(resolvedDefaultLogic)
  }
}
