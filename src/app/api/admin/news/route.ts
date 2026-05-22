import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const news = await db.news.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(news)
  } catch (error) {
    console.error('Admin get news error:', error)
    return NextResponse.json({ error: 'Failed to get news' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, category, isPublished } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const news = await db.news.create({
      data: {
        title,
        content,
        category: category || 'general',
        isPublished: isPublished !== false,
      },
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    console.error('Admin create news error:', error)
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, content, category, isPublished } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'News ID required' }, { status: 400 })
    }

    const news = await db.news.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(isPublished !== undefined && { isPublished }),
      },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('Admin update news error:', error)
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'News ID required' }, { status: 400 })
    }

    await db.news.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete news error:', error)
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 })
  }
}
