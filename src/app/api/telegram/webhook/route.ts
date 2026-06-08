import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to send message via Telegram Bot API
async function sendTelegramMessage(token: string, chatId: number | string, text: string, replyMarkup?: any) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    })
    return res.ok
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const update = body

    if (!update.message || !update.message.chat || !update.message.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = update.message.chat.id
    const incomingText = update.message.text.trim()
    const username = update.message.from?.username || ''

    // Fetch bot config
    const botConfigSetting = await db.setting.findUnique({ where: { key: 'telegram_bot_config' } })
    if (!botConfigSetting) {
      return NextResponse.json({ ok: true })
    }

    const config = JSON.parse(botConfigSetting.value)
    if (!config.enabled || !config.botToken) {
      return NextResponse.json({ ok: true })
    }

    const botToken = config.botToken
    const welcomeText = config.welcomeText || 'Welcome to AutoTrader Bot!'
    const faqRules = config.faqRules || [] // array of { keyword: string, reply: string }
    const customButtons = config.keyboardButtons || ['📈 Balance', '🔗 Referral Link', '💸 Status']

    // Default keyboard markup
    const replyMarkup = {
      keyboard: [
        customButtons.slice(0, 2).map((btn: string) => ({ text: btn })),
        customButtons.slice(2).map((btn: string) => ({ text: btn }))
      ],
      resize_keyboard: true
    }

    // 1. Handle Link Command
    const linkMatch = incomingText.match(/^\/link\s+([a-zA-Z0-9_-]+)$/) || incomingText.match(/^\/start\s+link_([a-zA-Z0-9_-]+)$/)
    if (linkMatch) {
      const verificationCode = linkMatch[1]
      const user = await db.user.findFirst({
        where: { telegramVerificationCode: verificationCode }
      })

      if (!user) {
        await sendTelegramMessage(botToken, chatId, '❌ Invalid verification code. Please request a new code from your dashboard settings.', replyMarkup)
        return NextResponse.json({ ok: true })
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: String(chatId),
          telegramVerificationCode: null // consume code
        }
      })

      await sendTelegramMessage(
        botToken,
        chatId,
        `🎉 <b>Account Linked Successfully!</b>\n\nHello <b>${user.name}</b>, your Telegram bot is now successfully paired with your AutoTrader account (${user.email}). You will now receive instant transaction and earning alerts here.`,
        replyMarkup
      )
      return NextResponse.json({ ok: true })
    }

    // Check if user is linked
    const linkedUser = await db.user.findUnique({
      where: { telegramChatId: String(chatId) },
      include: { deposits: { where: { status: 'confirmed' } } }
    })

    // 2. Handle /start without linking code
    if (incomingText.startsWith('/start')) {
      if (linkedUser) {
        await sendTelegramMessage(botToken, chatId, `Welcome back, <b>${linkedUser.name}</b>!\n\n${welcomeText}`, replyMarkup)
      } else {
        await sendTelegramMessage(
          botToken,
          chatId,
          `Welcome to AutoTrader Telegram Companion!\n\nTo link your platform account, please log in to your dashboard, go to <b>Profile Settings -> Link Telegram</b>, and type:\n<code>/link YOUR_VERIFICATION_CODE</code>`,
          { remove_keyboard: true }
        )
      }
      return NextResponse.json({ ok: true })
    }

    // All other commands require account linking
    if (!linkedUser) {
      await sendTelegramMessage(
        botToken,
        chatId,
        '⚠️ Your Telegram account is not linked. Please pair your account by entering your verification code:\n<code>/link YOUR_VERIFICATION_CODE</code>'
      )
      return NextResponse.json({ ok: true })
    }

    const command = incomingText.toLowerCase()

    // 3. Handle Balance & Status Check
    if (command.includes('balance') || command === '/balance' || command === '/status') {
      const activeDepositsSum = linkedUser.deposits.reduce((sum, d) => sum + d.amount, 0)
      const statusText = `📊 <b>Account Status for ${linkedUser.name}</b>\n\n` +
        `• <b>Trading Balance:</b> $${linkedUser.tradingBalance.toFixed(2)} USDC\n` +
        `• <b>Withdrawal Balance:</b> $${linkedUser.withdrawalBalance.toFixed(2)} USDC\n` +
        `• <b>Active Investment:</b> $${activeDepositsSum.toFixed(2)} USDC\n` +
        `• <b>Total Lifetime Earnings:</b> $${linkedUser.totalEarnings.toFixed(2)} USDC`

      await sendTelegramMessage(botToken, chatId, statusText, replyMarkup)
      return NextResponse.json({ ok: true })
    }

    // 4. Handle Referral Link
    if (command.includes('referral') || command === '/ref' || command.includes('link')) {
      const referralLink = `${process.env.NEXTAUTH_URL || 'https://autotrade.net'}/register?ref=${linkedUser.referralCode}`
      const refText = `🔗 <b>Your Affiliate Referral Link</b>\n\nInvite users to join AutoTrader and earn commissions level-by-level!\n\n<code>${referralLink}</code>`
      await sendTelegramMessage(botToken, chatId, refText, replyMarkup)
      return NextResponse.json({ ok: true })
    }

    // 5. Check FAQ / Auto-Reply rules
    for (const rule of faqRules) {
      if (rule.keyword && command.includes(rule.keyword.toLowerCase())) {
        await sendTelegramMessage(botToken, chatId, rule.reply, replyMarkup)
        return NextResponse.json({ ok: true })
      }
    }

    // Default Fallback
    const helpText = `👋 Hello ${linkedUser.name}, how can I assist you today?\n\n` +
      `<b>Available Buttons:</b>\n` +
      `• 📈 Balance: Display account balances\n` +
      `• 🔗 Referral Link: Show your personal sponsor link\n\n` +
      `Or ask a question, and our automated FAQ assistant will reply!`

    await sendTelegramMessage(botToken, chatId, helpText, replyMarkup)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always reply 200 to Telegram to avoid retries
  }
}
