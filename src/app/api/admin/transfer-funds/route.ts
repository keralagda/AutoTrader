import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/transfer-funds?search=xxx  → search users by id/name/email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')?.trim() || ''

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    const users = await db.user.findMany({
      where: {
        role: 'user',
        isFake: false,
        NOT: { email: { contains: '@removed.local' } },
        OR: [
          { id: { contains: query } },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { referralCode: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        tradingBalance: true,
        withdrawalBalance: true,
        isActive: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Transfer-funds search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

// POST /api/admin/transfer-funds → execute transfer between two users
export async function POST(request: Request) {
  try {
    const {
      fromUserId,
      toUserId,
      fromWallet,  // 'trading' | 'withdrawal'
      toWallet,    // 'trading' | 'withdrawal'
      amount: rawAmount,
      notes,
    } = await request.json()

    // ─── Validation ───
    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: 'Both sender and receiver are required.' }, { status: 400 })
    }
    if (fromUserId === toUserId) {
      return NextResponse.json({ error: 'Sender and receiver cannot be the same user.' }, { status: 400 })
    }

    const amount = parseFloat(rawAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
    }

    const srcWallet: 'trading' | 'withdrawal' = fromWallet === 'withdrawal' ? 'withdrawal' : 'trading'
    const dstWallet: 'trading' | 'withdrawal' = toWallet   === 'withdrawal' ? 'withdrawal' : 'trading'

    // ─── Fetch users ───
    const [sender, receiver] = await Promise.all([
      db.user.findUnique({ where: { id: fromUserId } }),
      db.user.findUnique({ where: { id: toUserId } }),
    ])

    if (!sender) return NextResponse.json({ error: 'Sender not found.' }, { status: 404 })
    if (!receiver) return NextResponse.json({ error: 'Receiver not found.' }, { status: 404 })

    // ─── Check sufficient balance ───
    const senderBalance = srcWallet === 'withdrawal' ? sender.withdrawalBalance : sender.tradingBalance
    if (senderBalance < amount) {
      return NextResponse.json({
        error: `Insufficient balance. ${sender.name}'s ${srcWallet} wallet has $${senderBalance.toFixed(2)}.`,
      }, { status: 400 })
    }

    const senderNewBalance = senderBalance - amount
    const receiverCurrentBalance = dstWallet === 'withdrawal' ? receiver.withdrawalBalance : receiver.tradingBalance
    const receiverNewBalance = receiverCurrentBalance + amount

    const description = notes?.trim()
      ? `Admin transfer: ${notes}`
      : `Admin inter-user transfer from ${sender.name} to ${receiver.name}`

    // ─── Atomic DB operations ───
    await db.$transaction([
      // Deduct from sender
      db.user.update({
        where: { id: fromUserId },
        data: srcWallet === 'withdrawal'
          ? { withdrawalBalance: senderNewBalance }
          : { tradingBalance: senderNewBalance },
      }),
      // Credit to receiver
      db.user.update({
        where: { id: toUserId },
        data: dstWallet === 'withdrawal'
          ? { withdrawalBalance: receiverNewBalance }
          : { tradingBalance: receiverNewBalance },
      }),
      // Log sender debit
      db.transactionLog.create({
        data: {
          userId: fromUserId,
          type: 'transfer_out',
          amount: -amount,
          balanceBefore: senderBalance,
          balanceAfter: senderNewBalance,
          wallet: srcWallet,
          description,
          status: 'completed',
        },
      }),
      // Log receiver credit
      db.transactionLog.create({
        data: {
          userId: toUserId,
          type: 'transfer_in',
          amount,
          balanceBefore: receiverCurrentBalance,
          balanceAfter: receiverNewBalance,
          wallet: dstWallet,
          description,
          status: 'completed',
        },
      }),
      // Activity log
      db.activityLog.create({
        data: {
          userId: fromUserId,
          action: 'admin_transfer_funds',
          details: JSON.stringify({
            fromUserId,
            toUserId,
            fromUserName: sender.name,
            toUserName: receiver.name,
            amount,
            fromWallet: srcWallet,
            toWallet: dstWallet,
            notes: notes || '',
          }),
        },
      }),
      // Notify sender
      db.notification.create({
        data: {
          userId: fromUserId,
          title: 'Funds Transferred Out',
          message: `$${amount.toFixed(2)} has been transferred from your ${srcWallet} wallet to ${receiver.name}. ${notes ? `Note: ${notes}` : ''}`,
          type: 'warning',
        },
      }),
      // Notify receiver
      db.notification.create({
        data: {
          userId: toUserId,
          title: 'Funds Received',
          message: `$${amount.toFixed(2)} has been added to your ${dstWallet} wallet from ${sender.name}. ${notes ? `Note: ${notes}` : ''}`,
          type: 'success',
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: `$${amount.toFixed(2)} successfully transferred from ${sender.name} to ${receiver.name}.`,
      sender: {
        id: sender.id,
        name: sender.name,
        wallet: srcWallet,
        balanceBefore: senderBalance,
        balanceAfter: senderNewBalance,
      },
      receiver: {
        id: receiver.id,
        name: receiver.name,
        wallet: dstWallet,
        balanceBefore: receiverCurrentBalance,
        balanceAfter: receiverNewBalance,
      },
    })
  } catch (error) {
    console.error('Transfer-funds error:', error)
    return NextResponse.json({ error: 'Transfer failed. Please try again.' }, { status: 500 })
  }
}
