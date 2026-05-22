import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const verifications = await db.kycVerification.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
    })
    return NextResponse.json(verifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get KYC list' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, rejectionReason, reviewedBy } = await request.json()
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

    const kyc = await db.kycVerification.update({
      where: { id },
      data: { status, rejectionReason, reviewedBy, reviewedAt: new Date() },
    })

    await db.user.update({ where: { id: kyc.userId }, data: { kycStatus: status } })

    await db.activityLog.create({ data: { userId: reviewedBy, action: `kyc_${status}`, details: JSON.stringify({ kycId: id, userId: kyc.userId }) } })

    return NextResponse.json(kyc)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update KYC' }, { status: 500 })
  }
}
