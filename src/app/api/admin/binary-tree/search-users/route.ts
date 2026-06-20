import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        mlmRank: true,
        binaryTreePosition: true,
      },
      take: 10,
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Failed to search admin users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
