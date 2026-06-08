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

    const { prompt, currentLogics } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert rule engine developer. Your task is to construct or modify a list of plan-specific conditional logics based on a natural language prompt from the administrator.

We support these condition types:
- "daily_yield": Triggered based on the current daily return percentage.
- "consecutive_loss_days": Triggered based on the count of consecutive days with negative yield.
- "active_deposits": Triggered based on the sum of all active deposits in the plan.
- "day_of_week": Triggered on specific weekdays (e.g. "mon", "fri").
- "spots_filled": Triggered based on the count of active deposits slots filled.

We support these operator types:
- ">" (greater than)
- "<" (less than)
- "==" (equals)
- "contains" (for checking weekdays or lists)

We support these action types:
- "adjust_yield": Adjust the daily return yield. Action value can be relative (e.g., "+0.25", "-0.15") or absolute (e.g. "1.5").
- "adjust_multiplier": Adjust the daily capping multiplier (e.g., "1.5" for 1.5X).
- "pause_referrals": Pause sponsor fee and profit share payouts. Value must be "true" or "false".
- "adjust_splits": Reallocate fee/yield distribution splits. Value format: "holder:80,shared:15,platform:5" (must sum to 100%).
- "disable_plan": Temporarily disable new investments/reinvestments. Value must be "true" or "false".

Each logic rule must have these exact parameters:
- priority: number (1-100, lower is evaluated first)
- conditionType: string (must be: "daily_yield", "consecutive_loss_days", "active_deposits", "day_of_week", "spots_filled")
- operator: string (must be: ">", "<", "==", "contains")
- value: string (e.g. "1.0", "3", "mon", "50")
- actionType: string (must be: "adjust_yield", "adjust_multiplier", "pause_referrals", "adjust_splits", "disable_plan")
- actionValue: string (e.g. "+0.25", "holder:80,shared:15,platform:5", "true")
- description: string (plain English summary of the rule)
- enabled: boolean (whether active)

Here are the current logics for context:
${JSON.stringify(currentLogics || [])}

Analyze the user's natural language request (e.g., "If yield is less than 0.5%, change splits to investor 80, shared pool 15, and platform 5. Also if consecutive loss days reaches 3, pause referrals.") and output a JSON object containing a single key "logics" which is a clean array of rule objects. Do not wrap in markdown or include any text other than the raw JSON.`

    const reply = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.2, maxTokens: 2048 })

    const cleaned = reply.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI Conditional Logics Generator error:', error)
    return NextResponse.json({ error: 'Failed to generate conditional logics with AI' }, { status: 500 })
  }
}
