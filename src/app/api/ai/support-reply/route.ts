import { NextRequest, NextResponse } from 'next/server'
import { generateSupportResponse } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { subject, message, userName } = await req.json()

    if (!subject || !message) {
      return NextResponse.json({ error: 'subject and message required' }, { status: 400 })
    }

    const reply = await generateSupportResponse(subject, message, userName || 'User')
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI support reply error:', error)
    return NextResponse.json({
      reply: 'Thank you for reaching out. Our team will review your query and get back to you within 24 hours.',
    })
  }
}
