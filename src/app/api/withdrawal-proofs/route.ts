import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint - returns recent completed withdrawals for social proof
export async function GET() {
  try {
    const withdrawals = await db.withdrawal.findMany({
      where: { status: { in: ['completed', 'approved'] } },
      include: { user: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    // Anonymize names: "John Doe" → "John D."
    const proofs = withdrawals.map(w => ({
      id: w.id,
      name: w.user.name.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' '),
      amount: w.amount,
      method: w.paymentMethod || 'crypto',
      time: w.updatedAt,
    }))

    return NextResponse.json(proofs)
  } catch {
    return NextResponse.json([])
  }
}
