import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const messages = await db.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, subject, body, type } = await request.json()

    if (!userId || !subject || !body) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        userId,
        subject,
        body,
        type: type || 'email',
        direction: 'sent',
        isRead: true,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
