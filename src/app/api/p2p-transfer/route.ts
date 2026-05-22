import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const [sent, received] = await Promise.all([
      db.p2PTransfer.findMany({ where: { senderId: userId }, include: { receiver: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 30 }),
      db.p2PTransfer.findMany({ where: { receiverId: userId }, include: { sender: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 30 }),
    ])
    return NextResponse.json({ sent, received })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get transfers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { senderId, receiverCode, receiverEmail, amount, note } = await request.json()
    if (!senderId || !amount || amount <= 0) return NextResponse.json({ error: 'Sender and valid amount required' }, { status: 400 })
    if (!receiverCode && !receiverEmail) return NextResponse.json({ error: 'Receiver referral code or email required' }, { status: 400 })

    const sender = await db.user.findUnique({ where: { id: senderId } })
    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })

    if (sender.role !== 'admin' && amount > sender.tradingBalance) {
      return NextResponse.json({ error: 'Insufficient trading balance' }, { status: 400 })
    }

    // Find receiver
    let receiver
    if (receiverCode) receiver = await db.user.findUnique({ where: { referralCode: receiverCode } })
    else if (receiverEmail) receiver = await db.user.findUnique({ where: { email: receiverEmail } })

    if (!receiver) return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    if (receiver.id === senderId) return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })

    // Execute transfer
    await db.user.update({ where: { id: senderId }, data: { tradingBalance: sender.role === 'admin' ? sender.tradingBalance : sender.tradingBalance - amount } })
    await db.user.update({ where: { id: receiver.id }, data: { tradingBalance: receiver.tradingBalance + amount } })

    const transfer = await db.p2PTransfer.create({ data: { senderId, receiverId: receiver.id, amount, note } })

    // Create notifications
    await db.notification.create({ data: { userId: receiver.id, title: 'P2P Transfer Received', message: `${sender.name} sent you $${amount.toFixed(2)}`, type: 'earning' } })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process transfer' }, { status: 500 })
  }
}
