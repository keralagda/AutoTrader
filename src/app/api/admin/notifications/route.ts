import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId, title, message, type, link, broadcast } = await request.json()
    if (!title || !message) return NextResponse.json({ error: 'Title and message required' }, { status: 400 })

    if (broadcast) {
      const users = await db.user.findMany({ where: { role: 'user', isActive: true, isFake: false }, select: { id: true } })
      await Promise.all(users.map(u => db.notification.create({ data: { userId: u.id, title, message, type: type || 'info', link } })))
      return NextResponse.json({ count: users.length }, { status: 201 })
    }

    if (!userId) return NextResponse.json({ error: 'User ID required for targeted notification' }, { status: 400 })
    const notification = await db.notification.create({ data: { userId, title, message, type: type || 'info', link } })
    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
