import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get current WLN pattern configuration
export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'wln_pattern_rules' } })

    if (!setting) {
      // Return default config
      return NextResponse.json({
        mode: 'streak', // 'streak' | 'weighted' | 'custom'
        // Streak mode settings (uses trading_config streaks)
        winWeight: 50,
        lossWeight: 25,
        neutralWeight: 25,
        // Custom sequences
        sequences: [],
      })
    }

    return NextResponse.json(JSON.parse(setting.value))
  } catch (error) {
    console.error('Get WLN pattern error:', error)
    return NextResponse.json({ error: 'Failed to get pattern config' }, { status: 500 })
  }
}

// PUT - Update WLN pattern configuration
export async function PUT(request: Request) {
  try {
    const config = await request.json()

    // Validate
    if (!['streak', 'weighted', 'custom'].includes(config.mode)) {
      return NextResponse.json({ error: 'Mode must be streak, weighted, or custom' }, { status: 400 })
    }

    if (config.mode === 'custom' && (!config.sequences || config.sequences.length === 0)) {
      return NextResponse.json({ error: 'Custom mode requires at least one sequence' }, { status: 400 })
    }

    await db.setting.upsert({
      where: { key: 'wln_pattern_rules' },
      create: { key: 'wln_pattern_rules', value: JSON.stringify(config) },
      update: { value: JSON.stringify(config) },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Update WLN pattern error:', error)
    return NextResponse.json({ error: 'Failed to update pattern config' }, { status: 500 })
  }
}

// DELETE - Reset all user patterns (force regeneration)
export async function DELETE() {
  try {
    // Delete all stored user patterns
    const patterns = await db.setting.findMany({
      where: { key: { startsWith: 'wln_pattern_' } },
    })

    for (const p of patterns) {
      await db.setting.delete({ where: { id: p.id } })
    }

    return NextResponse.json({ success: true, cleared: patterns.length })
  } catch (error) {
    console.error('Reset WLN patterns error:', error)
    return NextResponse.json({ error: 'Failed to reset patterns' }, { status: 500 })
  }
}
