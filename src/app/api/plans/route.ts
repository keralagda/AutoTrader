import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { entryFee: 'asc' },
    })
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 })
  }
}
