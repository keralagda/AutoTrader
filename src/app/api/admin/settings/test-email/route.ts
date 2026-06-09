import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

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
    const { to, smtpUser, smtpPass } = await req.json()

    if (!to) {
      return NextResponse.json({ success: false, error: 'Recipient email is required' }, { status: 400 })
    }

    // Determine credentials: use passed ones first, then read from db settings, then fallback to env
    let user = smtpUser || ''
    let pass = smtpPass || ''

    if (!user || !pass) {
      try {
        const userSetting = await db.setting.findUnique({ where: { key: 'smtp_gmail_user' } })
        const passSetting = await db.setting.findUnique({ where: { key: 'smtp_gmail_pass' } })
        user = user || userSetting?.value || process.env.GMAIL_USER || ''
        pass = pass || passSetting?.value || process.env.GMAIL_PASS || ''
      } catch (err) {
        console.error('Failed to read SMTP settings from DB during test email:', err)
      }
    }

    if (!user || !pass) {
      return NextResponse.json({ 
        success: false, 
        error: 'SMTP credentials not configured. Please input or save your user email and app password first.' 
      }, { status: 400 })
    }

    // Initialize transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    })

    const info = await transporter.sendMail({
      from: `BNFX SMTP Test <${user}>`,
      to,
      subject: 'BNFX SMTP Connection Test ✅',
      html: `
        <div style="background-color: #0a0a0a; color: #ffffff; font-family: sans-serif; padding: 30px; border-radius: 12px; border: 1px solid #333; max-width: 500px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">SMTP Test Successful</h2>
            <p style="color: #888; font-size: 13px; margin: 5px 0 0;">BNFX Automated Verification Services</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
          <p style="font-size: 14px; line-height: 1.6; color: #ccc;">
            Hello,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #ccc;">
            This is an automated verification email confirming that your SMTP connection settings are working properly. Transactional emails, account sign-up codes, and login notifications will now route successfully using this SMTP configuration.
          </p>
          <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 12px; font-mono;">
            <p style="margin: 0 0 5px; color: #888;"><strong>Configuration details:</strong></p>
            <p style="margin: 2px 0;">SMTP Server: smtp.gmail.com</p>
            <p style="margin: 2px 0;">SMTP Port: 587 (TLS)</p>
            <p style="margin: 2px 0;">SMTP User: ${user}</p>
            <p style="margin: 2px 0;">Timestamp: ${new Date().toUTCString()}</p>
          </div>
          <p style="font-size: 11px; color: #666; text-align: center; margin-top: 20px;">
            Black Nova FX. Please do not reply directly to this mail.
          </p>
        </div>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      info: {
        messageId: info.messageId,
        envelope: info.envelope
      }
    })
  } catch (error: any) {
    console.error('SMTP test email error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'SMTP authentication failed. Check your email user and app password.'
    }, { status: 500 })
  }
}
