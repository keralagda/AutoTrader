import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

// Email Integration: Resend (primary) + SMTP rotation (fallback)
// Supports multiple SMTP servers with round-robin rotation

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = process.env.EMAIL_FROM || 'BNFX <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bnfx.eu.cc'

// Gmail SMTP configuration
const GMAIL_USER = process.env.GMAIL_USER || ''
const GMAIL_PASS = process.env.GMAIL_PASS || ''

// Proton SMTP configuration (ProtonMail Bridge local SMTP)
const PROTON_USER = process.env.PROTON_USER || ''
const PROTON_PASS = process.env.PROTON_PASS || ''
const PROTON_HOST = process.env.PROTON_HOST || '127.0.0.1'
const PROTON_PORT = parseInt(process.env.PROTON_PORT || '1025')
const PROTON_SECURE = process.env.PROTON_SECURE === 'true'

// SMTP Configuration (comma-separated for rotation)
const SMTP_SERVERS_RAW = process.env.SMTP_SERVERS || ''

interface SMTPConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

function parseSMTPServers(raw: string = ''): SMTPConfig[] {
  const source = raw || ''
  if (!source) return []
  return source.split(',').map(s => s.trim()).filter(Boolean).map(server => {
    const parts = server.split(':')
    if (parts.length < 4) return null
    return {
      host: parts[0],
      port: parseInt(parts[1]) || 587,
      user: parts[2],
      pass: parts.slice(3, -1).join(':'), // Password might contain colons
      from: parts[parts.length - 1] || FROM_EMAIL,
    }
  }).filter(Boolean) as SMTPConfig[]
}

// Round-robin counter for SMTP rotation
let smtpRotationIndex = 0

function getNextSMTP(raw: string = ''): SMTPConfig | null {
  const servers = parseSMTPServers(raw)
  if (servers.length === 0) return null
  const server = servers[smtpRotationIndex % servers.length]
  smtpRotationIndex++
  return server
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Strategy: Try Gmail first, then Proton, then Resend, then SMTP rotation
  
  // Load dynamic SMTP settings from DB if available, fallback to env variables
  let dynamicGmailUser = ''
  let dynamicGmailPass = ''
  let dynamicProtonUser = ''
  let dynamicProtonPass = ''
  let dynamicProtonHost = ''
  let dynamicProtonPort = 1025
  let dynamicProtonSecure = false
  let dynamicSmtpServers = ''
  let dynamicResendApiKey = ''
  let dynamicEmailFrom = ''

  try {
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: [
            'smtp_gmail_user',
            'smtp_gmail_pass',
            'smtp_proton_user',
            'smtp_proton_pass',
            'smtp_proton_host',
            'smtp_proton_port',
            'smtp_proton_secure',
            'smtp_servers',
            'resend_api_key',
            'email_from',
          ]
        }
      }
    })
    const map: Record<string, string> = {}
    settings.forEach(s => { map[s.key] = s.value })

    dynamicGmailUser = map['smtp_gmail_user'] || ''
    dynamicGmailPass = map['smtp_gmail_pass'] || ''
    dynamicProtonUser = map['smtp_proton_user'] || ''
    dynamicProtonPass = map['smtp_proton_pass'] || ''
    dynamicProtonHost = map['smtp_proton_host'] || ''
    dynamicProtonPort = map['smtp_proton_port'] ? parseInt(map['smtp_proton_port']) : 1025
    dynamicProtonSecure = map['smtp_proton_secure'] === 'true'
    dynamicSmtpServers = map['smtp_servers'] || ''
    dynamicResendApiKey = map['resend_api_key'] || ''
    dynamicEmailFrom = map['email_from'] || ''
  } catch (dbError) {
    console.error('Failed to read dynamic SMTP settings:', dbError)
  }

  const activeGmailUser = dynamicGmailUser || GMAIL_USER
  const activeGmailPass = dynamicGmailPass || GMAIL_PASS
  const activeProtonUser = dynamicProtonUser || PROTON_USER
  const activeProtonPass = dynamicProtonPass || PROTON_PASS
  const activeProtonHost = dynamicProtonHost || PROTON_HOST
  const activeProtonPort = dynamicProtonPort !== 1025 ? dynamicProtonPort : PROTON_PORT
  const activeProtonSecure = dynamicProtonSecure !== false ? dynamicProtonSecure : PROTON_SECURE
  const activeResendApiKey = dynamicResendApiKey || RESEND_API_KEY
  const activeEmailFrom = dynamicEmailFrom || FROM_EMAIL
  const activeSmtpServers = dynamicSmtpServers || SMTP_SERVERS_RAW

  // 1. Try Gmail
  if (activeGmailUser && activeGmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: activeGmailUser,
          pass: activeGmailPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      
      const finalFrom = FROM_EMAIL.includes('<') && FROM_EMAIL.includes(activeGmailUser)
        ? FROM_EMAIL 
        : `BNFX <${activeGmailUser}>`
      
      await transporter.sendMail({
        from: finalFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
      })
      console.log('Email sent successfully via Gmail SMTP')
      return true
    } catch (error) {
      console.warn('Gmail SMTP sending failed, trying next provider...', error)
    }
  }

  // 2. Try Proton (ProtonMail Bridge)
  if (activeProtonUser && activeProtonPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: activeProtonHost,
        port: activeProtonPort,
        secure: activeProtonSecure,
        auth: {
          user: activeProtonUser,
          pass: activeProtonPass,
        },
        tls: {
          rejectUnauthorized: false // Proton Bridge typically uses self-signed certificates
        }
      })
      
      await transporter.sendMail({
        from: activeEmailFrom.includes('<') ? activeEmailFrom : `BNFX <${activeProtonUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
      })
      console.log('Email sent successfully via Proton')
      return true
    } catch (error) {
      console.warn('Proton sending failed, trying next provider...', error)
    }
  }

  // 3. Try Resend (primary)
  if (activeResendApiKey) {
    try {
      let finalResendFrom = activeEmailFrom
      const emailMatch = activeEmailFrom.match(/<([^>]+)>/)
      const senderEmail = emailMatch ? emailMatch[1] : activeEmailFrom
      const domain = senderEmail.split('@')[1] || ''
      const isUnverifiedDomain = 
        domain.toLowerCase().includes('gmail.com') ||
        domain.toLowerCase().includes('yahoo.com') ||
        domain.toLowerCase().includes('hotmail.com') ||
        domain.toLowerCase().includes('outlook.com') ||
        domain.toLowerCase().includes('aol.com')
      
      if (isUnverifiedDomain) {
        finalResendFrom = 'BNFX <onboarding@resend.dev>'
      }

      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeResendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: finalResendFrom,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      })

      if (res.ok) {
        console.log('Email sent successfully via Resend')
        return true
      }
      const errText = await res.text()
      console.warn('Resend failed, error response:', errText, 'trying SMTP fallback...')
    } catch (error) {
      console.warn('Resend error, trying SMTP fallback...', error)
    }
  }

  // 4. Try SMTP rotation (fallback)
  const parsedRotationServers = parseSMTPServers(activeSmtpServers)
  for (let i = 0; i < parsedRotationServers.length; i++) {
    const smtp = getNextSMTP(activeSmtpServers)
    if (!smtp) break
    
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      
      await transporter.sendMail({
        from: smtp.from || activeEmailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
      })
      console.log(`Email sent via SMTP: ${smtp.host}`)
      return true
    } catch (error) {
      console.warn(`SMTP ${smtp.host} failed, trying next...`, error)
    }
  }

  console.error('All email providers failed for:', options.to, options.subject)
  return false
}

// ─── Base Template ─────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="${APP_URL}/bnfx-logo-dark.png" alt="BNFX" style="height:40px;width:auto;" />
    </div>
    <div style="background:#1a1a1a;border-radius:12px;padding:30px;border:1px solid #333;">
      ${content}
    </div>
    <div style="text-align:center;margin-top:30px;color:#666;font-size:12px;">
      <p>&copy; ${new Date().getFullYear()} Black Nova FX. All rights reserved.</p>
      <p>This is an automated message from BNFX. Do not reply directly.</p>
      <p><a href="${APP_URL}" style="color:#10b981;text-decoration:none;">Visit Platform</a></p>
    </div>
  </div>
</body>
</html>`

// ─── Email Functions ───────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Welcome to BNFX! 🎉',
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Welcome, ${name}!</h2>
      <p style="color:#ccc;line-height:1.6;">Your BNFX account has been created successfully. You're now ready to start your investment journey.</p>
      <p style="color:#ccc;line-height:1.6;">Here's how to get started:</p>
      <ol style="color:#ccc;line-height:2;">
        <li>Deposit funds to your Trading Wallet</li>
        <li>Activate an investment plan</li>
        <li>Set up your investment amount</li>
        <li>Earn daily returns automatically</li>
      </ol>
      <div style="text-align:center;margin-top:25px;">
        <a href="${APP_URL}/dashboard" style="background:#10b981;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
      </div>
    `),
  })
}

export async function sendDepositConfirmation(to: string, name: string, amount: number) {
  return sendEmail({
    to,
    subject: `Deposit Confirmed - $${amount.toFixed(2)} ✅`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Deposit Confirmed</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">Your deposit has been confirmed and added to your Trading Wallet.</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#10b981;font-size:32px;font-weight:700;margin:0;">$${amount.toFixed(2)}</p>
        <p style="color:#666;font-size:12px;margin:5px 0 0;">Added to Trading Wallet</p>
      </div>
      <p style="color:#ccc;">You can now invest this amount in any activated plan.</p>
      <div style="text-align:center;margin-top:20px;">
        <a href="${APP_URL}/dashboard" style="background:#10b981;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:14px;">Invest Now</a>
      </div>
    `),
  })
}

export async function sendWithdrawalUpdate(to: string, name: string, amount: number, status: string, txHash?: string) {
  const statusColors: Record<string, string> = { approved: '#10b981', completed: '#10b981', rejected: '#ef4444', pending: '#f59e0b' }
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  return sendEmail({
    to,
    subject: `Withdrawal ${statusLabel} - $${amount.toFixed(2)}`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Withdrawal ${statusLabel}</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">Your withdrawal request has been updated:</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;padding:8px 0;">Amount:</td><td style="color:#fff;font-weight:700;text-align:right;">$${amount.toFixed(2)}</td></tr>
          <tr><td style="color:#999;padding:8px 0;">Status:</td><td style="color:${statusColors[status] || '#fff'};font-weight:700;text-align:right;text-transform:uppercase;">${status}</td></tr>
          ${txHash ? `<tr><td style="color:#999;padding:8px 0;border-top:1px solid #333;">TX Hash:</td><td style="color:#666;text-align:right;font-size:11px;border-top:1px solid #333;word-break:break-all;">${txHash}</td></tr>` : ''}
        </table>
      </div>
      ${status === 'rejected' ? '<p style="color:#ef4444;font-size:13px;">If you believe this is an error, please contact support.</p>' : ''}
    `),
  })
}

export async function sendPasswordResetCode(to: string, name: string, code: string) {
  return sendEmail({
    to,
    subject: 'Password Reset Code - BNFX',
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Password Reset</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">You requested a password reset. Use this code:</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#10b981;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;">${code}</p>
        <p style="color:#666;font-size:12px;margin:10px 0 0;">Expires in 15 minutes</p>
      </div>
      <p style="color:#666;font-size:12px;">If you didn't request this, ignore this email. Your password remains unchanged.</p>
    `),
  })
}

export async function sendProfitNotification(to: string, name: string, amount: number, planName: string) {
  return sendEmail({
    to,
    subject: `Daily Profit Credited - $${amount.toFixed(2)} 💰`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Profit Credited! 💰</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">Your daily profit has been credited to your Trading Wallet.</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#10b981;font-size:28px;font-weight:700;margin:0;">+$${amount.toFixed(2)}</p>
        <p style="color:#666;font-size:12px;margin:5px 0 0;">From: ${planName} Plan</p>
      </div>
    `),
  })
}

export async function sendReferralBonus(to: string, name: string, amount: number, referralName: string, level: number) {
  return sendEmail({
    to,
    subject: `Referral Bonus Earned - $${amount.toFixed(2)} 🎁`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Referral Bonus! 🎁</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">You earned a referral commission from your network:</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#10b981;font-size:28px;font-weight:700;margin:0;">+$${amount.toFixed(2)}</p>
        <p style="color:#666;font-size:12px;margin:5px 0 0;">From: ${referralName} (Level ${level})</p>
      </div>
      <p style="color:#ccc;font-size:13px;">Keep growing your network to earn more!</p>
    `),
  })
}

export async function sendInvestmentApproved(to: string, name: string, amount: number, planName: string) {
  return sendEmail({
    to,
    subject: `Investment Approved - $${amount.toFixed(2)} in ${planName} ✅`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Investment Approved! ✅</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">Your investment has been approved and is now active.</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#10b981;font-size:28px;font-weight:700;margin:0;">$${amount.toFixed(2)}</p>
        <p style="color:#666;font-size:12px;margin:5px 0 0;">${planName} Plan • Now Earning</p>
      </div>
      <p style="color:#ccc;font-size:13px;">Daily returns will be automatically credited to your Trading Wallet.</p>
    `),
  })
}

export async function sendLoginAlert(to: string, name: string, ip: string, device: string, location: string) {
  return sendEmail({
    to,
    subject: '🔐 New Login Detected - BNFX',
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">New Login Detected</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">A new login was detected on your BNFX account:</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;padding:8px 0;">IP Address:</td><td style="color:#fff;text-align:right;">${ip}</td></tr>
          <tr><td style="color:#999;padding:8px 0;">Device:</td><td style="color:#fff;text-align:right;">${device}</td></tr>
          <tr><td style="color:#999;padding:8px 0;">Location:</td><td style="color:#fff;text-align:right;">${location || 'Unknown'}</td></tr>
          <tr><td style="color:#999;padding:8px 0;">Time:</td><td style="color:#fff;text-align:right;">${new Date().toUTCString()}</td></tr>
        </table>
      </div>
      <p style="color:#f59e0b;font-size:13px;">⚠️ If this wasn't you, change your password immediately and enable 2FA.</p>
    `),
  })
}

export async function sendKYCUpdate(to: string, name: string, status: 'approved' | 'rejected', reason?: string) {
  const isApproved = status === 'approved'
  return sendEmail({
    to,
    subject: `KYC ${isApproved ? 'Approved' : 'Requires Attention'} - BNFX`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">KYC Verification ${isApproved ? 'Approved ✅' : 'Update'}</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      ${isApproved
        ? '<p style="color:#ccc;">Your identity verification has been approved. You now have full access to all platform features.</p>'
        : `<p style="color:#ccc;">Your KYC submission requires attention.</p><p style="color:#ef4444;font-size:13px;">Reason: ${reason || 'Please resubmit with clearer documents.'}</p>`
      }
    `),
  })
}

export async function sendAccountActivated(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Account Activated! 🚀 - BNFX',
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Account Activated! 🚀</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">Your BNFX account is now fully active. Your first deposit has been confirmed.</p>
      <p style="color:#ccc;">You can now:</p>
      <ul style="color:#ccc;line-height:2;">
        <li>Activate investment plans</li>
        <li>Start earning daily returns</li>
        <li>Build your referral network</li>
        <li>Earn Nova Points rewards</li>
      </ul>
      <div style="text-align:center;margin-top:25px;">
        <a href="${APP_URL}/dashboard" style="background:#10b981;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Start Investing</a>
      </div>
    `),
  })
}

export async function sendDailyEarningsReport(to: string, name: string, stats: { wins: number; losses: number; neutral: number; netAmount: number; totalEarnings: number; planName: string }) {
  const { wins, losses, neutral, netAmount, totalEarnings, planName } = stats
  const totalTrades = wins + losses + neutral
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0'
  const isPositive = netAmount >= 0

  return sendEmail({
    to,
    subject: `Daily Report: ${wins}W/${losses}L/${neutral}N • ${isPositive ? '+' : ''}$${netAmount.toFixed(2)} 📊`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Daily Trading Report 📊</h2>
      <p style="color:#ccc;">Hi ${name}, here's your trading summary for today:</p>

      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;">
        <!-- W/L/N Stats -->
        <div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px;">
          <div style="text-align:center;">
            <p style="color:#10b981;font-size:24px;font-weight:700;margin:0;">${wins}</p>
            <p style="color:#666;font-size:11px;margin:4px 0 0;">WINS</p>
          </div>
          <div style="text-align:center;">
            <p style="color:#ef4444;font-size:24px;font-weight:700;margin:0;">${losses}</p>
            <p style="color:#666;font-size:11px;margin:4px 0 0;">LOSSES</p>
          </div>
          <div style="text-align:center;">
            <p style="color:#f59e0b;font-size:24px;font-weight:700;margin:0;">${neutral}</p>
            <p style="color:#666;font-size:11px;margin:4px 0 0;">NEUTRAL</p>
          </div>
        </div>

        <div style="border-top:1px solid #333;padding-top:16px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#999;padding:6px 0;">Win Rate:</td><td style="color:#fff;text-align:right;font-weight:600;">${winRate}%</td></tr>
            <tr><td style="color:#999;padding:6px 0;">Net P&L:</td><td style="color:${isPositive ? '#10b981' : '#ef4444'};text-align:right;font-weight:700;font-size:18px;">${isPositive ? '+' : ''}$${netAmount.toFixed(2)}</td></tr>
            <tr><td style="color:#999;padding:6px 0;">Plan:</td><td style="color:#fff;text-align:right;">${planName}</td></tr>
            <tr><td style="color:#999;padding:6px 0;border-top:1px solid #333;">Total Earnings:</td><td style="color:#10b981;text-align:right;font-weight:600;border-top:1px solid #333;">$${totalEarnings.toFixed(2)}</td></tr>
          </table>
        </div>
      </div>

      <p style="color:#666;font-size:11px;text-align:center;">Trading results are based on AI algorithm performance. Past results don't guarantee future returns.</p>
    `),
  })
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verificationLink = `${APP_URL}/api/auth/verify-email?token=${token}`
  return sendEmail({
    to,
    subject: 'Verify your email address - BNFX',
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Verify your Email Address</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;line-height:1.6;">Thank you for registering on BNFX. To complete your registration and activate your email, please click the button below:</p>
      <div style="text-align:center;margin-top:25px;margin-bottom:25px;">
        <a href="${verificationLink}" style="background:#10b981;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Verify Email Address</a>
      </div>
      <p style="color:#666;font-size:12px;">Or copy and paste this link in your browser:</p>
      <p style="color:#666;font-size:12px;word-break:break-all;"><a href="${verificationLink}" style="color:#10b981;">${verificationLink}</a></p>
      <p style="color:#666;font-size:12px;">This link will expire in 24 hours.</p>
    `),
  })
}
