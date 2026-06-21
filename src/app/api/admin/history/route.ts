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

    // Fetch the 10 most recent payments (deposits)
    const deposits = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    // Fetch the 10 most recent plan deposits (investments)
    const investments = await db.deposit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
    })

    return NextResponse.json({
      deposits,
      investments,
    })
  } catch (error) {
    console.error('Failed to get history logs:', error)
    return NextResponse.json({ error: 'Failed to get history logs' }, { status: 500 })
  }
}
