import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {}
    if (userId) where.userId = userId

    const messages = await db.message.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Admin get messages error:', error)
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, subject, body, type, broadcast } = await request.json()

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    if (broadcast) {
      // Send to all users
      const users = await db.user.findMany({
        where: { role: 'user', isActive: true },
        select: { id: true },
      })

      const messages = await Promise.all(
        users.map(user =>
          db.message.create({
            data: {
              userId: user.id,
              subject,
              body,
              type: type || 'system',
              direction: 'received',
            },
          })
        )
      )

      return NextResponse.json({ count: messages.length, message: 'Broadcast sent' }, { status: 201 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required for direct message' }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        userId,
        subject,
        body,
        type: type || 'system',
        direction: 'received',
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Admin send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    await db.message.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete message error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
