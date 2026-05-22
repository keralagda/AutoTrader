import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get recent transactions as activity
    const transactions = await prisma.transactionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        wallet: true,
        description: true,
        status: true,
        createdAt: true,
      },
    })

    // Get recent earnings
    const earnings = await prisma.earning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        createdAt: true,
      },
    })

    // Merge and sort by date
    const activity = [
      ...transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || `${t.type} - ${t.wallet}`,
        status: t.status,
        timestamp: t.createdAt,
        category: 'transaction' as const,
      })),
      ...earnings.map(e => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        description: `${e.type === 'referral' ? 'Referral bonus' : e.type === 'daily' ? 'Daily profit' : e.type} earned`,
        status: 'completed',
        timestamp: e.createdAt,
        category: 'earning' as const,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json(activity)
  } catch (error) {
    console.error('User activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
