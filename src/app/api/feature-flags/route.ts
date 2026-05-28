import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint - returns only enabled/disabled status (no descriptions)
export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'feature_flags' } })
    const flags = setting ? JSON.parse(setting.value) : {}
    return NextResponse.json(flags)
  } catch {
    return NextResponse.json({})
  }
}
