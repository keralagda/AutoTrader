import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const promotions = await db.promotion.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(promotions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get promotions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    if (!data.title || !data.endDate) return NextResponse.json({ error: 'Title and end date required' }, { status: 400 })
    const promotion = await db.promotion.create({ data: { ...data, endDate: new Date(data.endDate), startDate: data.startDate ? new Date(data.startDate) : new Date() } })
    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    if (data.endDate) data.endDate = new Date(data.endDate)
    if (data.startDate) data.startDate = new Date(data.startDate)
    const promotion = await db.promotion.update({ where: { id }, data })
    return NextResponse.json(promotion)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.promotion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 })
  }
}
