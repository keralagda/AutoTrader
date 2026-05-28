import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Nova Points redemption rates and store items
const STORE_ITEMS = {
  convert_to_usdc: { id: 'convert_to_usdc', name: 'Convert to USDC', cost: 1000, description: 'Convert 1000 NP to $1 USDC in your trading wallet', type: 'conversion' },
  fee_waiver: { id: 'fee_waiver', name: 'Withdrawal Fee Waiver', cost: 500, description: 'Waive withdrawal fee on your next withdrawal', type: 'perk' },
  priority_withdrawal: { id: 'priority_withdrawal', name: 'Priority Withdrawal', cost: 200, description: 'Skip the withdrawal queue — instant processing', type: 'perk' },
  bonus_2x_24h: { id: 'bonus_2x_24h', name: '2x Earnings (24h)', cost: 2000, description: 'Double your earnings for the next 24 hours', type: 'boost' },
  extra_referral_level: { id: 'extra_referral_level', name: 'Unlock Level 8 Referral', cost: 5000, description: 'Temporarily unlock an 8th referral level for 7 days', type: 'boost' },
  lucky_spin: { id: 'lucky_spin', name: 'Lucky Spin', cost: 50, description: 'Spin the wheel for a chance to win $1-$100 bonus', type: 'spin' },
  custom_badge: { id: 'custom_badge', name: 'Exclusive Badge', cost: 3000, description: 'Get a unique profile badge that shows your status', type: 'cosmetic' },
  cooldown_skip: { id: 'cooldown_skip', name: 'Skip Cooldown', cost: 300, description: 'Skip the withdrawal cooldown period', type: 'perk' },
}

// GET - Get store items and user's NP balance
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const userStats = await db.userStats.findUnique({ where: { userId } })
    const novaPoints = userStats?.xp || 0
    const level = userStats?.level || 1

    // Get redemption history
    const historySetting = await db.setting.findUnique({ where: { key: `np_history_${userId}` } })
    const history = historySetting ? JSON.parse(historySetting.value) : []

    return NextResponse.json({
      novaPoints,
      level,
      storeItems: Object.values(STORE_ITEMS),
      history: history.slice(0, 20),
      conversionRate: '1000 NP = $1 USDC',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST - Redeem Nova Points for a store item
export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, quantity } = await req.json()
    if (!userId || !itemId) return NextResponse.json({ error: 'userId and itemId required' }, { status: 400 })

    const item = STORE_ITEMS[itemId as keyof typeof STORE_ITEMS]
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const qty = quantity || 1
    const totalCost = item.cost * qty

    // Check balance
    const userStats = await db.userStats.findUnique({ where: { userId } })
    if (!userStats || userStats.xp < totalCost) {
      return NextResponse.json({ error: `Insufficient Nova Points. Need ${totalCost} NP, have ${userStats?.xp || 0} NP` }, { status: 400 })
    }

    // Deduct points
    await db.userStats.update({
      where: { userId },
      data: { xp: { decrement: totalCost } },
    })

    // Apply reward based on item type
    let rewardMessage = ''

    if (itemId === 'convert_to_usdc') {
      const usdcAmount = qty * 1 // 1000 NP = $1, so qty conversions = $qty
      await db.user.update({
        where: { id: userId },
        data: { tradingBalance: { increment: usdcAmount } },
      })
      await db.transactionLog.create({
        data: { userId, type: 'bonus', amount: usdcAmount, wallet: 'trading', description: `Nova Points redemption: ${totalCost} NP → $${usdcAmount}`, status: 'completed' },
      })
      rewardMessage = `$${usdcAmount} USDC added to your trading wallet`
    }
    else if (itemId === 'lucky_spin') {
      // Random prize: $0.10 to $10
      const prizes = [0.10, 0.25, 0.50, 1, 2, 5, 10]
      const weights = [30, 25, 20, 12, 8, 4, 1] // Weighted probability
      const totalWeight = weights.reduce((s, w) => s + w, 0)
      let roll = Math.random() * totalWeight
      let prize = prizes[0]
      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i]
        if (roll <= 0) { prize = prizes[i]; break }
      }
      await db.user.update({ where: { id: userId }, data: { tradingBalance: { increment: prize } } })
      await db.transactionLog.create({
        data: { userId, type: 'bonus', amount: prize, wallet: 'trading', description: `Lucky Spin prize: $${prize}`, status: 'completed' },
      })
      rewardMessage = `🎰 You won $${prize.toFixed(2)}!`
    }
    else {
      // Perks/boosts — store as active perk
      const perkKey = `perk_${itemId}_${userId}`
      await db.setting.upsert({
        where: { key: perkKey },
        update: { value: JSON.stringify({ activatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }) },
        create: { key: perkKey, value: JSON.stringify({ activatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }) },
      })
      rewardMessage = `${item.name} activated!`
    }

    // Save to history
    const historySetting = await db.setting.findUnique({ where: { key: `np_history_${userId}` } })
    const history = historySetting ? JSON.parse(historySetting.value) : []
    history.unshift({ itemId, itemName: item.name, cost: totalCost, reward: rewardMessage, date: new Date().toISOString() })
    await db.setting.upsert({
      where: { key: `np_history_${userId}` },
      update: { value: JSON.stringify(history.slice(0, 50)) },
      create: { key: `np_history_${userId}`, value: JSON.stringify(history.slice(0, 50)) },
    })

    // Notification
    await db.notification.create({
      data: { userId, title: 'Nova Points Redeemed! ✨', message: `${item.name} — ${rewardMessage}`, type: 'success' },
    })

    return NextResponse.json({ success: true, message: rewardMessage, remainingPoints: userStats.xp - totalCost })
  } catch (error) {
    console.error('Redeem error:', error)
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }
}
