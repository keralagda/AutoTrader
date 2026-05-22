import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notifications = await db.fakeNotification.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    let settings = await db.fakeNotificationSettings.findFirst()
    if (!settings) {
      settings = await db.fakeNotificationSettings.create({
        data: { isEnabled: true, minDelaySeconds: 5, maxDelaySeconds: 15 },
      })
    }

    return NextResponse.json({ notifications, settings })
  } catch (error) {
    console.error('Admin get fake notifications error:', error)
    return NextResponse.json({ error: 'Failed to get fake notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userName, planName, amount, isActive, sortOrder } = await request.json()

    if (!userName || !planName) {
      return NextResponse.json({ error: 'User name and plan name are required' }, { status: 400 })
    }

    const notification = await db.fakeNotification.create({
      data: {
        userName,
        planName,
        amount: amount || 0,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Admin create fake notification error:', error)
    return NextResponse.json({ error: 'Failed to create fake notification' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, userName, planName, amount, isActive, sortOrder, settings } = await request.json()

    // Update settings
    if (settings) {
      let existing = await db.fakeNotificationSettings.findFirst()
      if (existing) {
        await db.fakeNotificationSettings.update({
          where: { id: existing.id },
          data: {
            isEnabled: settings.isEnabled,
            minDelaySeconds: settings.minDelaySeconds,
            maxDelaySeconds: settings.maxDelaySeconds,
          },
        })
      } else {
        await db.fakeNotificationSettings.create({
          data: settings,
        })
      }
      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const notification = await db.fakeNotification.update({
      where: { id },
      data: {
        ...(userName && { userName }),
        ...(planName && { planName }),
        ...(amount !== undefined && { amount }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Admin update fake notification error:', error)
    return NextResponse.json({ error: 'Failed to update fake notification' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    await db.fakeNotification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete fake notification error:', error)
    return NextResponse.json({ error: 'Failed to delete fake notification' }, { status: 500 })
  }
}
