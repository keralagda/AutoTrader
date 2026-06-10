import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { sendPasswordResetCode } from '@/lib/email'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Request password reset (generates a temporary code)
export async function POST(req: NextRequest) {
  try {
    const { email, action, code, newPassword } = await req.json()

    if (action === 'request') {
      // Step 1: Request reset - generate code
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        // Don't reveal if email exists
        return NextResponse.json({ success: true, message: 'If the email exists, a reset code has been generated.' })
      }

      // Generate 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      // Store in settings (simple approach - in production use a dedicated table or cache)
      await prisma.setting.upsert({
        where: { key: `reset_${user.id}` },
        update: { value: JSON.stringify({ code: resetCode, expiresAt: expiresAt.toISOString() }) },
        create: { key: `reset_${user.id}`, value: JSON.stringify({ code: resetCode, expiresAt: expiresAt.toISOString() }) },
      })

      // Send password reset email
      try {
        await sendPasswordResetCode(user.email, user.name, resetCode)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
      }

      return NextResponse.json({
        success: true,
        message: 'Reset code generated. Check your email.',
        // Demo mode: return code directly (remove in production)
        demoCode: resetCode,
      })
    }

    if (action === 'verify') {
      // Step 2: Verify code and reset password
      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: 'Email, code, and new password are required' }, { status: 400 })
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or code' }, { status: 400 })
      }

      // Check reset code
      const setting = await prisma.setting.findUnique({ where: { key: `reset_${user.id}` } })
      if (!setting) {
        return NextResponse.json({ error: 'No reset request found. Please request a new code.' }, { status: 400 })
      }

      const resetData = JSON.parse(setting.value)
      if (resetData.code !== code) {
        return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 })
      }

      if (new Date(resetData.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400 })
      }

      // Reset password
      const hashedPassword = hashPassword(newPassword)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })

      // Clean up reset code
      await prisma.setting.delete({ where: { key: `reset_${user.id}` } })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'password_reset',
          details: JSON.stringify({ method: 'forgot_password' }),
        },
      })

      return NextResponse.json({ success: true, message: 'Password reset successfully. You can now login.' })
    }

    return NextResponse.json({ error: 'Invalid action. Use "request" or "verify"' }, { status: 400 })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
