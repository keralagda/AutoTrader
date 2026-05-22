import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notifications = await db.fakeNotification.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    // Get settings
    let settings = await db.fakeNotificationSettings.findFirst()
    if (!settings) {
      settings = await db.fakeNotificationSettings.create({
        data: { isEnabled: true, minDelaySeconds: 5, maxDelaySeconds: 15 },
      })
    }

    return NextResponse.json({ notifications, settings })
  } catch (error) {
    console.error('Get fake notifications error:', error)
    return NextResponse.json({ error: 'Failed to get fake notifications' }, { status: 500 })
  }
}
