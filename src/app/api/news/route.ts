import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const news = await db.news.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('Get news error:', error)
    return NextResponse.json({ error: 'Failed to get news' }, { status: 500 })
  }
}
