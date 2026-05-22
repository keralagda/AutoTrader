import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const history = await db.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(history)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get login history' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, ipAddress, userAgent, device, location } = await request.json()
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const entry = await db.loginHistory.create({
      data: { userId, ipAddress, userAgent, device, location },
    })
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log login' }, { status: 500 })
  }
}
