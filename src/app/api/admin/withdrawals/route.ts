import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const withdrawals = await db.withdrawal.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(withdrawals)
  } catch (error) {
    console.error('Get admin withdrawals error:', error)
    return NextResponse.json({ error: 'Failed to get withdrawals' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, txHash } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Withdrawal ID and status required' }, { status: 400 })
    }

    const withdrawal = await db.withdrawal.findUnique({ where: { id } })
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
    }

    // If rejected, refund the amount
    if (status === 'rejected' && withdrawal.status === 'pending') {
      const user = await db.user.findUnique({ where: { id: withdrawal.userId } })
      if (user) {
        await db.user.update({
          where: { id: withdrawal.userId },
          data: { tradingBalance: user.tradingBalance + withdrawal.amount },
        })
      }
    }

    const updated = await db.withdrawal.update({
      where: { id },
      data: { status, txHash },
    })

    // Send email notification for withdrawal status change
    const withdrawalUser = await db.user.findUnique({ where: { id: withdrawal.userId } })
    if (withdrawalUser && (status === 'approved' || status === 'rejected' || status === 'completed')) {
      const { sendWithdrawalUpdate } = await import('@/lib/email')
      sendWithdrawalUpdate(withdrawalUser.email, withdrawalUser.name, withdrawal.amount, status, txHash || undefined).catch(() => {})
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update withdrawal error:', error)
    return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
  }
}
