import { NextResponse } from 'next/server'
import { generateMarketCommentary } from '@/lib/ai'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check cache (store in settings, refresh every 4 hours)
    const cached = await prisma.setting.findUnique({ where: { key: 'ai_market_commentary' } })
    if (cached) {
      const data = JSON.parse(cached.value)
      const age = Date.now() - new Date(data.generatedAt).getTime()
      if (age < 4 * 60 * 60 * 1000) { // 4 hours
        return NextResponse.json(data)
      }
    }

    // Generate fresh commentary
    const commentary = await generateMarketCommentary()
    const data = { commentary, generatedAt: new Date().toISOString() }

    // Cache it
    await prisma.setting.upsert({
      where: { key: 'ai_market_commentary' },
      update: { value: JSON.stringify(data) },
      create: { key: 'ai_market_commentary', value: JSON.stringify(data) },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Market commentary error:', error)
    return NextResponse.json({
      commentary: 'Markets are showing mixed signals today. Bitcoin continues to trade within its established range while altcoins show varied performance. Investors are advised to maintain their positions and watch for key support levels.',
      generatedAt: new Date().toISOString(),
    })
  }
}
