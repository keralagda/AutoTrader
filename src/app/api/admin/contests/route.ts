import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get active contests and leaderboard
export async function GET(req: NextRequest) {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'referral_contest' } })
    if (!setting) {
      return NextResponse.json({ active: false })
    }

    const contest = JSON.parse(setting.value)
    const now = new Date()
    if (new Date(contest.endDate) < now) {
      return NextResponse.json({ active: false, contest })
    }

    // Get leaderboard: top referrers in contest period
    const startDate = new Date(contest.startDate)
    const users = await db.user.findMany({
      where: { isFake: false, role: 'user' },
      select: {
        id: true, name: true,
        _count: { select: { referrals: { where: { createdAt: { gte: startDate } } } } },
      },
    })

    const leaderboard = users
      .map(u => ({ id: u.id, name: u.name, referrals: u._count.referrals }))
      .filter(u => u.referrals > 0)
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 20)

    return NextResponse.json({ active: true, contest, leaderboard })
  } catch {
    return NextResponse.json({ active: false })
  }
}

// POST - Create/update contest
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    await db.setting.upsert({
      where: { key: 'referral_contest' },
      update: { value: JSON.stringify(data) },
      create: { key: 'referral_contest', value: JSON.stringify(data) },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT - Update contest
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const existing = await db.setting.findUnique({ where: { key: 'referral_contest' } })
    if (!existing) {
      return NextResponse.json({ error: 'No contest found' }, { status: 404 })
    }
    const current = JSON.parse(existing.value)
    const updated = { ...current, ...data }
    await db.setting.update({
      where: { key: 'referral_contest' },
      data: { value: JSON.stringify(updated) },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE - Remove contest
export async function DELETE() {
  try {
    await db.setting.deleteMany({ where: { key: 'referral_contest' } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
