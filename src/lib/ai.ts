// AI Integration Layer - Uses Groq for fast inference

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function aiChat(messages: AIMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured')
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('Groq API error:', error)
    throw new Error(`AI API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── Pre-built AI Functions ────────────────────────────────────────

export async function generateTradingSignal(pair: string = 'BTC/USDT', currentPrice: number = 0): Promise<{
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
  entry: string
  target: string
  stopLoss: string
}> {
  const priceContext = currentPrice > 0 
    ? `The current live market price of ${pair} is $${currentPrice}. You MUST generate the trade setup relative to this exact price: entry should be extremely close to $${currentPrice}, target should be higher than entry for BUY / lower for SELL, and stopLoss should be lower than entry for BUY / higher for SELL. For HOLD, you can set them near $${currentPrice}.`
    : `Use realistic current market prices.`;

  const response = await aiChat([
    {
      role: 'system',
      content: `You are a crypto trading analyst. Generate a realistic trading signal for the given pair. Respond ONLY in valid JSON format with these fields: signal (BUY/SELL/HOLD), confidence (0-100), reasoning (1-2 sentences), entry (price), target (price), stopLoss (price). ${priceContext}`,
    },
    { role: 'user', content: `Generate a trading signal for ${pair} right now.` },
  ], { temperature: 0.8, maxTokens: 256 })

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { signal: 'HOLD', confidence: 50, reasoning: 'Market analysis in progress', entry: '0', target: '0', stopLoss: '0' }
  }
}

export async function generateMarketCommentary(): Promise<string> {
  const response = await aiChat([
    {
      role: 'system',
      content: `You are a crypto market analyst writing a brief daily market update for an investment platform. Keep it under 100 words. Be professional, mention BTC, ETH, and general market sentiment. Include a bullish or bearish outlook. Do not use markdown.`,
    },
    { role: 'user', content: `Write today's market commentary for ${new Date().toLocaleDateString()}.` },
  ], { temperature: 0.8, maxTokens: 200 })

  return response
}

export async function generateSupportResponse(ticketSubject: string, ticketMessage: string, userName: string): Promise<string> {
  const response = await aiChat([
    {
      role: 'system',
      content: `You are a helpful customer support agent for BNFX, a crypto investment platform. Respond professionally and helpfully to user queries. Keep responses concise (2-4 sentences). Address the user by name. If the query is about withdrawals, mention 24-48 hour processing time. If about deposits, mention multiple payment methods available. Never make promises about returns or profits.`,
    },
    { role: 'user', content: `User: ${userName}\nSubject: ${ticketSubject}\nMessage: ${ticketMessage}\n\nGenerate a helpful support response.` },
  ], { temperature: 0.6, maxTokens: 256 })

  return response
}

export async function generateContent(type: 'news' | 'announcement' | 'promotion' | 'email', prompt: string): Promise<{ title: string; content: string }> {
  const systemPrompts: Record<string, string> = {
    news: 'You are a content writer for a crypto investment platform. Write a news article. Respond in JSON: {"title": "...", "content": "..."}. Keep content under 150 words.',
    announcement: 'You are writing a platform announcement. Be professional and concise. Respond in JSON: {"title": "...", "content": "..."}. Keep under 100 words.',
    promotion: 'You are writing a promotional message for a crypto platform. Be exciting but not scammy. Respond in JSON: {"title": "...", "content": "..."}. Keep under 80 words.',
    email: 'You are writing a professional email for a crypto investment platform. Respond in JSON: {"title": "subject line", "content": "email body"}. Keep under 150 words.',
  }

  const response = await aiChat([
    { role: 'system', content: systemPrompts[type] || systemPrompts.news },
    { role: 'user', content: prompt },
  ], { temperature: 0.7, maxTokens: 512 })

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { title: 'Generated Content', content: response }
  }
}

export async function analyzeFraudRisk(userId: string, action: string, amount: number, context: string): Promise<{ risk: 'low' | 'medium' | 'high'; reason: string }> {
  const response = await aiChat([
    {
      role: 'system',
      content: `You are a fraud detection system. Analyze the transaction and return a risk assessment. Respond ONLY in JSON: {"risk": "low|medium|high", "reason": "brief explanation"}`,
    },
    { role: 'user', content: `User: ${userId}, Action: ${action}, Amount: $${amount}, Context: ${context}` },
  ], { temperature: 0.3, maxTokens: 128 })

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { risk: 'low', reason: 'Unable to assess' }
  }
}
