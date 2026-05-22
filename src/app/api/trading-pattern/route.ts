import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generates a randomized WLN pattern sequence based on admin config
// Called by the frontend to get the next batch of signal outcomes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Math.min(parseInt(searchParams.get('count') || '20'), 100)
    const depositId = searchParams.get('depositId')

    // Load trading config from DB
    const configSetting = await db.setting.findUnique({ where: { key: 'trading_config' } })
    const config = configSetting ? JSON.parse(configSetting.value) : {
      winStreakMin: 3, winStreakMax: 5,
      lossStreakMin: 2, lossStreakMax: 3,
      neutralStreakMin: 3, neutralStreakMax: 4,
    }

    // Load custom pattern rules if any
    const patternSetting = await db.setting.findUnique({ where: { key: 'wln_pattern_rules' } })
    const patternRules = patternSetting ? JSON.parse(patternSetting.value) : null

    let sequence: string[] = []

    if (patternRules && patternRules.mode === 'custom' && patternRules.sequences?.length > 0) {
      // Use admin-defined custom sequences, pick one randomly and repeat
      const picked = patternRules.sequences[Math.floor(Math.random() * patternRules.sequences.length)]
      // Repeat the picked sequence until we have enough
      while (sequence.length < count) {
        sequence.push(...picked.split(''))
      }
      sequence = sequence.slice(0, count)
    } else if (patternRules && patternRules.mode === 'weighted') {
      // Weighted random: each signal is independently random with configured weights
      const wWeight = patternRules.winWeight || 50
      const lWeight = patternRules.lossWeight || 25
      const nWeight = patternRules.neutralWeight || 25
      const total = wWeight + lWeight + nWeight

      for (let i = 0; i < count; i++) {
        const roll = Math.random() * total
        if (roll < wWeight) sequence.push('W')
        else if (roll < wWeight + lWeight) sequence.push('L')
        else sequence.push('N')
      }
    } else {
      // Default: streak-based randomized pattern (no fixed order)
      const phases = ['W', 'L', 'N']
      let currentPhase = phases[Math.floor(Math.random() * phases.length)]

      while (sequence.length < count) {
        // Determine streak length for current phase
        let streakLen: number
        if (currentPhase === 'W') streakLen = randomBetween(config.winStreakMin, config.winStreakMax)
        else if (currentPhase === 'L') streakLen = randomBetween(config.lossStreakMin, config.lossStreakMax)
        else streakLen = randomBetween(config.neutralStreakMin, config.neutralStreakMax)

        // Add streak to sequence
        for (let i = 0; i < streakLen && sequence.length < count; i++) {
          sequence.push(currentPhase)
        }

        // Pick next phase (different from current)
        const others = phases.filter(p => p !== currentPhase)
        currentPhase = others[Math.floor(Math.random() * others.length)]
      }
    }

    // Save the generated pattern for this deposit (so it persists across page loads)
    if (depositId) {
      const patternKey = `wln_pattern_${depositId}`
      const existingSetting = await db.setting.findUnique({ where: { key: patternKey } })
      const existingPattern: string[] = existingSetting ? JSON.parse(existingSetting.value) : []

      // Append new sequence to existing consumed pattern
      const fullPattern = [...existingPattern, ...sequence]

      await db.setting.upsert({
        where: { key: patternKey },
        create: { key: patternKey, value: JSON.stringify(fullPattern.slice(-200)) },
        update: { value: JSON.stringify(fullPattern.slice(-200)) },
      })
    }

    return NextResponse.json({ pattern: sequence, count: sequence.length })
  } catch (error) {
    console.error('Get trading pattern error:', error)
    return NextResponse.json({ error: 'Failed to generate pattern' }, { status: 500 })
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
