import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.activityLog.count(),
    ])
    return NextResponse.json({ logs, total, page })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get activity log' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, action, details, ipAddress } = await request.json()
    const log = await db.activityLog.create({ data: { userId, action, details, ipAddress } })
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}
