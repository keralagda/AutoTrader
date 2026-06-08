import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function GET() {
  try {
    await checkDb()
    const banners = await db.promoBanner.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(banners)
  } catch (error) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    const { title, imageUrl, size, downloadUrl } = await req.json()
    if (!title || !imageUrl || !size) {
      return NextResponse.json({ error: 'Title, Image URL, and Size are required' }, { status: 400 })
    }

    const banner = await db.promoBanner.create({
      data: {
        title,
        imageUrl,
        size,
        downloadUrl: downloadUrl || imageUrl
      }
    })

    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    console.error('Affiliate banner create error:', error)
    return NextResponse.json({ error: 'Failed to create promo banner' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    await db.promoBanner.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Promo banner deleted' })
  } catch (error) {
    console.error('Affiliate banner delete error:', error)
    return NextResponse.json({ error: 'Failed to delete promo banner' }, { status: 500 })
  }
}
