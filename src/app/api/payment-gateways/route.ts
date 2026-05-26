import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint - returns active payment gateways for users
export async function GET() {
  try {
    const gateways = await db.paymentGateway.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        network: true,
        address: true,
        minAmount: true,
        maxAmount: true,
        feePercent: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(gateways)
  } catch (error) {
    return NextResponse.json([])
  }
}
