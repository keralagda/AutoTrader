import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'

const DEFAULT_SUGGESTIONS = [
  {
    id: 'suggest_conservative',
    name: 'Conservative (Risk-Averse / Solvent Focus)',
    description: 'Prioritizes platform safety and long-term liquidity. Higher power skew keeps daily yields low/stable, a strict daily cap prevents runaway payout days, and high loss/low bonus thresholds conserve capital.',
    color: 'emerald',
    variables: {
      var_base_skew: 4.5,
      var_daily_cap: 8.0,
      var_min_floor: 0.05,
      var_volatility: 0.3,
      var_compound_rate: 1.01,
      var_referral_boost: 0.02,
      var_loss_threshold: 8.0,
      var_bonus_threshold: 2.0
    }
  },
  {
    id: 'suggest_balanced',
    name: 'Balanced (Optimal Yield & Stability)',
    description: 'Standard baseline offering appealing, volatile daily yields to users while using moderate skew power and balanced thresholds to retain sufficient company margins.',
    color: 'cyan',
    variables: {
      var_base_skew: 3.0,
      var_daily_cap: 12.0,
      var_min_floor: 0.1,
      var_volatility: 0.5,
      var_compound_rate: 1.02,
      var_referral_boost: 0.05,
      var_loss_threshold: 5.0,
      var_bonus_threshold: 3.0
    }
  },
  {
    id: 'suggest_profiteering',
    name: 'Aggressive (Maximum Platform Profitability)',
    description: 'Optimized for high-yield marketing campaigns. Higher volatility factor and high daily cap ceiling attract large investors, while a higher skew power and increased loss thresholds keep real payouts highly profitable for the platform.',
    color: 'amber',
    variables: {
      var_base_skew: 5.5,
      var_daily_cap: 20.0,
      var_min_floor: 0.01,
      var_volatility: 0.7,
      var_compound_rate: 1.035,
      var_referral_boost: 0.08,
      var_loss_threshold: 10.0,
      var_bonus_threshold: 5.0
    }
  }
]

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json().catch(() => ({ prompt: '' }))

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS })
    }

    const systemPrompt = `You are a financial risk officer and quantitative analyst for a high-yield algorithmic crypto trading investment platform.
Analyze the admin's goal and recommend three distinct global variables configurations (Conservative, Balanced, and Aggressive/Profiteering) in JSON format.

Your output MUST be a JSON object containing exactly a "suggestions" key with a list of 3 items. Do not write any markdown code blocks, do not wrap in \`\`\`json, and do not write explanations outside of the JSON object.

Each suggestion in the list must have:
1. id: string (e.g. "suggest_conservative", "suggest_balanced", "suggest_profiteering")
2. name: string
3. description: string (detailed, explaining how these values maximize platform solvent margins and are profiteering)
4. color: string (one of: "emerald", "cyan", "amber")
5. variables: object mapping variable IDs to their recommended float values:
   - var_base_skew (range: 1.0 to 10.0)
   - var_daily_cap (range: 1.0 to 30.0)
   - var_min_floor (range: 0.0 to 1.0)
   - var_volatility (range: 0.0 to 1.0)
   - var_compound_rate (range: 1.0 to 1.1)
   - var_referral_boost (range: 0.0 to 0.5)
   - var_loss_threshold (range: 0.0 to 20.0)
   - var_bonus_threshold (range: 0.0 to 15.0)`

    const userPrompt = prompt 
      ? `The admin has specified this optimization objective: "${prompt}". Suggest customized values.`
      : `Provide the standard baseline suggestions.`

    const reply = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.3, maxTokens: 1024 })

    const cleaned = reply.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length === 3) {
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS })
  } catch (error) {
    console.error('AI Logic suggest error:', error)
    return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS })
  }
}
