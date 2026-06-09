import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { 
  sendVerificationEmail, 
  sendPasswordResetCode, 
  sendWelcomeEmail, 
  sendEmail 
} from '@/lib/email'
import crypto from 'crypto'

// HTML template wrapper for custom notifications (so they match Black Nova FX style)
const customNotificationTemplate = (name: string, content: string) => `
  <h2 style="color:#fff;margin:0 0 15px;">Official Notification</h2>
  <p style="color:#ccc;">Hi ${name},</p>
  <p style="color:#ccc;line-height:1.6;white-space:pre-wrap;">${content}</p>
  <p style="color:#666;font-size:12px;margin-top:20px;">If you have any questions, please contact platform support.</p>
`

export async function POST(request: NextRequest) {
  try {
    // 1. Connection check
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    // 2. Auth check (require admin)
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { userId, type, subject, message } = await request.json()

    if (!userId || !type) {
      return NextResponse.json({ error: 'User ID and notification type are required' }, { status: 400 })
    }

    // 3. Find user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Dispatch email action
    switch (type) {
      case 'verify': {
        const verificationToken = crypto.randomUUID()
        await db.user.update({
          where: { id: user.id },
          data: { emailVerificationToken: verificationToken }
        })
        const success = await sendVerificationEmail(user.email, user.name, verificationToken)
        if (!success) {
          return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
        }
        break
      }

      case 'reset_password': {
        // Generate 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        await db.setting.upsert({
          where: { key: `reset_${user.id}` },
          update: { value: JSON.stringify({ code: resetCode, expiresAt: expiresAt.toISOString() }) },
          create: { key: `reset_${user.id}`, value: JSON.stringify({ code: resetCode, expiresAt: expiresAt.toISOString() }) },
        })

        const success = await sendPasswordResetCode(user.email, user.name, resetCode)
        if (!success) {
          return NextResponse.json({ error: 'Failed to send password reset code' }, { status: 500 })
        }
        break
      }

      case 'welcome': {
        const success = await sendWelcomeEmail(user.email, user.name)
        if (!success) {
          return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
        }
        break
      }

      case 'custom': {
        if (!subject || !message) {
          return NextResponse.json({ error: 'Subject and message are required for custom notification' }, { status: 400 })
        }

        // Inline base template style matching src/lib/email.ts
        const baseTemplate = (content: string) => `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#1a1a1a;border-radius:12px;padding:30px;border:1px solid #333;">
                ${content}
              </div>
              <div style="text-align:center;margin-top:30px;color:#666;font-size:12px;">
                <p>&copy; ${new Date().getFullYear()} Black Nova FX. All rights reserved.</p>
                <p>This is an official administrative transmission.</p>
              </div>
            </div>
          </body>
          </html>
        `

        const htmlContent = baseTemplate(customNotificationTemplate(user.name, message))
        const success = await sendEmail({
          to: user.email,
          subject: subject,
          html: htmlContent,
          text: message
        })

        if (!success) {
          return NextResponse.json({ error: 'Failed to send custom notification email' }, { status: 500 })
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // 5. Log activity
    await db.activityLog.create({
      data: {
        userId: adminCheck.userId,
        action: `manual_email_${type}`,
        details: JSON.stringify({ targetUserId: user.id, targetEmail: user.email })
      }
    })

    return NextResponse.json({ success: true, message: `Email (${type}) processed successfully` })
  } catch (error) {
    console.error('Error processing manual email resend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
