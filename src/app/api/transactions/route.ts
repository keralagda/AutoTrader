import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const where: any = { userId }
    if (type) where.type = type

    const [transactions, total] = await Promise.all([
      db.transactionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transactionLog.count({ where }),
    ])

    return NextResponse.json({ transactions, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get transactions' }, { status: 500 })
  }
}
