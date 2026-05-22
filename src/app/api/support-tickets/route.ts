import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const tickets = await db.supportTicket.findMany({
      where: { userId },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tickets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get tickets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, subject, description, category, priority } = await request.json()
    if (!userId || !subject || !description) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

    const ticket = await db.supportTicket.create({
      data: { userId, subject, description, category: category || 'general', priority: priority || 'medium' },
    })
    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { ticketId, userId, message, isAdmin } = await request.json()
    if (!ticketId || !message) return NextResponse.json({ error: 'Ticket ID and message required' }, { status: 400 })

    const reply = await db.ticketReply.create({
      data: { ticketId, userId: userId || 'system', message, isAdmin: isAdmin || false },
    })

    if (isAdmin) {
      await db.supportTicket.update({ where: { id: ticketId }, data: { status: 'in_progress' } })
    }

    return NextResponse.json(reply, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 })
  }
}
