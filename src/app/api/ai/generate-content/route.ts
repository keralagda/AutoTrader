import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { type, prompt } = await req.json()

    if (!type || !prompt) {
      return NextResponse.json({ error: 'type and prompt required' }, { status: 400 })
    }

    const validTypes = ['news', 'announcement', 'promotion', 'email', 'page']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use: news, announcement, promotion, email, page' }, { status: 400 })
    }

    const content = await generateContent(type, prompt)
    return NextResponse.json(content)
  } catch (error) {
    console.error('AI content generation error:', error)
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  }
}
