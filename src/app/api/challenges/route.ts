import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const challenges = await db.challenge.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(challenges)
  } catch (error) {
    console.error('Get challenges error:', error)
    return NextResponse.json({ error: 'Failed to get challenges' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, challengeId } = await request.json()

    if (!userId || !challengeId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const existing = await db.userChallenge.findFirst({
      where: { userId, challengeId },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 409 })
    }

    const userChallenge = await db.userChallenge.create({
      data: { userId, challengeId, progress: 0, completed: false, claimed: false },
    })

    return NextResponse.json(userChallenge, { status: 201 })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 })
  }
}
