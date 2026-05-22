import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(testimonials)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get testimonials' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, avatar, role, content, rating, earnings, isActive, sortOrder } = await request.json()
    if (!name || !content) return NextResponse.json({ error: 'Name and content required' }, { status: 400 })

    const testimonial = await db.testimonial.create({
      data: { name, avatar, role, content, rating: rating || 5, earnings, isActive: isActive !== false, sortOrder: sortOrder || 0 },
    })
    return NextResponse.json(testimonial, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const testimonial = await db.testimonial.update({ where: { id }, data })
    return NextResponse.json(testimonial)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.testimonial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
