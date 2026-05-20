import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.plan.findMany({ orderBy: { entryFee: 'asc' } })
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const plan = await db.plan.update({
      where: { id },
      data,
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const plan = await db.plan.create({ data })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
