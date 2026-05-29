import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MAX_NP_PER_DAY = 30
const NP_PER_INTERVAL = 1 // 1 NP per ping (frontend pings every 2 minutes)

// POST - Award NP for screen time (called by frontend every 2 minutes)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Check how much NP was already earned today from screen time
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = `screen_time_np_${userId}_${today.toISOString().split('T')[0]}`

    const existing = await db.setting.findUnique({ where: { key: todayKey } })
    const earnedToday = existing ? parseInt(existing.value) || 0 : 0

    if (earnedToday >= MAX_NP_PER_DAY) {
      return NextResponse.json({ earned: 0, totalToday: earnedToday, maxReached: true })
    }

    // Award NP
    const toAward = Math.min(NP_PER_INTERVAL, MAX_NP_PER_DAY - earnedToday)

    // Update user stats
    await db.userStats.upsert({
      where: { userId },
      create: { userId, xp: toAward, totalXpEarned: toAward },
      update: { xp: { increment: toAward }, totalXpEarned: { increment: toAward } },
    })

    // Track daily total
    const newTotal = earnedToday + toAward
    await db.setting.upsert({
      where: { key: todayKey },
      update: { value: String(newTotal) },
      create: { key: todayKey, value: String(newTotal) },
    })

    return NextResponse.json({ earned: toAward, totalToday: newTotal, maxReached: newTotal >= MAX_NP_PER_DAY })
  } catch (error) {
    console.error('Screen time NP error:', error)
    return NextResponse.json({ earned: 0 })
  }
}

// GET - Check today's screen time NP status
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = `screen_time_np_${userId}_${today.toISOString().split('T')[0]}`

    const existing = await db.setting.findUnique({ where: { key: todayKey } })
    const earnedToday = existing ? parseInt(existing.value) || 0 : 0

    return NextResponse.json({ earnedToday, max: MAX_NP_PER_DAY, remaining: MAX_NP_PER_DAY - earnedToday })
  } catch {
    return NextResponse.json({ earnedToday: 0, max: MAX_NP_PER_DAY, remaining: MAX_NP_PER_DAY })
  }
}
