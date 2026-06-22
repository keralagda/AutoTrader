import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function checkDbConnection() {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

const dbErrorResponse = () => NextResponse.json({
  error: 'Database connection failed',
  diagnosticTrace: {
    message: 'Failed to connect to the database container or host.',
    actions: [
      'Check DB Container Status (running/healthy)',
      'Verify Network Bridge / port mappings',
      'Validate .env mapping (DATABASE_URL)'
    ]
  }
}, { status: 503 })

export async function GET(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const rules = await db.planPairingRule.findMany({
      where: { planId },
      orderBy: { levelRange: 'asc' }
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Failed to get plan pairing rules:', error)
    return NextResponse.json({ error: 'Failed to get plan pairing rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const body = await request.json()
    const {
      planId,
      levelRange,
      ratio,
      bonusType,
      bonusValue,
      minDirectLeft,
      minDirectRight,
      minPersonalIv,
      minTeamTv,
      perks
    } = body

    if (!planId || !levelRange) {
      return NextResponse.json({ error: 'Plan ID and Level Range are required' }, { status: 400 })
    }

    const rule = await db.planPairingRule.create({
      data: {
        planId,
        levelRange,
        ratio: ratio || '100:100',
        bonusType: bonusType || 'percent',
        bonusValue: Number(bonusValue ?? 10.0),
        minDirectLeft: Number(minDirectLeft ?? 0),
        minDirectRight: Number(minDirectRight ?? 0),
        minPersonalIv: Number(minPersonalIv ?? 0),
        minTeamTv: Number(minTeamTv ?? 0),
        perks: perks || ''
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Failed to create plan pairing rule:', error)
    return NextResponse.json({ error: 'Failed to create plan pairing rule' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const body = await request.json()
    const {
      id,
      levelRange,
      ratio,
      bonusType,
      bonusValue,
      minDirectLeft,
      minDirectRight,
      minPersonalIv,
      minTeamTv,
      perks
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const rule = await db.planPairingRule.update({
      where: { id },
      data: {
        levelRange,
        ratio: ratio || '100:100',
        bonusType: bonusType || 'percent',
        bonusValue: Number(bonusValue ?? 10.0),
        minDirectLeft: Number(minDirectLeft ?? 0),
        minDirectRight: Number(minDirectRight ?? 0),
        minPersonalIv: Number(minPersonalIv ?? 0),
        minTeamTv: Number(minTeamTv ?? 0),
        perks: perks || ''
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Failed to update plan pairing rule:', error)
    return NextResponse.json({ error: 'Failed to update plan pairing rule' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    await db.planPairingRule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Pairing rule deleted successfully' })
  } catch (error) {
    console.error('Failed to delete pairing rule:', error)
    return NextResponse.json({ error: 'Failed to delete pairing rule' }, { status: 500 })
  }
}
