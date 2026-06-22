import { NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import { db } from '@/lib/db'

async function checkDbConnection() {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

const dbErrorResponse = () => NextResponse.json({
  error: 'Database connection failed',
  diagnosticTrace: {
    message: 'Failed to connect to the database container or host.',
    actions: [
      'Check DB Container Status (running/healthy)',
      'Verify Network Bridge / port mappings',
      'Validate .env mapping (DATABASE_URL)'
    ]
  }
}, { status: 503 })

export async function POST(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `You are a professional system architect. Generate a list of custom fields based on the user's description.
Return ONLY a valid JSON array of fields (no markdown, no backticks, no wrap text, just clean JSON). Each object in the array MUST contain:
- "key": camelCase or snake_case string unique ID
- "label": human-readable label string
- "type": one of "text", "number", "select", "date", "image", "boolean"
- "options": (only for type "select") a comma-separated string of options (e.g. "Low,Medium,High") or null
- "placeholder": string description or helper text or null
- "required": boolean true/false

Example output format:
[
  {
    "key": "volatility_level",
    "label": "Volatility Level",
    "type": "select",
    "options": "Low,Medium,High",
    "placeholder": "Select volatility",
    "required": true
  },
  {
    "key": "notes",
    "label": "Analysis Notes",
    "type": "text",
    "options": null,
    "placeholder": "Enter analysis notes",
    "required": false
  }
]`

    const aiResponse = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate custom fields for: ${prompt}` }
    ], { temperature: 0.2, maxTokens: 1000 })

    // Parse the response to verify it is valid JSON
    let parsedFields = []
    try {
      // Clean potential markdown wrappers
      let cleaned = aiResponse.trim()
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7)
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3)
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3)
      }
      parsedFields = JSON.parse(cleaned.trim())
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse, parseError)
      return NextResponse.json({ error: 'AI generated invalid JSON structure. Please try again with a different prompt.' }, { status: 500 })
    }

    return NextResponse.json({ fields: parsedFields })
  } catch (error: any) {
    console.error('AI field suggestion failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate fields' }, { status: 500 })
  }
}
