import { NextRequest, NextResponse } from 'next/server'

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || ''
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'

// Cache translations in memory to avoid repeated API calls
const translationCache: Record<string, Record<string, string>> = {}

export async function POST(req: NextRequest) {
  try {
    const { texts, targetLang } = await req.json()

    if (!texts || !Array.isArray(texts) || !targetLang) {
      return NextResponse.json({ error: 'texts array and targetLang required' }, { status: 400 })
    }

    if (targetLang === 'en') {
      // No translation needed for English
      return NextResponse.json({ translations: texts })
    }

    // Check cache
    const cacheKey = `${targetLang}_${texts.join('|').substring(0, 100)}`
    if (translationCache[cacheKey]) {
      return NextResponse.json({ translations: Object.values(translationCache[cacheKey]) })
    }

    if (!NVIDIA_API_KEY) {
      // Fallback: return original texts if no API key
      return NextResponse.json({ translations: texts })
    }

    const langNames: Record<string, string> = {
      ar: 'Arabic', fr: 'French', es: 'Spanish', pt: 'Portuguese',
      ru: 'Russian', tr: 'Turkish', hi: 'Hindi', id: 'Indonesian', zh: 'Chinese (Simplified)',
    }

    const langName = langNames[targetLang] || targetLang

    // Batch translate using NVIDIA API
    const prompt = `Translate the following texts to ${langName}. Return ONLY a JSON array of translated strings in the same order. Do not add explanations.

Input: ${JSON.stringify(texts)}

Output:`

    const res = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })

    if (!res.ok) {
      console.error('NVIDIA API error:', await res.text())
      return NextResponse.json({ translations: texts })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse the JSON array from response
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
      const translated = JSON.parse(cleaned)
      if (Array.isArray(translated) && translated.length === texts.length) {
        // Cache the result
        const cacheObj: Record<string, string> = {}
        texts.forEach((t: string, i: number) => { cacheObj[t] = translated[i] })
        translationCache[cacheKey] = cacheObj
        return NextResponse.json({ translations: translated })
      }
    } catch {
      // If parsing fails, try to extract translations line by line
    }

    // Fallback
    return NextResponse.json({ translations: texts })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ translations: [] }, { status: 500 })
  }
}
