import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_CONFIG = {
  enabled: false,
  botToken: '',
  botUsername: '',
  welcomeText: 'Welcome to AutoTrader Bot! Use the keyboard options below to check your stats or get help.',
  webhookUrl: '',
  keyboardButtons: ['📈 Balance', '🔗 Referral Link', '💸 Status'],
  faqRules: [
    { keyword: 'support', reply: 'Need support? Please open a support ticket under the dashboard Helpdesk tab, or contact @AutoTradeOwner.' },
    { keyword: 'yield', reply: 'AutoTrader offers daily returns ranging from 0.5% to 2% depending on the active trading configurations and risk levels of your chosen plan.' }
  ]
}

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function GET() {
  try {
    await checkDb()
    const setting = await db.setting.findUnique({ where: { key: 'telegram_bot_config' } })
    if (setting) {
      return NextResponse.json(JSON.parse(setting.value))
    }
    return NextResponse.json(DEFAULT_CONFIG)
  } catch {
    return NextResponse.json(DEFAULT_CONFIG)
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
    const data = await req.json()
    const { botToken, webhookUrl, enabled, action } = data

    // Handle Set Webhook action
    if (action === 'setWebhook') {
      if (!botToken || !webhookUrl) {
        return NextResponse.json({ error: 'Bot token and Webhook URL are required' }, { status: 400 })
      }

      // Call Telegram API setWebhook
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`)
      const tgData = await tgRes.json()

      if (!tgData.ok) {
        return NextResponse.json({ error: tgData.description || 'Telegram setWebhook failed' }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Webhook set successfully on Telegram', telegramResponse: tgData })
    }

    // Save configuration
    await db.setting.upsert({
      where: { key: 'telegram_bot_config' },
      update: { value: JSON.stringify(data) },
      create: { key: 'telegram_bot_config', value: JSON.stringify(data) }
    })

    return NextResponse.json({ success: true, message: 'Configuration saved successfully' })
  } catch (error) {
    console.error('Telegram config update error:', error)
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
  }
}
