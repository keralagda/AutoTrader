import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { runProfitDistribution } from '@/lib/profit-distributor'

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

    // Auth check - accept multiple auth methods
    const cronSecret = process.env.CRON_SECRET || 'bnfx-cron-2026'
    const xCronSecret = request.headers.get('x-cron-secret')
    const authorizationHeader = request.headers.get('authorization')
    const vercelAuth = authorizationHeader?.replace('Bearer ', '')

    // Validate: at least one auth method must match (or no auth header = admin manual trigger)
    const hasAuthHeader = xCronSecret || authorizationHeader
    if (hasAuthHeader && xCronSecret !== cronSecret && vercelAuth !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runProfitDistribution()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Cron profit distribution error:', error)
    return NextResponse.json({ error: 'Failed to distribute profits' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const lastRun = await db.activityLog.findFirst({
      where: { action: 'cron_profit_distribution' },
      orderBy: { createdAt: 'desc' },
    })

    const activeDeposits = await db.deposit.count({ where: { status: { in: ['active', 'locked'] } } })
    const dueDeposits = await db.deposit.count({
      where: { status: 'active', nextProfitAt: { lte: new Date() } },
    })

    return NextResponse.json({
      lastRun: lastRun ? JSON.parse(lastRun.details || '{}') : null,
      lastRunAt: lastRun?.createdAt || null,
      activeDeposits,
      dueDeposits,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get cron status' }, { status: 500 })
  }
}
