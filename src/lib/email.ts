// Email Integration using Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'BNFX <onboarding@resend.dev>' // Change to your domain after verification

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return false
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// ─── Email Templates ───────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#10b981;font-size:24px;margin:0;">BNFX</h1>
    </div>
    <div style="background:#1a1a1a;border-radius:12px;padding:30px;border:1px solid #333;">
      ${content}
    </div>
    <div style="text-align:center;margin-top:30px;color:#666;font-size:12px;">
      <p>© ${new Date().getFullYear()} BNFX. All rights reserved.</p>
      <p>This is an automated message. Do not reply directly.</p>
    </div>
  </div>
</body>
</html>`

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
        <li>Choose an investment plan</li>
        <li>Earn daily returns automatically</li>
      </ol>
      <div style="text-align:center;margin-top:25px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#10b981;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
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
      <p style="color:#ccc;">You can now invest this amount in any available plan.</p>
    `),
  })
}

export async function sendWithdrawalUpdate(to: string, name: string, amount: number, status: string, txHash?: string) {
  const statusColors: Record<string, string> = { approved: '#10b981', completed: '#10b981', rejected: '#ef4444', pending: '#f59e0b' }
  return sendEmail({
    to,
    subject: `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)} - $${amount.toFixed(2)}`,
    html: baseTemplate(`
      <h2 style="color:#fff;margin:0 0 15px;">Withdrawal Update</h2>
      <p style="color:#ccc;">Hi ${name},</p>
      <p style="color:#ccc;">Your withdrawal request has been updated:</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#ccc;">Amount:</span>
          <span style="color:#fff;font-weight:700;">$${amount.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span style="color:#ccc;">Status:</span>
          <span style="color:${statusColors[status] || '#fff'};font-weight:700;text-transform:uppercase;">${status}</span>
        </div>
        ${txHash ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #333;"><span style="color:#666;font-size:11px;">TX Hash: ${txHash}</span></div>` : ''}
      </div>
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
      <p style="color:#ccc;">You requested a password reset. Use this code to reset your password:</p>
      <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#10b981;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;">${code}</p>
        <p style="color:#666;font-size:12px;margin:10px 0 0;">Expires in 15 minutes</p>
      </div>
      <p style="color:#666;font-size:12px;">If you didn't request this, ignore this email.</p>
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
        <p style="color:#666;font-size:12px;margin:5px 0 0;">From: ${planName}</p>
      </div>
    `),
  })
}
