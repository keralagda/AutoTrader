// Email Integration using Resend
// Configure FROM_EMAIL via env or it defaults to Resend test sender

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = process.env.EMAIL_FROM || 'BNFX <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bnfx.eu.cc'

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
      <p style="color:#ccc;font-size:13px;">Keep growing your network to earn more! Share your referral link with friends.</p>
      <div style="text-align:center;margin-top:20px;">
        <a href="${APP_URL}/dashboard" style="background:#10b981;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:14px;">View Earnings</a>
      </div>
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
      <p style="color:#ccc;font-size:13px;">Daily returns will be automatically credited to your Trading Wallet. Check your dashboard for live earnings.</p>
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
          <tr><td style="color:#999;padding:8px 0;">Location:</td><td style="color:#fff;text-align:right;">${location}</td></tr>
          <tr><td style="color:#999;padding:8px 0;">Time:</td><td style="color:#fff;text-align:right;">${new Date().toLocaleString()}</td></tr>
        </table>
      </div>
      <p style="color:#f59e0b;font-size:13px;">⚠️ If this wasn't you, change your password immediately and enable 2FA.</p>
      <div style="text-align:center;margin-top:20px;">
        <a href="${APP_URL}/dashboard" style="background:#ef4444;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:14px;">Secure My Account</a>
      </div>
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
        ? '<p style="color:#ccc;">Your identity verification has been approved. You now have full access to all platform features including unlimited withdrawals.</p>'
        : `<p style="color:#ccc;">Your KYC submission requires attention.</p><p style="color:#ef4444;font-size:13px;">Reason: ${reason || 'Please resubmit with clearer documents.'}</p>`
      }
      <div style="text-align:center;margin-top:20px;">
        <a href="${APP_URL}/dashboard" style="background:${isApproved ? '#10b981' : '#f59e0b'};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:14px;">${isApproved ? 'View Dashboard' : 'Resubmit KYC'}</a>
      </div>
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
      <p style="color:#ccc;">Great news! Your BNFX account is now fully active. Your first deposit has been confirmed.</p>
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
