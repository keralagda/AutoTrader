import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await db.notification.count({ where: { userId, isRead: false } })
    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, notificationId, markAllRead } = await request.json()

    if (markAllRead && userId) {
      await db.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      await db.notification.update({ where: { id: notificationId }, data: { isRead: true } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
