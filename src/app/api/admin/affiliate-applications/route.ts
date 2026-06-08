import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function GET() {
  try {
    await checkDb()
    const applications = await db.affiliateApplication.findMany({
      include: {
        user: {
          select: { name: true, email: true, totalDeposited: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(applications)
  } catch (error) {
    console.error('Fetch affiliate applications error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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
    const { id, status, notes } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Application ID and status are required' }, { status: 400 })
    }

    const app = await db.affiliateApplication.findUnique({ where: { id } })
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update status
    await db.affiliateApplication.update({
      where: { id },
      data: { status, notes }
    })

    // If approved, update user's affiliate status
    if (status === 'approved') {
      await db.user.update({
        where: { id: app.userId },
        data: { isAffiliate: true }
      })

      // Send a dashboard notification to user
      await db.notification.create({
        data: {
          userId: app.userId,
          title: 'Affiliate Status Approved',
          message: 'Congratulations! Your application to become an affiliate partner has been approved. Visit your dashboard to get your promotion kit.',
          type: 'success'
        }
      })
    }

    return NextResponse.json({ success: true, message: `Application ${status}` })
  } catch (error) {
    console.error('Update affiliate application error:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}
