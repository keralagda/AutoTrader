import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default notification templates
const defaultTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    title: 'Welcome to BNFX! 🎉',
    message: 'Your account has been created successfully. Start by depositing funds and choosing an investment plan.',
    type: 'success',
  },
  {
    id: 'deposit_confirmed',
    name: 'Deposit Confirmed',
    title: 'Deposit Confirmed ✅',
    message: 'Your deposit of ${amount} has been confirmed and added to your Trading Wallet.',
    type: 'success',
  },
  {
    id: 'withdrawal_approved',
    name: 'Withdrawal Approved',
    title: 'Withdrawal Approved 💸',
    message: 'Your withdrawal of ${amount} has been approved and will be processed within 24 hours.',
    type: 'success',
  },
  {
    id: 'withdrawal_rejected',
    name: 'Withdrawal Rejected',
    title: 'Withdrawal Update',
    message: 'Your withdrawal request has been rejected. Reason: ${reason}. Please contact support.',
    type: 'warning',
  },
  {
    id: 'kyc_approved',
    name: 'KYC Approved',
    title: 'KYC Verified ✅',
    message: 'Your identity verification has been approved. You now have full access to all platform features.',
    type: 'success',
  },
  {
    id: 'kyc_rejected',
    name: 'KYC Rejected',
    title: 'KYC Verification Update',
    message: 'Your KYC submission was rejected. Reason: ${reason}. Please resubmit with correct documents.',
    type: 'warning',
  },
  {
    id: 'profit_credited',
    name: 'Profit Credited',
    title: 'Daily Profit Credited 💰',
    message: 'Your daily profit of ${amount} has been credited to your Trading Wallet.',
    type: 'earning',
  },
  {
    id: 'daily_earnings_report',
    name: 'Daily Earnings Report (W/L/N)',
    title: 'Daily Trading Report 📊',
    message: 'Today\'s results: ${wins}W / ${losses}L / ${neutral}N | Net: ${netAmount} | Total earned: ${totalEarnings}',
    type: 'earning',
  },
  {
    id: 'referral_bonus',
    name: 'Referral Bonus',
    title: 'Referral Bonus Earned! 🎁',
    message: 'You earned ${amount} referral bonus from ${referrer}\'s deposit.',
    type: 'referral',
  },
  {
    id: 'maintenance',
    name: 'Maintenance Notice',
    title: 'Scheduled Maintenance 🔧',
    message: 'Platform maintenance scheduled for ${date}. Services may be temporarily unavailable.',
    type: 'warning',
  },
  {
    id: 'promotion',
    name: 'Promotion',
    title: 'Special Offer! 🔥',
    message: '${message}',
    type: 'info',
  },
]

// Get templates
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'notification_templates' },
    })

    if (setting) {
      return NextResponse.json(JSON.parse(setting.value))
    }

    return NextResponse.json(defaultTemplates)
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json(defaultTemplates)
  }
}

// Send notification using template
export async function POST(req: NextRequest) {
  try {
    const { templateId, userIds, variables } = await req.json()

    if (!templateId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'templateId and userIds required' }, { status: 400 })
    }

    // Get template
    const setting = await prisma.setting.findUnique({
      where: { key: 'notification_templates' },
    })
    const templates = setting ? JSON.parse(setting.value) : defaultTemplates
    const template = templates.find((t: any) => t.id === templateId)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Replace variables in template
    let title = template.title
    let message = template.message
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        title = title.replace(`\${${key}}`, value as string)
        message = message.replace(`\${${key}}`, value as string)
      })
    }

    // Send notifications
    await prisma.notification.createMany({
      data: userIds.map((userId: string) => ({
        userId,
        title,
        message,
        type: template.type || 'info',
      })),
    })

    return NextResponse.json({
      success: true,
      sent: userIds.length,
      message: `Notification sent to ${userIds.length} user(s)`,
    })
  } catch (error) {
    console.error('Send template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update templates
export async function PUT(req: NextRequest) {
  try {
    const templates = await req.json()

    await prisma.setting.upsert({
      where: { key: 'notification_templates' },
      update: { value: JSON.stringify(templates) },
      create: { key: 'notification_templates', value: JSON.stringify(templates) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a notification template by id
export async function DELETE(req: NextRequest) {
  try {
    const { templateId } = await req.json()
    if (!templateId) {
      return NextResponse.json({ error: 'templateId required' }, { status: 400 })
    }

    const setting = await prisma.setting.findUnique({
      where: { key: 'notification_templates' },
    })
    const templates = setting ? JSON.parse(setting.value) : defaultTemplates
    const filtered = templates.filter((t: any) => t.id !== templateId)

    if (filtered.length === templates.length) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.setting.upsert({
      where: { key: 'notification_templates' },
      update: { value: JSON.stringify(filtered) },
      create: { key: 'notification_templates', value: JSON.stringify(filtered) },
    })

    return NextResponse.json({ success: true, remaining: filtered.length })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
