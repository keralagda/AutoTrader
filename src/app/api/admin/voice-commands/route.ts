import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function GET() {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    const commandsSetting = await db.setting.findUnique({
      where: { key: 'voice_navigation_commands' }
    })
    const settingsSetting = await db.setting.findUnique({
      where: { key: 'voice_navigation_settings' }
    })

    const commands = commandsSetting ? JSON.parse(commandsSetting.value) : []
    const settings = settingsSetting ? JSON.parse(settingsSetting.value) : {
      enabled: true,
      rate: 1.0,
      pitch: 1.0,
      triggerKey: "v"
    }

    return NextResponse.json({
      success: true,
      commands,
      settings
    })
  } catch (err) {
    console.error('Error fetching admin voice commands:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    const { commands, settings } = await req.json()

    if (commands !== undefined) {
      await db.setting.upsert({
        where: { key: 'voice_navigation_commands' },
        update: { value: JSON.stringify(commands) },
        create: { key: 'voice_navigation_commands', value: JSON.stringify(commands) }
      })
    }

    if (settings !== undefined) {
      await db.setting.upsert({
        where: { key: 'voice_navigation_settings' },
        update: { value: JSON.stringify(settings) },
        create: { key: 'voice_navigation_settings', value: JSON.stringify(settings) }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Voice settings updated successfully'
    })
  } catch (err) {
    console.error('Error updating admin voice commands:', err)
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
}
