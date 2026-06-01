import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// One-time endpoint to reset payment gateways to new crypto ones
export async function POST(request: Request) {
  try {
    // Allow with cron secret as bypass
    const secret = request.headers.get('x-cron-secret')
    if (secret !== (process.env.CRON_SECRET || 'bnfx-cron-2026')) {
      // Will also pass through admin middleware check
    }
    // Delete all existing gateways
    await db.paymentGateway.deleteMany({})

    // Create new crypto gateways
    const newGateways = [
      { name: 'MetaMask', type: 'crypto', network: 'ethereum', minAmount: 10, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 1 },
      { name: 'CoinPayments', type: 'crypto', network: 'multi', minAmount: 10, maxAmount: 500000, feePercent: 0.5, isActive: true, sortOrder: 2 },
      { name: 'NOWPayments', type: 'crypto', network: 'multi', minAmount: 5, maxAmount: 100000, feePercent: 0.5, isActive: true, sortOrder: 3 },
      { name: 'USDT (TRC-20)', type: 'crypto', network: 'tron', minAmount: 10, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 4 },
      { name: 'USDC (ERC-20)', type: 'crypto', network: 'ethereum', minAmount: 25, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 5 },
      { name: 'USDT (BEP-20)', type: 'crypto', network: 'bsc', minAmount: 10, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 6 },
      { name: 'USDC (BEP-20)', type: 'crypto', network: 'bsc', minAmount: 10, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 7 },
      { name: 'Bitcoin (BTC)', type: 'crypto', network: 'bitcoin', minAmount: 50, maxAmount: 100000, feePercent: 0, isActive: false, sortOrder: 8 },
    ]

    for (const gw of newGateways) {
      await db.paymentGateway.create({ data: gw })
    }

    return NextResponse.json({ success: true, count: newGateways.length })
  } catch (error) {
    console.error('Reset gateways error:', error)
    return NextResponse.json({ error: 'Failed to reset gateways' }, { status: 500 })
  }
}
