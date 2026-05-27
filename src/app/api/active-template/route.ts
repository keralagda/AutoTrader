import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint - returns the active template for the landing page
export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'active_template' } })
    if (setting) {
      return NextResponse.json(JSON.parse(setting.value))
    }

    // Default template
    return NextResponse.json({
      id: 'crypto-dark',
      colors: { primary: '#10b981', accent: '#06b6d4', background: '#0a0a0a', card: '#111111', text: '#ffffff' },
    })
  } catch (error) {
    return NextResponse.json({
      colors: { primary: '#10b981', accent: '#06b6d4', background: '#0a0a0a', card: '#111111', text: '#ffffff' },
    })
  }
}
