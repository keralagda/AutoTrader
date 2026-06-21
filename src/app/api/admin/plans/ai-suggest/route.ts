import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || ''
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Regex parser fallback values
function generateRegexFallback(prompt: string) {
  const cleanPrompt = prompt.toLowerCase()

  const extractNumber = (patterns: RegExp[]): number | null => {
    for (const pattern of patterns) {
      const match = cleanPrompt.match(pattern)
      if (match && match[1]) {
        return parseFloat(match[1])
      }
    }
    return null
  }

  const promptEntryFee = extractNumber([
    /entry\s*(?:fee)?\s*(?:of)?\s*\$?([0-9.]+)/,
    /fee\s*\$?([0-9.]+)/,
    /cost\s*\$?([0-9.]+)/,
    /\$?([0-9.]+)\s*entry/
  ]) || 100

  const promptMinDeposit = extractNumber([
    /min(?:imum)?\s*(?:deposit)?\s*(?:of)?\s*\$?([0-9.]+)/,
    /deposit\s*(?:limit)?\s*\$?([0-9.]+)/,
    /invest(?:ment)?\s*(?:limit)?\s*\$?([0-9.]+)/,
    /\$?([0-9.]+)\s*min/
  ]) || 100

  const promptMaxDeposit = extractNumber([
    /max(?:imum)?\s*(?:deposit)?\s*(?:of)?\s*\$?([0-9.]+)/,
    /to\s*\$?([0-9.]+)/,
    /\$?([0-9.]+)\s*max/
  ]) || 5000

  const promptPairing = extractNumber([
    /([0-9.]+)\s*%\s*(?:pairing|binary)/,
    /pairing\s*(?:bonus|income)?\s*(?:of)?\s*([0-9.]+)\s*%/,
    /binary\s*(?:bonus|income)?\s*(?:of)?\s*([0-9.]+)\s*%/
  ]) || 10

  const promptCapping = extractNumber([
    /([0-9.]+)\s*(?:capping|cap)/,
    /capping\s*(?:of)?\s*\$?([0-9.]+)/,
    /cap\s*(?:of)?\s*\$?([0-9.]+)/,
    /daily\s*cap\s*\$?([0-9.]+)/
  ]) || 1000

  const promptDailyProfit = extractNumber([
    /([0-9.]+)\s*%\s*(?:daily|profit|yield|roi)/,
    /daily\s*(?:profit|yield|roi)?\s*(?:of)?\s*([0-9.]+)\s*%/,
    /profit\s*(?:of)?\s*([0-9.]+)\s*%\s*daily/
  ]) || 1.5

  return [
    {
      id: "suggest_conservative",
      outcomeType: "Conservative (Low Risk)",
      description: "Focuses on capital preservation, sustainable daily yields, and robust risk reserves.",
      color: "emerald",
      planDetails: {
        name: cleanPrompt.includes('vip') ? "Nova VIP Lite" : "Daily Flash Binary",
        description: "Stable binary network plan optimized for low risk and consistent payouts.",
        entryFee: promptEntryFee,
        minDeposit: promptMinDeposit,
        maxDeposit: promptMaxDeposit,
        dailyEarningPercent: Math.max(0.5, Number((promptDailyProfit * 0.75).toFixed(2))),
        maxEarningMultiplier: 2.0,
        maxEarningLimit: promptMinDeposit * 2.0,
        durationDays: 400,
        capitalReturn: "included",
        isBinaryMlmEnabled: true,
        binaryPairingBonusPercent: Math.max(5, Number((promptPairing * 0.8).toFixed(1))),
        binaryDailyPairingCap: Math.max(100, Math.round(promptCapping * 0.5)),
        binaryCarryForward: true,
        binarySpilloverPlacement: "balanced",
        binaryCycleRatio: "1:1",
        accountHolderPercent: 55,
        tradeProfitSharePercent: 25,
        rewardsOffersPercent: 15,
        platformFeePercent: 5,
        lowRiskMin: 0.5,
        lowRiskMax: 1.2,
        mediumRiskMin: 1.2,
        mediumRiskMax: 2.0,
        highRiskMin: 2.0,
        highRiskMax: 4.0,
        riskLevels: "low,medium"
      }
    },
    {
      id: "suggest_balanced",
      outcomeType: "Balanced (Moderate Risk)",
      description: "Optimal mix of standard pairing income, capping limits, and daily trading profits.",
      color: "cyan",
      planDetails: {
        name: cleanPrompt.includes('vip') ? "Nova VIP Vector" : "Nova Vector Binary",
        description: "Balanced binary network plan with optimized daily splits and higher capping threshold.",
        entryFee: Math.round(promptEntryFee * 1.2),
        minDeposit: promptMinDeposit,
        maxDeposit: Math.round(promptMaxDeposit * 1.5),
        dailyEarningPercent: promptDailyProfit,
        maxEarningMultiplier: 2.5,
        maxEarningLimit: promptMinDeposit * 2.5,
        durationDays: 300,
        capitalReturn: "end",
        isBinaryMlmEnabled: true,
        binaryPairingBonusPercent: promptPairing,
        binaryDailyPairingCap: promptCapping,
        binaryCarryForward: true,
        binarySpilloverPlacement: "balanced",
        binaryCycleRatio: "1:1",
        accountHolderPercent: 50,
        tradeProfitSharePercent: 30,
        rewardsOffersPercent: 15,
        platformFeePercent: 5,
        lowRiskMin: 0.75,
        lowRiskMax: 1.5,
        mediumRiskMin: 1.5,
        mediumRiskMax: 3.0,
        highRiskMin: 3.0,
        highRiskMax: 5.0,
        riskLevels: "low,medium,high"
      }
    },
    {
      id: "suggest_aggressive",
      outcomeType: "Aggressive (High Yield)",
      description: "High performance capping, elevated referral commissions, and maximum returns.",
      color: "purple",
      planDetails: {
        name: cleanPrompt.includes('vip') ? "Nova VIP Royale" : "Nova Royale Binary",
        description: "High-yield binary accelerator plan for maximum network expansion and payout velocity.",
        entryFee: Math.round(promptEntryFee * 1.5),
        minDeposit: Math.round(promptMinDeposit * 1.5),
        maxDeposit: promptMaxDeposit * 3,
        dailyEarningPercent: Math.min(10, Number((promptDailyProfit * 1.5).toFixed(2))),
        maxEarningMultiplier: 3.5,
        maxEarningLimit: promptMinDeposit * 3.5,
        durationDays: 200,
        capitalReturn: "none",
        isBinaryMlmEnabled: true,
        binaryPairingBonusPercent: Math.min(25, Number((promptPairing * 1.25).toFixed(1))),
        binaryDailyPairingCap: promptCapping * 2,
        binaryCarryForward: true,
        binarySpilloverPlacement: "balanced",
        binaryCycleRatio: "1:1",
        accountHolderPercent: 45,
        tradeProfitSharePercent: 35,
        rewardsOffersPercent: 15,
        platformFeePercent: 5,
        lowRiskMin: 1.0,
        lowRiskMax: 2.0,
        mediumRiskMin: 2.0,
        mediumRiskMax: 4.5,
        highRiskMin: 4.5,
        highRiskMax: 10.0,
        riskLevels: "medium,high"
      }
    }
  ]
}

export async function POST(request: Request) {
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

    const { prompt } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert MLM and binary network marketing compensation plan architect. Your task is to analyze the administrator's request and generate exactly three distinct binary investment plans: Conservative (Low Risk), Balanced (Moderate Risk), and Aggressive (High Yield).

For each suggestion, you MUST return a valid JSON object structure matching the following:
{
  "id": "suggest_conservative" | "suggest_balanced" | "suggest_aggressive",
  "outcomeType": string (e.g. "Conservative (Low Risk)"),
  "description": string (explanation of this outcome's strategy),
  "color": "emerald" | "cyan" | "purple",
  "planDetails": {
    "name": string (a professional, industry-specific name),
    "description": string (plain English description of the plan),
    "entryFee": number (one-time fee to join),
    "minDeposit": number (minimum investment allowed),
    "maxDeposit": number (maximum investment allowed),
    "dailyEarningPercent": number (daily yield percentage),
    "maxEarningMultiplier": number (capping factor on investment, e.g. 2.0 or 3.0),
    "maxEarningLimit": number (minDeposit * maxEarningMultiplier),
    "durationDays": number (investment duration in days, e.g. 400),
    "capitalReturn": "included" | "end" | "none",
    "isBinaryMlmEnabled": true,
    "binaryPairingBonusPercent": number (percentage yield on paired volume, e.g. 10),
    "binaryDailyPairingCap": number (daily matching payout limit in USD),
    "binaryCarryForward": boolean (usually true),
    "binarySpilloverPlacement": "left" | "right" | "balanced" | "cycle_fill",
    "binaryCycleRatio": string (default "1:1"),
    "accountHolderPercent": number,
    "tradeProfitSharePercent": number,
    "rewardsOffersPercent": number,
    "platformFeePercent": number,
    "lowRiskMin": number,
    "lowRiskMax": number,
    "mediumRiskMin": number,
    "mediumRiskMax": number,
    "highRiskMin": number,
    "highRiskMax": number,
    "riskLevels": string (comma-separated list of active risk levels, e.g. "low,medium")
  }
}

CRITICAL RULES:
1. The distribution split percentages (accountHolderPercent + tradeProfitSharePercent + rewardsOffersPercent + platformFeePercent) MUST sum to exactly 100%.
2. Return ONLY a valid JSON object containing a "suggestions" key with the array of these three elements. Example:
{
  "suggestions": [ ... ]
}
Do not wrap in markdown \`\`\`json blocks and do not add any conversational text. Generate a highly customized result using the provided context.`

    let suggestions: any[] | null = null

    // Cascade 1: NVIDIA AI
    if (NVIDIA_API_KEY) {
      try {
        const res = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'nvidia/llama-3.1-nemotron-70b-instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 3000,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const content = data.choices?.[0]?.message?.content || ''
          const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(cleaned)
          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions
            console.log('AI suggestion generated via NVIDIA AI successfully.')
          }
        } else {
          console.error('NVIDIA AI suggest API call failed status:', res.status)
        }
      } catch (err) {
        console.error('NVIDIA AI suggest failed, trying fallback:', err)
      }
    }

    // Cascade 2: Groq AI
    if (!suggestions && GROQ_API_KEY) {
      try {
        const res = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 3000,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const content = data.choices?.[0]?.message?.content || ''
          const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(cleaned)
          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions
            console.log('AI suggestion generated via Groq fallback successfully.')
          }
        }
      } catch (err) {
        console.error('Groq AI suggest fallback failed:', err)
      }
    }

    // Cascade 3: Regex Fallback
    if (!suggestions) {
      console.log('Using regex-based Suggestion Generator fallback.')
      suggestions = generateRegexFallback(prompt)
    }

    return NextResponse.json({
      prompt,
      suggestions
    })
  } catch (error: any) {
    console.error('AI suggest error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 })
  }
}
