import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
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
    const { userId, trafficSource, audienceSize, telegram } = await req.json()

    if (!userId || !trafficSource || !audienceSize || !telegram) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if there is already a pending or approved application
    const existing = await db.affiliateApplication.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'approved'] }
      }
    })

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'You are already an approved affiliate partner.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Your affiliate application is already pending review.' }, { status: 400 })
    }

    // Create application
    const app = await db.affiliateApplication.create({
      data: {
        userId,
        trafficSource,
        audienceSize: parseInt(audienceSize) || 0,
        telegram,
        status: 'pending'
      }
    })

    return NextResponse.json({ success: true, application: app, message: 'Application submitted successfully' })
  } catch (error) {
    console.error('Affiliate application submit error:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
