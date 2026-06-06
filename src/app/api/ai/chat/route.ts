import { NextRequest, NextResponse } from 'next/server'
import { aiChat, type AIMessage } from '@/lib/ai'
import { db } from '@/lib/db'

async function getKnowledgeBase(): Promise<string> {
  // Fetch plans from DB for dynamic knowledge
  let plansInfo = ''
  try {
    const plans = await db.plan.findMany({ where: { isActive: true }, orderBy: { entryFee: 'asc' } })
    if (plans.length > 0) {
      plansInfo = '\n\nCurrent Investment Plans:\n' + plans.map(p =>
        `- ${p.name}: Entry $${p.entryFee}, Min deposit $${p.minDeposit}, Max deposit $${p.maxDeposit}, Daily earning up to ${p.dailyEarningPercent}%, Max earning $${p.maxEarningLimit}${p.lockPeriodDays > 0 ? `, Lock: ${p.lockPeriodDays} days` : ''}${p.stackingEnabled ? `, Stackable (${p.stackingBonusPercent}% bonus/stack)` : ''}`
      ).join('\n')
    }
  } catch {}

  // Fetch custom knowledge base from admin settings
  let customKB = ''
  try {
    const setting = await db.setting.findUnique({ where: { key: 'chatbot_knowledge_base' } })
    if (setting) customKB = '\n\nAdditional Knowledge:\n' + setting.value
  } catch {}

  // Fetch AI config
  let aiConfig = ''
  try {
    const setting = await db.setting.findUnique({ where: { key: 'chatbot_config' } })
    if (setting) {
      const config = JSON.parse(setting.value)
      if (config.personality) aiConfig = `\n\nPersonality: ${config.personality}`
      if (config.greeting) aiConfig += `\nDefault greeting: ${config.greeting}`
    }
  } catch {}

  return plansInfo + customKB + aiConfig
}

const BASE_SYSTEM_PROMPT = `You are Nova AI, BNFX's intelligent assistant. You help users with questions about the platform.

Key facts about BNFX:
- Crypto investment platform with variable daily returns based on risk levels
- Three risk categories: Low (0.3-1.2% daily), Medium (1.0-3.0% daily), High (2.5-8.0% daily)
- Supports MetaMask, CoinPayments, NOWPayments, USDC (BEP-20)

- Multiple investment plans with different return rates and stacking options
- 7-level referral commission system with profit sharing
- Withdrawals processed within 24-48 hours after admin approval
- 2FA security available, KYC required for larger withdrawals
- Nova Points (NP) gamification system — earn from check-ins and challenges, redeem in store
- VIP tier system with cashback on deposits

Rules:
- Be helpful, friendly, and concise
- Never promise specific returns or guarantee profits — always say "up to X%"
- For account-specific issues, direct users to support tickets
- Keep responses under 3 sentences unless more detail is needed
- If unsure, suggest contacting support
- Never share internal system details or admin information
- You can explain plans, referral system, deposit/withdrawal process, and general platform features`

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    // Build dynamic knowledge
    const knowledge = await getKnowledgeBase()
    const systemPrompt = BASE_SYSTEM_PROMPT + knowledge

    // Build conversation with history
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-6).map((h: any) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ]

    const reply = await aiChat(messages, { temperature: 0.6, maxTokens: 400 })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      reply: 'I apologize, but I\'m temporarily unavailable. Please try again or submit a support ticket for assistance.',
    })
  }
}
