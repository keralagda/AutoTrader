import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_PLANS } from '@/lib/types'

export async function POST() {
  try {
    // Create admin user if not exists
    const existingAdmin = await db.user.findFirst({ where: { role: 'admin' } })
    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: 'admin@autotrade.com',
          name: 'Admin',
          password: 'admin123',
          role: 'admin',
          referralCode: 'ADMIN001',
          tradingBalance: 0,
          withdrawalBalance: 0,
        },
      })
    }

    // Create default plans if none exist
    const existingPlans = await db.plan.count()
    if (existingPlans === 0) {
      for (const plan of DEFAULT_PLANS) {
        await db.plan.create({ data: plan })
      }
    }

    // Create default payment gateways
    const existingGateways = await db.paymentGateway.count()
    if (existingGateways === 0) {
      const defaultGateways = [
        { name: 'USDC (Polygon)', type: 'crypto', network: 'polygon', minAmount: 10, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 1 },
        { name: 'Bitcoin (BTC)', type: 'crypto', network: 'bitcoin', minAmount: 50, maxAmount: 100000, feePercent: 0.5, isActive: false, sortOrder: 2 },
        { name: 'Ethereum (ETH)', type: 'crypto', network: 'ethereum', minAmount: 25, maxAmount: 100000, feePercent: 0.3, isActive: false, sortOrder: 3 },
        { name: 'UPI', type: 'indian', minAmount: 100, maxAmount: 100000, feePercent: 0, isActive: true, sortOrder: 4 },
        { name: 'Bank Transfer (NEFT/IMPS)', type: 'indian', minAmount: 500, maxAmount: 500000, feePercent: 0, isActive: false, sortOrder: 5 },
        { name: 'Razorpay (Cards/Wallets)', type: 'indian', minAmount: 100, maxAmount: 200000, feePercent: 2, isActive: false, sortOrder: 6 },
      ]
      for (const gw of defaultGateways) {
        await db.paymentGateway.create({ data: gw })
      }
    }

    // Create default settings
    const existingSettings = await db.setting.count()
    if (existingSettings === 0) {
      const defaultSettings = [
        { key: 'platform_name', value: 'Auto Trade' },
        { key: 'min_withdrawal', value: '10' },
        { key: 'withdrawal_fee_percent', value: '2' },
        { key: 'trading_days', value: 'monday,tuesday,wednesday,thursday,friday' },
        { key: 'auto_approve_withdrawals', value: 'false' },
        { key: 'max_withdrawal_per_day', value: '5000' },
      ]
      for (const s of defaultSettings) {
        await db.setting.create({ data: s })
      }
    }

    return NextResponse.json({ message: 'Seed completed' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
