import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    if (action === 'counts') {
      // Get deposit counts per plan (including fake profiles)
      const counts = await db.deposit.groupBy({
        by: ['planId'],
        where: { status: { in: ['active', 'locked', 'completed', 'ended'] } },
        _count: true,
      })
      const result: Record<string, number> = {}
      counts.forEach(c => { result[c.planId] = c._count })
      return NextResponse.json(result)
    }

    const plans = await db.plan.findMany({
      where: { isActive: true },
      include: { referralRules: true },
      orderBy: { entryFee: 'asc' },
    })
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 })
  }
}
