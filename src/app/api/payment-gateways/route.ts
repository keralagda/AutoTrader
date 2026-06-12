import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public endpoint - returns active payment gateways for users
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

    const gateways = await db.paymentGateway.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        network: true,
        address: true,
        apiSecret: true,  // token contract address (for advanced setup display)
        webhookUrl: true, // explorer URL prefix (for advanced setup display)
        minAmount: true,
        maxAmount: true,
        feePercent: true,
        sortOrder: true,
        qrImage: true,
        instructions: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(gateways)
  } catch (error) {
    console.error('Failed to get public payment gateways:', error)
    return NextResponse.json([])
  }
}
