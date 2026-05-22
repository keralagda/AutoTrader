import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { operation, userIds, data } = await req.json()

    if (!operation || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'operation and userIds array required' }, { status: 400 })
    }

    let result: any = { success: true, affected: 0 }

    switch (operation) {
      case 'add_balance': {
        const amount = parseFloat(data?.amount)
        const wallet = data?.wallet || 'trading'
        if (isNaN(amount) || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount required' }, { status: 400 })
        }

        const updateField = wallet === 'withdrawal' ? 'withdrawalBalance' : 'tradingBalance'
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { [updateField]: { increment: amount } },
        })

        // Create transaction logs
        for (const userId of userIds) {
          await prisma.transactionLog.create({
            data: {
              userId,
              type: 'bonus',
              amount,
              wallet,
              description: `Admin bulk balance addition`,
              status: 'completed',
            },
          })
        }

        result.affected = userIds.length
        result.message = `Added $${amount} to ${wallet} wallet for ${userIds.length} users`
        break
      }

      case 'deduct_balance': {
        const amount = parseFloat(data?.amount)
        const wallet = data?.wallet || 'trading'
        if (isNaN(amount) || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount required' }, { status: 400 })
        }

        const updateField = wallet === 'withdrawal' ? 'withdrawalBalance' : 'tradingBalance'
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { [updateField]: { decrement: amount } },
        })

        result.affected = userIds.length
        result.message = `Deducted $${amount} from ${wallet} wallet for ${userIds.length} users`
        break
      }

      case 'send_notification': {
        const { title, message, type } = data || {}
        if (!title || !message) {
          return NextResponse.json({ error: 'title and message required' }, { status: 400 })
        }

        await prisma.notification.createMany({
          data: userIds.map((userId: string) => ({
            userId,
            title,
            message,
            type: type || 'info',
          })),
        })

        result.affected = userIds.length
        result.message = `Sent notification to ${userIds.length} users`
        break
      }

      case 'activate_users': {
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true },
        })
        result.affected = userIds.length
        result.message = `Activated ${userIds.length} users`
        break
      }

      case 'deactivate_users': {
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false },
        })
        result.affected = userIds.length
        result.message = `Deactivated ${userIds.length} users`
        break
      }

      case 'approve_withdrawals': {
        const withdrawals = await prisma.withdrawal.updateMany({
          where: {
            id: { in: userIds }, // In this case, userIds are withdrawal IDs
            status: 'pending',
          },
          data: { status: 'approved' },
        })
        result.affected = withdrawals.count
        result.message = `Approved ${withdrawals.count} withdrawals`
        break
      }

      case 'reject_withdrawals': {
        const withdrawals = await prisma.withdrawal.updateMany({
          where: {
            id: { in: userIds },
            status: 'pending',
          },
          data: { status: 'rejected' },
        })
        result.affected = withdrawals.count
        result.message = `Rejected ${withdrawals.count} withdrawals`
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
    }

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        action: `bulk_${operation}`,
        details: JSON.stringify({ userIds, data, result }),
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bulk operations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
