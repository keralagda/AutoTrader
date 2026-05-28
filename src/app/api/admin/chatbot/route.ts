import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get chatbot config and knowledge base
export async function GET() {
  try {
    const [configSetting, kbSetting] = await Promise.all([
      db.setting.findUnique({ where: { key: 'chatbot_config' } }),
      db.setting.findUnique({ where: { key: 'chatbot_knowledge_base' } }),
    ])

    const config = configSetting ? JSON.parse(configSetting.value) : {
      name: 'Nova AI',
      personality: 'Friendly, helpful, and concise. Uses emojis occasionally.',
      greeting: 'Hi! I\'m Nova AI 🤖 — your BNFX assistant. Ask me anything about our plans, earnings, referrals, or how the platform works!',
      enabled: true,
      model: 'groq',
      temperature: 0.6,
      maxTokens: 400,
    }

    const knowledgeBase = kbSetting?.value || ''

    return NextResponse.json({ config, knowledgeBase })
  } catch (error) {
    console.error('Chatbot GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT - Update chatbot config or knowledge base
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.config) {
      await db.setting.upsert({
        where: { key: 'chatbot_config' },
        update: { value: JSON.stringify(body.config) },
        create: { key: 'chatbot_config', value: JSON.stringify(body.config) },
      })
    }

    if (body.knowledgeBase !== undefined) {
      await db.setting.upsert({
        where: { key: 'chatbot_knowledge_base' },
        update: { value: body.knowledgeBase },
        create: { key: 'chatbot_knowledge_base', value: body.knowledgeBase },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chatbot PUT error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
