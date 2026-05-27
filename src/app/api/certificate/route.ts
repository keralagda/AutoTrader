import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate investment certificate data
export async function GET(req: NextRequest) {
  try {
    const depositId = req.nextUrl.searchParams.get('depositId')
    if (!depositId) return NextResponse.json({ error: 'depositId required' }, { status: 400 })

    const deposit = await db.deposit.findUnique({
      where: { id: depositId },
      include: {
        plan: { select: { name: true, dailyEarningPercent: true, durationDays: true, returnType: true } },
        user: { select: { name: true, email: true, referralCode: true } },
      },
    })

    if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })

    return NextResponse.json({
      certificateId: `BNFX-${deposit.id.substring(0, 8).toUpperCase()}`,
      investorName: deposit.user.name,
      planName: deposit.plan.name,
      amount: deposit.amount,
      dailyReturn: deposit.plan.dailyEarningPercent,
      duration: deposit.plan.durationDays || 'Unlimited',
      returnType: deposit.plan.returnType,
      startDate: deposit.createdAt,
      status: deposit.status,
      earnedSoFar: deposit.earnedSoFar,
      riskLevel: (deposit as any).riskLevel || 'medium',
      issuedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
