import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get geo-blocking settings
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'geo_blocking' },
    })

    if (setting) {
      return NextResponse.json(JSON.parse(setting.value))
    }

    // Default: no blocking
    return NextResponse.json({
      enabled: false,
      blockedCountries: [],
      allowedCountries: [], // Empty means all allowed
      blockMessage: 'This service is not available in your region.',
    })
  } catch (error) {
    console.error('Geo-blocking GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update geo-blocking settings
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { enabled, blockedCountries, allowedCountries, blockMessage } = data

    const value = JSON.stringify({
      enabled: enabled || false,
      blockedCountries: blockedCountries || [],
      allowedCountries: allowedCountries || [],
      blockMessage: blockMessage || 'This service is not available in your region.',
    })

    await prisma.setting.upsert({
      where: { key: 'geo_blocking' },
      update: { value },
      create: { key: 'geo_blocking', value },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Geo-blocking PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
