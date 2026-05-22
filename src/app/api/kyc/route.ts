import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get KYC status for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const kyc = await prisma.kycVerification.findUnique({ where: { userId } })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    })

    return NextResponse.json({
      status: user?.kycStatus || 'none',
      verification: kyc ? {
        documentType: kyc.documentType,
        documentNumber: kyc.documentNumber,
        status: kyc.status,
        rejectionReason: kyc.rejectionReason,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
      } : null,
    })
  } catch (error) {
    console.error('KYC GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Submit KYC documents
export async function POST(req: NextRequest) {
  try {
    const { userId, documentType, documentNumber, documentUrl, selfieUrl } = await req.json()

    if (!userId || !documentType || !documentNumber) {
      return NextResponse.json({ error: 'userId, documentType, and documentNumber are required' }, { status: 400 })
    }

    const validTypes = ['aadhaar', 'pan', 'passport', 'driving_license']
    if (!validTypes.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Check if user already has a pending/approved KYC
    const existing = await prisma.kycVerification.findUnique({ where: { userId } })
    if (existing && existing.status === 'approved') {
      return NextResponse.json({ error: 'KYC already approved' }, { status: 400 })
    }

    if (existing) {
      // Update existing submission
      await prisma.kycVerification.update({
        where: { userId },
        data: {
          documentType,
          documentNumber,
          documentUrl: documentUrl || null,
          selfieUrl: selfieUrl || null,
          status: 'pending',
          rejectionReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
        },
      })
    } else {
      // Create new submission
      await prisma.kycVerification.create({
        data: {
          userId,
          documentType,
          documentNumber,
          documentUrl: documentUrl || null,
          selfieUrl: selfieUrl || null,
          status: 'pending',
        },
      })
    }

    // Update user KYC status
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'pending' },
    })

    return NextResponse.json({ success: true, status: 'pending' })
  } catch (error) {
    console.error('KYC POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
