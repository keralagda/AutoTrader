import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Submit bank transfer deposit request
export async function POST(req: NextRequest) {
  try {
    const { userId, amount, referenceNumber, bankName, accountHolder, screenshotUrl } = await req.json()

    if (!userId || !amount || !referenceNumber) {
      return NextResponse.json({ error: 'userId, amount, and referenceNumber are required' }, { status: 400 })
    }

    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount < 10) {
      return NextResponse.json({ error: 'Minimum deposit is $10' }, { status: 400 })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: depositAmount,
        method: 'bank_transfer',
        status: 'pending',
        upiRef: referenceNumber,
        gatewayRef: JSON.stringify({
          bankName: bankName || '',
          accountHolder: accountHolder || '',
          screenshotUrl: screenshotUrl || '',
        }),
      },
    })

    // Create notification for admin
    const admins = await prisma.user.findMany({ where: { role: 'admin' } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Bank Transfer Deposit',
          message: `User submitted bank transfer of $${depositAmount.toFixed(2)} (Ref: ${referenceNumber})`,
          type: 'info',
        },
      })
    }

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Bank Transfer Submitted',
        message: `Your bank transfer of $${depositAmount.toFixed(2)} is pending admin verification. Reference: ${referenceNumber}`,
        type: 'info',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'bank_transfer_submitted',
        details: JSON.stringify({ amount: depositAmount, referenceNumber, paymentId: payment.id }),
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Bank transfer submitted. Awaiting admin verification.',
    })
  } catch (error) {
    console.error('Bank transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get bank transfer details (admin configured)
export async function GET() {
  try {
    // Get bank transfer gateway config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { type: 'indian', name: { contains: 'Bank' } },
    })

    // Get platform bank details from settings
    const bankDetails = await prisma.setting.findUnique({
      where: { key: 'bank_transfer_details' },
    })

    return NextResponse.json({
      gateway,
      bankDetails: bankDetails ? JSON.parse(bankDetails.value) : {
        bankName: 'State Bank of India',
        accountNumber: 'XXXX XXXX XXXX 1234',
        ifscCode: 'SBIN0001234',
        accountHolder: 'Auto Trade Platform',
        branch: 'Main Branch',
      },
    })
  } catch (error) {
    console.error('Bank transfer GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
