import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const gateways = await db.paymentGateway.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(gateways)
  } catch (error) {
    console.error('Get gateways error:', error)
    return NextResponse.json({ error: 'Failed to get payment gateways' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Gateway ID required' }, { status: 400 })
    }

    const gateway = await db.paymentGateway.update({
      where: { id },
      data,
    })

    return NextResponse.json(gateway)
  } catch (error) {
    console.error('Update gateway error:', error)
    return NextResponse.json({ error: 'Failed to update payment gateway' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const gateway = await db.paymentGateway.create({ data })

    return NextResponse.json(gateway, { status: 201 })
  } catch (error) {
    console.error('Create gateway error:', error)
    return NextResponse.json({ error: 'Failed to create payment gateway' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Gateway ID required' }, { status: 400 })
    }

    await db.paymentGateway.delete({ where: { id } })

    return NextResponse.json({ message: 'Gateway deleted' })
  } catch (error) {
    console.error('Delete gateway error:', error)
    return NextResponse.json({ error: 'Failed to delete payment gateway' }, { status: 500 })
  }
}
