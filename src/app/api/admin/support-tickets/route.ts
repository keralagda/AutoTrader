import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tickets = await db.supportTicket.findMany({
      include: { user: { select: { name: true, email: true } }, replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tickets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get tickets' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, assignedTo, priority } = await request.json()
    if (!id) return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })

    const ticket = await db.supportTicket.update({
      where: { id },
      data: { ...(status && { status }), ...(assignedTo && { assignedTo }), ...(priority && { priority }) },
    })
    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

// DELETE - Remove a support ticket and its replies
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })

    // Delete replies first (FK constraint)
    await db.ticketReply.deleteMany({ where: { ticketId: id } })
    await db.supportTicket.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}
