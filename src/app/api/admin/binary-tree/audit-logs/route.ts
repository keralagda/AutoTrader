import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const actionType = searchParams.get('actionType') || 'all'

    const skip = (page - 1) * limit

    const whereClause: any = {}

    // Filter by actionType
    if (actionType !== 'all') {
      whereClause.actionType = actionType
    }

    // Filter by user name or email search query
    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    // Fetch logs with user details
    const [logs, total] = await Promise.all([
      db.binaryTreeAuditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              mlmRank: true,
            },
          },
        },
        orderBy: {
          performedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.binaryTreeAuditLog.count({
        where: whereClause,
      }),
    ])

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to get binary tree audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
