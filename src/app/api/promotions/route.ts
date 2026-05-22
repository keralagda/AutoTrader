import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const promotions = await db.promotion.findMany({
      where: { isActive: true, endDate: { gt: now } },
      orderBy: { endDate: 'asc' },
    })
    return NextResponse.json(promotions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get promotions' }, { status: 500 })
  }
}
