import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Create P2P transfer
export async function POST(req: NextRequest) {
  try {
    // Database connectivity guard
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    const { senderId, receiverEmail, amount, note, pin } = await req.json()

    if (!senderId || !receiverEmail || !amount || !pin) {
      return NextResponse.json({ error: 'senderId, receiverEmail, amount, and pin are required' }, { status: 400 })
    }

    const transferAmount = parseFloat(amount)
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get sender
    const sender = await prisma.user.findUnique({ where: { id: senderId } })
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 })
    }

    // Transaction PIN verification
    if (!sender.transactionPin) {
      return NextResponse.json({ error: 'Transaction PIN is not set. Please set it in Settings.' }, { status: 400 })
    }
    const pinMatch = await bcrypt.compare(pin, sender.transactionPin)
    if (!pinMatch) {
      return NextResponse.json({ error: 'Incorrect transaction PIN' }, { status: 400 })
    }

    // Check balance (use withdrawal wallet for P2P)
    if (sender.withdrawalBalance < transferAmount) {
      return NextResponse.json({ error: 'Insufficient withdrawal balance' }, { status: 400 })
    }

    // Get receiver
    const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } })
    if (!receiver) {
      return NextResponse.json({ error: 'Recipient not found. Check the email address.' }, { status: 404 })
    }

    if (receiver.id === senderId) {
      return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })
    }

    // Minimum transfer amount
    if (transferAmount < 1) {
      return NextResponse.json({ error: 'Minimum transfer amount is $1' }, { status: 400 })
    }

    // Execute transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender's withdrawal wallet
      const updatedSender = await tx.user.update({
        where: { id: senderId },
        data: { withdrawalBalance: { decrement: transferAmount } },
      })

      // Add to receiver's trading wallet
      const updatedReceiver = await tx.user.update({
        where: { id: receiver.id },
        data: { tradingBalance: { increment: transferAmount } },
      })

      // Create P2P transfer record
      const transfer = await tx.p2PTransfer.create({
        data: {
          senderId,
          receiverId: receiver.id,
          amount: transferAmount,
          note: note || null,
          status: 'completed',
        },
      })

      // Create transaction logs
      await tx.transactionLog.create({
        data: {
          userId: senderId,
          type: 'transfer',
          amount: -transferAmount,
          balanceBefore: sender.withdrawalBalance,
          balanceAfter: updatedSender.withdrawalBalance,
          wallet: 'withdrawal',
          description: `P2P transfer to ${receiver.name}`,
          referenceId: transfer.id,
          status: 'completed',
        },
      })

      await tx.transactionLog.create({
        data: {
          userId: receiver.id,
          type: 'transfer',
          amount: transferAmount,
          balanceBefore: receiver.tradingBalance,
          balanceAfter: updatedReceiver.tradingBalance,
          wallet: 'trading',
          description: `P2P transfer from ${sender.name}`,
          referenceId: transfer.id,
          status: 'completed',
        },
      })

      // Notify receiver
      await tx.notification.create({
        data: {
          userId: receiver.id,
          title: 'P2P Transfer Received',
          message: `You received $${transferAmount.toFixed(2)} from ${sender.name}${note ? ` - "${note}"` : ''}`,
          type: 'success',
        },
      })

      return {
        transfer,
        senderBalance: updatedSender.withdrawalBalance,
        receiverBalance: updatedReceiver.tradingBalance,
      }
    })

    return NextResponse.json({
      success: true,
      transferId: result.transfer.id,
      newWithdrawalBalance: result.senderBalance,
    })
  } catch (error) {
    console.error('P2P transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get P2P transfer history
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const transfers = await prisma.p2PTransfer.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error('P2P history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
