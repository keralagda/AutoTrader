import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'users'

    switch (type) {
      case 'users': {
        const users = await prisma.user.findMany({
          where: { isFake: false },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            referralCode: true,
            tradingBalance: true,
            withdrawalBalance: true,
            totalEarnings: true,
            totalDeposited: true,
            kycStatus: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        })

        // Convert to CSV
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Referral Code', 'Trading Balance', 'Withdrawal Balance', 'Total Earnings', 'Total Deposited', 'KYC Status', 'Active', 'Joined']
        const rows = users.map(u => [
          u.id,
          u.name,
          u.email,
          u.phone || '',
          u.role,
          u.referralCode,
          u.tradingBalance.toFixed(2),
          u.withdrawalBalance.toFixed(2),
          u.totalEarnings.toFixed(2),
          u.totalDeposited.toFixed(2),
          u.kycStatus,
          u.isActive ? 'Yes' : 'No',
          new Date(u.createdAt).toISOString(),
        ])

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      case 'deposits': {
        const deposits = await prisma.deposit.findMany({
          include: {
            user: { select: { name: true, email: true } },
            plan: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        const headers = ['ID', 'User', 'Email', 'Plan', 'Amount', 'Status', 'Earned', 'Created']
        const rows = deposits.map(d => [
          d.id,
          d.user.name,
          d.user.email,
          d.plan.name,
          d.amount.toFixed(2),
          d.status,
          d.earnedSoFar.toFixed(2),
          new Date(d.createdAt).toISOString(),
        ])

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="deposits_export_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      case 'withdrawals': {
        const withdrawals = await prisma.withdrawal.findMany({
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        const headers = ['ID', 'User', 'Email', 'Amount', 'Wallet Address', 'Status', 'Method', 'TX Hash', 'Created']
        const rows = withdrawals.map(w => [
          w.id,
          w.user.name,
          w.user.email,
          w.amount.toFixed(2),
          w.walletAddress,
          w.status,
          w.paymentMethod || '',
          w.txHash || '',
          new Date(w.createdAt).toISOString(),
        ])

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="withdrawals_export_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      case 'transactions': {
        const transactions = await prisma.transactionLog.findMany({
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        })

        const headers = ['ID', 'User', 'Email', 'Type', 'Amount', 'Wallet', 'Description', 'Status', 'Created']
        const rows = transactions.map(t => [
          t.id,
          t.user.name,
          t.user.email,
          t.type,
          t.amount.toFixed(2),
          t.wallet,
          t.description || '',
          t.status,
          new Date(t.createdAt).toISOString(),
        ])

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="transactions_export_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
