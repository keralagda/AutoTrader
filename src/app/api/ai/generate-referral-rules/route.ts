import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Database connectivity guard
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    const { prompt, currentRules } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert compensation plan architect. Your task is to modify or construct a set of level-by-level referral override rules for an investment platform.
    
We support three types of override rules:
1. "registration": override on registration fee (syncs to fee community split)
2. "profit": override on daily trade profit payouts (syncs to Shared Pool split)
3. "deposit": override on deposit/investment amounts (one-time bonus when downline invests)

Each rule object must have these exact parameters:
- level: number (from 1 to 20)
- commission: number (percentage override, e.g. 10.0 for 10%)
- amount: number (flat override amount, e.g. 5.0 for $5.0. Set to 0 if using percentage)
- type: string (must be one of: "registration", "profit", "deposit")
- minSponsorDeposit: number (min active deposit required of sponsor to unlock, e.g. 500.0)
- minDirectReferrals: number (min direct referrals count required, e.g. 3)
- targetWallet: string (must be: "trading" or "withdrawal")
- enabled: boolean (whether active)

Here are the current active rules for context:
${JSON.stringify(currentRules || [])}

Analyze the user's natural language request (e.g., "Level 1 gets 10% profit share but needs $1000 deposit, Level 2 gets $5 deposit bonus and Level 1 registration gets 40%") and output a JSON object containing a single key "rules" which is a clean array of rule objects. Do not wrap in markdown or include any text other than the raw JSON.`

    const reply = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.2, maxTokens: 2048 })

    const cleaned = reply.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI Referral Rules Generator error:', error)
    return NextResponse.json({ error: 'Failed to generate referral rules with AI' }, { status: 500 })
  }
}
