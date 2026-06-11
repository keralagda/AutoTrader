import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
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

    // Get all real users (excluding fake ones)
    const users = await db.user.findMany({
      where: { isFake: false },
    })

    let updatedCount = 0

    for (const user of users) {
      // 1. Calculate totalDeposited from confirmed payments + active/completed deposits
      const paymentsSum = await db.payment.aggregate({
        where: { userId: user.id, status: 'confirmed' },
        _sum: { amount: true },
      })
      const confirmedPayments = paymentsSum._sum.amount || 0

      const depositsSum = await db.deposit.aggregate({
        where: { userId: user.id, status: { in: ['active', 'locked', 'completed'] } },
        _sum: { amount: true },
      })
      const confirmedDeposits = depositsSum._sum.amount || 0

      // Use the max of confirmed payments vs deposits, or default to trading balance if they have an active plan
      const totalDeposited = Math.max(confirmedPayments, confirmedDeposits)

      // 2. Calculate totalEarnings from all earnings logs
      const earningsSum = await db.earning.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      })
      const totalEarnings = earningsSum._sum.amount || 0

      // 3. Update the user record
      await db.user.update({
        where: { id: user.id },
        data: {
          totalDeposited,
          totalEarnings,
        },
      })
      updatedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated and synchronized data for ${updatedCount} users.`,
    })
  } catch (error) {
    console.error('Manual sync platform data error:', error)
    return NextResponse.json({ error: 'Failed to synchronize data' }, { status: 500 })
  }
}
