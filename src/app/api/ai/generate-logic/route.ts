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

    const { prompt, currentConfig } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert system architect and rules engine designer. Your job is to parse a natural language prompt from an administrator and modify or construct a Logic Config object containing variables, profitRules, calculatorRules, stackingRules, patterns, depositRules, and riskRules.

Your output MUST be a single, valid JSON object matching the requested schema. Do not include any explanations, markdown code blocks (e.g. do not wrap in \`\`\`json), or extra text outside the JSON object.

The target JSON structure has these keys:
1. variables: array of objects: { id: string, name: string, type: string, value: number, min: number, max: number, step?: number, description: string }
2. profitRules: array of objects: { id: string, name: string, type: string, enabled: boolean, priority: number, condition: string, action: string, value?: number, min?: number, max?: number, step?: number, description: string, variableRef?: string | null, days?: string[], chance?: number, minDays?: number, maxDays?: number, tiers?: any }
3. calculatorRules: array of objects: { id: string, name: string, type: string, enabled: boolean, description: string, skewFactor?: number, min?: number, max?: number, step?: number, tradingDaysPerMonth?: number, tradingDaysPerYear?: number, text?: string }
4. stackingRules: array of objects: { id: string, name: string, type: string, enabled: boolean, bonusPerStack?: number, min?: number, max?: number, step?: number, maxStacks?: number, compoundRate?: number, variableRef?: string | null, diminishRate?: number, bonusPerLockDay?: number, maxLockBonus?: number, scaleFactor?: number, description: string }
5. patterns: array of objects: { id: string, name: string, type: string, enabled: boolean, startMultiplier?: number, endMultiplier?: number, rampDays?: number, min?: number, max?: number, step?: number, amplitude?: number, periodDays?: number, decayRate?: number, minMultiplier?: number, peakDay?: number, resetMultiplier?: number, peakMultiplier?: number, stepSize?: number, meanReversion?: number, highMonths?: number[], lowMonths?: number[], highMultiplier?: number, lowMultiplier?: number, description: string }
6. depositRules: array of objects: { id: string, name: string, type: string, enabled: boolean, cooldownHours?: number, maxAmount?: number, minAmount?: number, requirements?: any, penaltySchedule?: any, upgradeThreshold?: number, lockHours?: number, frequency?: string, hour?: number, minute?: number, timezone?: string, modes?: string[], defaultMode?: string, partialPercent?: number, actions?: string[], defaultAction?: string, reducedRate?: number, description: string }
7. riskRules: array of objects: { id: string, name: string, type: string, enabled: boolean, adjustInterval?: string, maxAdjust?: number, loyaltyBonus?: number, minDays?: number, highLoadReduction?: number, threshold?: number, correlationFactor?: number, description: string }

Here is the current active logic configuration to use as a baseline:
${JSON.stringify(currentConfig || {})}

Ensure you modify the values, toggles (enabled: true/false), variables, or descriptions as described by the administrator in the user prompt, while keeping the other rules intact. Output ONLY the raw JSON string.`

    const reply = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.2, maxTokens: 4096 })

    const cleaned = reply.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI Logic Generator error:', error)
    return NextResponse.json({ error: 'Failed to generate logic rules with AI' }, { status: 500 })
  }
}
