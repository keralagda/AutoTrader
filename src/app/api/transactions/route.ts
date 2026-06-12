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

    const [allLogs, pendingPayments] = await Promise.all([
      db.transactionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      (!type || type === 'deposit')
        ? db.payment.findMany({
            where: {
              userId,
              status: { in: ['pending', 'failed'] },
              planId: null,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ])

    const paymentTransactions = pendingPayments.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      type: 'deposit',
      amount: p.amount,
      balanceBefore: 0,
      balanceAfter: 0,
      wallet: 'trading',
      description: `Manual deposit (${p.method}) - Ref: ${p.upiRef || p.txHash || 'Pending'}`,
      status: p.status,
      createdAt: p.createdAt,
    }))

    const combined = [...paymentTransactions, ...allLogs].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const total = combined.length
    const transactions = combined.slice((page - 1) * limit, page * limit)

    return NextResponse.json({ transactions, total, page, limit })
  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json({ error: 'Failed to get transactions' }, { status: 500 })
  }
}
