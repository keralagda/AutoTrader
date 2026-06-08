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

    const { prompt } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert financial plan architect. Your job is to parse a natural language prompt from an administrator and construct a fully configured investment plan object.
    
Your output MUST be a single, valid JSON object containing exactly the fields matching our database schema. Do not include any explanations, markdown code blocks (e.g. do not wrap in \`\`\`json), or extra text outside the JSON object.

JSON Schema parameters:
1. name: string (e.g. "Silver Premium")
2. description: string (plain English description of benefits)
3. entryFee: number (USD registration fee to activate plan)
4. minDeposit: number (minimum allowed deposit amount)
5. maxDeposit: number (maximum allowed deposit amount)
6. dailyEarningPercent: number (base daily interest percentage generated)
7. maxEarningLimit: number (USD cap on total earnings)
8. returnType: string (must be one of: "hourly", "daily", "weekly", "monthly", "after_end")
9. returnPeriodHours: number (how often profit credits, e.g. 24 for daily, 1 for hourly)
10. totalReturnPercent: number (total return %, set to 0 if variable daily yield)
11. durationDays: number (plan duration in days, 0 = unlimited)
12. capitalReturn: string (must be one of: "included", "end", "none")
13. repeatCount: number (number of payouts, 0 = unlimited)
14. stackingEnabled: boolean (allow multiple simultaneous deposits)
15. maxStacks: number (max simultaneous deposits, 1-10)
16. stackingBonusPercent: number (% rate bonus per additional stack)
17. lockPeriodDays: number (days principal is locked)
18. autoCompound: boolean (automatically reinvest payouts)
19. earlyExitPenalty: number (% penalty on early exit)
20. accountHolderPercent: number (Investor share % of base yield, e.g. 75.0)
21. tradeProfitSharePercent: number (Community/Sponsor share % of base yield, e.g. 20.0)
22. platformFeePercent: number (Platform share % of base yield, e.g. 5.0)
23. charityDonationPercent: number (Charity share % of base yield, e.g. 0.0)
24. insuranceReservePercent: number (Insurance share % of base yield, e.g. 0.0)
25. developerFundPercent: number (Developer share % of base yield, e.g. 0.0)
26. liquidityPoolPercent: number (Liquidity share % of base yield, e.g. 0.0)
27. subscriptionReferralPercent: number (Registration fee split to Community %, e.g. 80.0)
28. subscriptionRewardsPercent: number (Registration fee split to Rewards %, e.g. 15.0)
29. subscriptionPlatformPercent: number (Registration fee split to Platform %, e.g. 5.0)
30. registrationReferralLevels: number (number of levels to distribute reg fee, 1-10)
31. depositMultipleOf: number (increment step validator, e.g. 100.0)
32. strictMultiples: boolean (enforce deposit step validator)
33. dailyEarningCapPercent: number (daily capping on earnings as a % of active investment, e.g. 200.0, or 0.0 for no cap)
34. cappingAppliesTo: string (must be one of: "all", "profits_only", "referrals_only")
35. minLossPercent: number (min negative % on loss days)
36. maxLossPercent: number (max negative % on loss days)
37. allowNegativeBalance: boolean (allow wallet balance to drop below $0)
38. maxConsecutiveLossDays: number (max limit of loss days in a row)
39. profitDays: string (comma-separated days profits accrue, e.g. "mon,tue,wed,thu,fri")
40. profitHours: string or null (comma-separated payout hours, e.g. "9,15,21" or null)
41. holidayPauses: string or null (comma-separated holiday dates, e.g. "2026-12-25,2026-01-01" or null)
42. gracePeriodDays: number (warmup days before first profit)
43. autoReinvest: boolean (reinvest back into plan on end)
44. reinvestBonus: number (% bonus rate on reinvest)
45. customReferralPct: number or null (custom referral % override, or null)
46. volatilityMode: string (must be one of: "stable", "moderate", "volatile")
47. lossDayChance: number (% daily chance of loss day)
48. bonusDayChance: number (% daily chance of bonus day)
49. minVipTier: string (must be one of: "Bronze", "Silver", "Gold", "Platinum")
50. spotsLimit: number (spots limit, 0 = unlimited)
51. planBadge: string or null (must be one of: "popular", "new", "limited", "vip" or null)
52. teamRequirement: number (min team size to invest)

Rules:
- The sum of accountHolderPercent + tradeProfitSharePercent + platformFeePercent + charityDonationPercent + insuranceReservePercent + developerFundPercent + liquidityPoolPercent MUST be EXACTLY equal to 100.0. Skew or scale the numbers accordingly if the user asks for specific amounts.
- The sum of subscriptionReferralPercent + subscriptionRewardsPercent + subscriptionPlatformPercent MUST be EXACTLY equal to 100.0.
- Ensure all datatypes are strictly respected (boolean for true/false flags, numbers for rates, etc.).
- Output ONLY the raw JSON string.`

    const reply = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.2, maxTokens: 1024 })

    const cleaned = reply.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Check sum of distribution splits
    const splitsTotal = (parsed.accountHolderPercent || 0) +
                        (parsed.tradeProfitSharePercent || 0) +
                        (parsed.platformFeePercent || 0) +
                        (parsed.charityDonationPercent || 0) +
                        (parsed.insuranceReservePercent || 0) +
                        (parsed.developerFundPercent || 0) +
                        (parsed.liquidityPoolPercent || 0)

    if (Math.abs(splitsTotal - 100) > 0.01 && splitsTotal > 0) {
      // Normalize to 100% dynamically if minor rounding issue occurs
      const factor = 100 / splitsTotal
      parsed.accountHolderPercent = Number((parsed.accountHolderPercent * factor).toFixed(2))
      parsed.tradeProfitSharePercent = Number((parsed.tradeProfitSharePercent * factor).toFixed(2))
      parsed.platformFeePercent = Number((parsed.platformFeePercent * factor).toFixed(2))
      parsed.charityDonationPercent = Number((parsed.charityDonationPercent * factor).toFixed(2))
      parsed.insuranceReservePercent = Number((parsed.insuranceReservePercent * factor).toFixed(2))
      parsed.developerFundPercent = Number((parsed.developerFundPercent * factor).toFixed(2))
      parsed.liquidityPoolPercent = Number((parsed.liquidityPoolPercent * factor).toFixed(2))
      // Handle remaining tiny rounding diff on the largest share
      const newTotal = parsed.accountHolderPercent + parsed.tradeProfitSharePercent + parsed.platformFeePercent + parsed.charityDonationPercent + parsed.insuranceReservePercent + parsed.developerFundPercent + parsed.liquidityPoolPercent
      const diff = 100 - newTotal
      if (Math.abs(diff) > 0) {
        parsed.accountHolderPercent = Number((parsed.accountHolderPercent + diff).toFixed(2))
      }
    } else if (splitsTotal === 0) {
      // Set sensible defaults if AI returned zero splits
      parsed.accountHolderPercent = 75.0
      parsed.tradeProfitSharePercent = 20.0
      parsed.platformFeePercent = 5.0
      parsed.charityDonationPercent = 0.0
      parsed.insuranceReservePercent = 0.0
      parsed.developerFundPercent = 0.0
      parsed.liquidityPoolPercent = 0.0
    }

    // Check sum of subscription splits
    const subSplitsTotal = (parsed.subscriptionReferralPercent || 0) +
                           (parsed.subscriptionRewardsPercent || 0) +
                           (parsed.subscriptionPlatformPercent || 0)

    if (Math.abs(subSplitsTotal - 100) > 0.01 && subSplitsTotal > 0) {
      const factor = 100 / subSplitsTotal
      parsed.subscriptionReferralPercent = Number((parsed.subscriptionReferralPercent * factor).toFixed(2))
      parsed.subscriptionRewardsPercent = Number((parsed.subscriptionRewardsPercent * factor).toFixed(2))
      parsed.subscriptionPlatformPercent = Number((parsed.subscriptionPlatformPercent * factor).toFixed(2))
      const newSubTotal = parsed.subscriptionReferralPercent + parsed.subscriptionRewardsPercent + parsed.subscriptionPlatformPercent
      const diff = 100 - newSubTotal
      if (Math.abs(diff) > 0) {
        parsed.subscriptionReferralPercent = Number((parsed.subscriptionReferralPercent + diff).toFixed(2))
      }
    } else if (subSplitsTotal === 0) {
      parsed.subscriptionReferralPercent = 80.0
      parsed.subscriptionRewardsPercent = 15.0
      parsed.subscriptionPlatformPercent = 5.0
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI Plan Generator error:', error)
    return NextResponse.json({ error: 'Failed to generate plan with AI' }, { status: 500 })
  }
}
