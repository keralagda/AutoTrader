import { NextRequest, NextResponse } from 'next/server'
import { aiChat, type AIMessage } from '@/lib/ai'

const SYSTEM_PROMPT = `You are BNFX's AI assistant. You help users with questions about the platform.

Key facts about BNFX:
- Crypto investment platform with daily returns
- Supports USDC, BTC, ETH deposits
- UPI and bank transfer also available
- Multiple investment plans with different return rates
- 7-level referral commission system
- Withdrawals processed within 24-48 hours
- 2FA security available
- KYC required for withdrawals above $500

Rules:
- Be helpful, concise, and professional
- Never promise specific returns or guarantee profits
- For account-specific issues, direct users to support tickets
- Keep responses under 3 sentences unless more detail is needed
- If unsure, suggest contacting support
- Never share internal system details or admin information`

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    // Build conversation with history
    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).slice(-6).map((h: any) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ]

    const reply = await aiChat(messages, { temperature: 0.6, maxTokens: 300 })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      reply: 'I apologize, but I\'m temporarily unavailable. Please try again or submit a support ticket for assistance.',
    })
  }
}
