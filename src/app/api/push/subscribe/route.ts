import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Save push notification subscription
export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json()
    if (!userId || !subscription) {
      return NextResponse.json({ error: 'userId and subscription required' }, { status: 400 })
    }

    // Store subscription in settings (keyed by userId)
    await db.setting.upsert({
      where: { key: `push_sub_${userId}` },
      update: { value: JSON.stringify(subscription) },
      create: { key: `push_sub_${userId}`, value: JSON.stringify(subscription) },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
