import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const kyc = await db.kycVerification.findUnique({ where: { userId } })
    return NextResponse.json(kyc || { status: 'none' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get KYC status' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, documentType, documentNumber, documentUrl, selfieUrl } = await request.json()
    if (!userId || !documentType) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

    const kyc = await db.kycVerification.upsert({
      where: { userId },
      create: { userId, documentType, documentNumber, documentUrl, selfieUrl, status: 'pending' },
      update: { documentType, documentNumber, documentUrl, selfieUrl, status: 'pending', rejectionReason: null },
    })

    await db.user.update({ where: { id: userId }, data: { kycStatus: 'pending' } })
    return NextResponse.json(kyc, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 })
  }
}
