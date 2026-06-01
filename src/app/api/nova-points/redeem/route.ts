import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { loadNPConfig } from '@/lib/nova-points-config'

// GET - Get store items and user's NP balance
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const config = await loadNPConfig()
    const userStats = await db.userStats.findUnique({ where: { userId } })
    const novaPoints = userStats?.xp || 0
    const level = userStats?.level || 1

    // Get redemption history
    const historySetting = await db.setting.findUnique({ where: { key: `np_history_${userId}` } })
    const history = historySetting ? JSON.parse(historySetting.value) : []

    // Only return enabled store items
    const storeItems = config.storeItems.filter((item: any) => item.enabled !== false)

    return NextResponse.json({
      novaPoints,
      level,
      storeItems,
      history: history.slice(0, 20),
      conversionRate: `${config.conversionRate} NP = $1 USDC`,
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

    const config = await loadNPConfig()
    const item = config.storeItems.find((i: any) => i.id === itemId)
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    if (item.enabled === false) return NextResponse.json({ error: 'Item is currently disabled' }, { status: 400 })

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
      const usdcAmount = (totalCost / config.conversionRate) // Dynamic conversion rate
      await db.user.update({
        where: { id: userId },
        data: { tradingBalance: { increment: usdcAmount } },
      })
      await db.transactionLog.create({
        data: { userId, type: 'bonus', amount: usdcAmount, wallet: 'trading', description: `Nova Points redemption: ${totalCost} NP → $${usdcAmount.toFixed(2)}`, status: 'completed' },
      })
      rewardMessage = `$${usdcAmount.toFixed(2)} USDC added to your trading wallet`
    }
    else if (itemId === 'lucky_spin') {
      // Use configurable prizes
      const prizes = config.luckySpinPrizes || [{ amount: 0.10, weight: 100 }]
      const totalWeight = prizes.reduce((s: number, p: any) => s + p.weight, 0)
      let roll = Math.random() * totalWeight
      let prize = prizes[0].amount
      for (const p of prizes) {
        roll -= p.weight
        if (roll <= 0) { prize = p.amount; break }
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
