import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => { settingsMap[s.key] = s.value })
    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const settings = await request.json() as Record<string, string>

    const results: any[] = []
    for (const [key, value] of Object.entries(settings)) {
      const result = await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
      results.push(result)
    }

    return NextResponse.json({ message: 'Settings updated', results })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
