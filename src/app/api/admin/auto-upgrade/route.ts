import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
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

    // Fetch all users with auto-upgrade enabled
    const users = await db.user.findMany({
      where: {
        autoUpgradeEnabled: true,
        isFake: false,
        NOT: { email: { contains: '@removed.local' } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        autoUpgradeEnabled: true,
        autoUpgradePercent: true,
        autoUpgradeAccumulated: true,
        autoUpgradeTargetPlanId: true,
        autoInvestmentEnabled: true,
        tradingBalance: true,
        createdAt: true,
      },
      orderBy: { autoUpgradeAccumulated: 'desc' },
    })

    // Fetch plans to map entry fee and details
    const plans = await db.plan.findMany({
      select: {
        id: true,
        name: true,
        entryFee: true,
      }
    })

    const plansMap = new Map(plans.map(p => [p.id, p]))

    const usersWithPlanDetails = users.map(u => {
      const plan = u.autoUpgradeTargetPlanId ? plansMap.get(u.autoUpgradeTargetPlanId) : null
      return {
        ...u,
        targetPlanName: plan?.name || 'Unknown Plan',
        targetPlanFee: plan?.entryFee || 0,
      }
    })

    // Compute aggregate statistics
    const totalUsersCount = users.length
    const totalAccumulated = users.reduce((sum, u) => sum + (u.autoUpgradeAccumulated || 0), 0)
    const averagePercent = totalUsersCount > 0 
      ? users.reduce((sum, u) => sum + (u.autoUpgradePercent || 0), 0) / totalUsersCount
      : 0

    return NextResponse.json({
      users: usersWithPlanDetails,
      stats: {
        totalUsersCount,
        totalAccumulated,
        averagePercent,
      }
    })
  } catch (error) {
    console.error('Failed to get auto-upgrade stats:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
