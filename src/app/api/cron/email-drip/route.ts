import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

// Email drip sequence - called by cron every 24 hours
// Sends targeted emails based on user milestones

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET || ''
    const secret = request.headers.get('x-cron-secret')
    if (secret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    let sent = 0

    // Get all active users
    const users = await db.user.findMany({
      where: { isActive: true, role: 'user', isFake: false },
      select: { id: true, name: true, email: true, totalDeposited: true, totalEarnings: true, createdAt: true },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bnfx.eu.cc'

    for (const user of users) {
      const daysSinceJoin = Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / 86400000)

      // Check if we already sent this drip
      const dripKey = `drip_${user.id}_day${daysSinceJoin}`
      const alreadySent = await db.setting.findUnique({ where: { key: dripKey } })
      if (alreadySent) continue

      let subject = ''
      let html = ''

      // Day 1: How to deposit
      if (daysSinceJoin === 1 && user.totalDeposited === 0) {
        subject = 'Ready to start earning? Here\'s how 💰'
        html = `<h2>Hi ${user.name}!</h2><p>Welcome to BNFX! Making your first deposit is easy:</p><ol><li>Go to your Dashboard → Deposit</li><li>Choose a payment method (MetaMask, CoinPayments, etc.)</li><li>Enter amount and upload proof</li><li>Admin verifies within 24h</li></ol><p>Once confirmed, your money starts earning automatically!</p><a href="${appUrl}/dashboard" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Make First Deposit →</a>`
      }
      // Day 3: First profit notification
      else if (daysSinceJoin === 3 && user.totalEarnings > 0) {
        subject = `You've earned $${user.totalEarnings.toFixed(2)} so far! 🎉`
        html = `<h2>Great news, ${user.name}!</h2><p>Your investments are working. You've earned <strong>$${user.totalEarnings.toFixed(2)}</strong> in just 3 days.</p><p>Want to earn more? Consider upgrading to a higher plan or increasing your investment.</p><a href="${appUrl}/dashboard" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">View Earnings →</a>`
      }
      // Day 7: Upgrade plan
      else if (daysSinceJoin === 7 && user.totalDeposited > 0 && user.totalDeposited < 1000) {
        subject = 'Unlock higher returns with an upgrade 📈'
        html = `<h2>Hi ${user.name}!</h2><p>You've been with us for a week now. Users who upgrade to Gold or Platinum plans earn up to 15% daily.</p><p>Your current earnings: <strong>$${user.totalEarnings.toFixed(2)}</strong></p><p>Imagine earning 3x more with a higher-tier plan!</p><a href="${appUrl}/dashboard" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Explore Plans →</a>`
      }
      // Day 14: Referral reminder
      else if (daysSinceJoin === 14) {
        subject = 'Earn passive income by referring friends 👥'
        html = `<h2>Hi ${user.name}!</h2><p>Did you know you can earn 5% commission on every deposit your referrals make?</p><p>With our 7-level referral system, your earnings compound as your team grows.</p><p>Share your referral link and start building passive income today!</p><a href="${appUrl}/dashboard" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Get Referral Link →</a>`
      }
      // Day 30: Monthly summary
      else if (daysSinceJoin === 30) {
        subject = `Your 30-day summary: $${user.totalEarnings.toFixed(2)} earned! 📊`
        html = `<h2>Monthly Report for ${user.name}</h2><p>Here's your first month on BNFX:</p><ul><li>Total Deposited: <strong>$${user.totalDeposited.toFixed(2)}</strong></li><li>Total Earned: <strong>$${user.totalEarnings.toFixed(2)}</strong></li><li>Days Active: 30</li></ul><p>Keep it up! Your earnings grow every day.</p><a href="${appUrl}/dashboard" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">View Dashboard →</a>`
      }
      else {
        continue
      }

      // Send email
      const success = await sendEmail({ to: user.email, subject, html })
      if (success) {
        // Mark as sent
        await db.setting.create({ data: { key: dripKey, value: now.toISOString() } })
        sent++
      }
    }

    return NextResponse.json({ success: true, sent, checked: users.length })
  } catch (error) {
    console.error('Email drip error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
