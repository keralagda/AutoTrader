import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(testimonials)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get testimonials' }, { status: 500 })
  }
}
