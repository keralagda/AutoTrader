import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Database connectivity guard wrapper
async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function POST(req: NextRequest) {
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
    const { text } = await req.json()
    if (!text) {
      return NextResponse.json({ error: 'Broadcast message text is required' }, { status: 400 })
    }

    const botConfigSetting = await db.setting.findUnique({ where: { key: 'telegram_bot_config' } })
    if (!botConfigSetting) {
      return NextResponse.json({ error: 'Telegram bot config not found' }, { status: 404 })
    }

    const config = JSON.parse(botConfigSetting.value)
    if (!config.enabled || !config.botToken) {
      return NextResponse.json({ error: 'Telegram bot is not active or token is missing' }, { status: 400 })
    }

    const botToken = config.botToken

    // Fetch all users with linked Telegram chat IDs
    const users = await db.user.findMany({
      where: { telegramChatId: { not: null } },
      select: { telegramChatId: true }
    })

    const chatIds = users.map(u => u.telegramChatId).filter(Boolean) as string[]

    if (chatIds.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No users have linked Telegram accounts.' })
    }

    let successCount = 0
    let failCount = 0

    // Send messages asynchronously in parallel / batches
    const sendPromises = chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
          })
        })
        if (res.ok) successCount++
        else failCount++
      } catch (err) {
        failCount++
      }
    })

    await Promise.all(sendPromises)

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      failedCount: failCount,
      message: `Broadcast complete. Sent to ${successCount} users, failed for ${failCount} users.`
    })
  } catch (error) {
    console.error('Telegram broadcast error:', error)
    return NextResponse.json({ error: 'Failed to execute broadcast' }, { status: 500 })
  }
}
