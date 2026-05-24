import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 3 Built-in Landing Page Templates
const BUILT_IN_TEMPLATES = [
  {
    id: 'crypto-dark',
    name: 'Crypto Dark',
    description: 'Dark futuristic theme with neon accents, perfect for crypto platforms',
    thumbnail: '🌑',
    category: 'crypto',
    colors: { primary: '#10b981', accent: '#06b6d4', background: '#0a0a0a', card: '#111111', text: '#ffffff' },
    hero: {
      headline: 'The Future of Crypto Investing',
      subtitle: 'AI-powered trading algorithms delivering consistent daily returns. Join 10,000+ investors earning passively.',
      ctaText: 'Start Earning Now',
      ctaSecondary: 'View Plans',
      backgroundStyle: 'gradient-mesh',
      stats: [
        { label: 'Total Invested', value: 5000000, prefix: '$', suffix: '+' },
        { label: 'Active Users', value: 10000, prefix: '', suffix: '+' },
        { label: 'Daily Returns', value: 15, prefix: '', suffix: '%' },
        { label: 'Countries', value: 50, prefix: '', suffix: '+' },
      ],
    },
    sections: ['hero', 'stats', 'plans', 'calculator', 'distribution', 'referral', 'testimonials', 'faq', 'footer'],
    styles: {
      borderRadius: '12px',
      fontFamily: 'Inter, system-ui',
      cardStyle: 'glass',
      animationStyle: 'fade-up',
    },
  },
  {
    id: 'defi-gradient',
    name: 'DeFi Gradient',
    description: 'Vibrant gradient theme with purple/blue tones, modern DeFi aesthetic',
    thumbnail: '🟣',
    category: 'defi',
    colors: { primary: '#8b5cf6', accent: '#3b82f6', background: '#0f0a1e', card: '#1a1030', text: '#ffffff' },
    hero: {
      headline: 'Decentralized Yield Generation',
      subtitle: 'Stake your USDC and earn automated yields through our smart contract protocols. Transparent, secure, unstoppable.',
      ctaText: 'Connect & Earn',
      ctaSecondary: 'Learn More',
      backgroundStyle: 'animated-orbs',
      stats: [
        { label: 'TVL', value: 12000000, prefix: '$', suffix: '' },
        { label: 'APY', value: 365, prefix: '', suffix: '%' },
        { label: 'Protocols', value: 7, prefix: '', suffix: '' },
        { label: 'Audited', value: 100, prefix: '', suffix: '%' },
      ],
    },
    sections: ['hero', 'features', 'plans', 'how-it-works', 'security', 'testimonials', 'partners', 'footer'],
    styles: {
      borderRadius: '16px',
      fontFamily: 'Space Grotesk, system-ui',
      cardStyle: 'gradient-border',
      animationStyle: 'scale-in',
    },
  },
  {
    id: 'trading-pro',
    name: 'Trading Pro',
    description: 'Clean professional theme with gold accents, institutional trading feel',
    thumbnail: '🥇',
    category: 'trading',
    colors: { primary: '#f59e0b', accent: '#10b981', background: '#09090b', card: '#18181b', text: '#fafafa' },
    hero: {
      headline: 'Professional Crypto Trading',
      subtitle: 'Institutional-grade algorithms. Retail-friendly returns. Start with as little as $50 and watch your portfolio grow daily.',
      ctaText: 'Open Account',
      ctaSecondary: 'See Performance',
      backgroundStyle: 'chart-pattern',
      stats: [
        { label: 'Win Rate', value: 94, prefix: '', suffix: '%' },
        { label: 'Avg Daily', value: 8, prefix: '', suffix: '%' },
        { label: 'Max Drawdown', value: 3, prefix: '', suffix: '%' },
        { label: 'Since', value: 2024, prefix: '', suffix: '' },
      ],
    },
    sections: ['hero', 'performance', 'plans', 'calculator', 'team', 'testimonials', 'security', 'footer'],
    styles: {
      borderRadius: '8px',
      fontFamily: 'JetBrains Mono, monospace',
      cardStyle: 'solid-border',
      animationStyle: 'slide-up',
    },
  },
]

// GET - List templates or get active template
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    if (action === 'active') {
      // Get currently active template
      const setting = await prisma.setting.findUnique({ where: { key: 'active_template' } })
      if (setting) {
        return NextResponse.json(JSON.parse(setting.value))
      }
      // Default to first template
      return NextResponse.json(BUILT_IN_TEMPLATES[0])
    }

    // Return all templates (built-in + custom)
    const customTemplates = await prisma.setting.findMany({
      where: { key: { startsWith: 'template_custom_' } },
    })

    const custom = customTemplates.map(s => JSON.parse(s.value))

    return NextResponse.json({
      builtIn: BUILT_IN_TEMPLATES,
      custom,
      activeId: (await prisma.setting.findUnique({ where: { key: 'active_template_id' } }))?.value || 'crypto-dark',
    })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Apply a template
export async function POST(req: NextRequest) {
  try {
    const { templateId, action } = await req.json()

    if (action === 'apply') {
      // Find template
      let template = BUILT_IN_TEMPLATES.find(t => t.id === templateId)

      if (!template) {
        // Check custom templates
        const custom = await prisma.setting.findUnique({ where: { key: `template_custom_${templateId}` } })
        if (custom) template = JSON.parse(custom.value)
      }

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Save as active template
      await prisma.setting.upsert({
        where: { key: 'active_template' },
        update: { value: JSON.stringify(template) },
        create: { key: 'active_template', value: JSON.stringify(template) },
      })

      await prisma.setting.upsert({
        where: { key: 'active_template_id' },
        update: { value: templateId },
        create: { key: 'active_template_id', value: templateId },
      })

      // Also update landing sections in DB to match template
      if (template.hero) {
        await prisma.landingSection.upsert({
          where: { sectionKey: 'hero' },
          update: {
            title: template.hero.headline,
            subtitle: template.hero.subtitle,
            content: JSON.stringify(template.hero),
            isVisible: true,
          },
          create: {
            sectionKey: 'hero',
            title: template.hero.headline,
            subtitle: template.hero.subtitle,
            content: JSON.stringify(template.hero),
            isVisible: true,
            sortOrder: 0,
            updatedAt: new Date(),
          },
        })
      }

      // Save template colors to settings
      if (template.colors) {
        await prisma.setting.upsert({
          where: { key: 'theme_colors' },
          update: { value: JSON.stringify(template.colors) },
          create: { key: 'theme_colors', value: JSON.stringify(template.colors) },
        })
      }

      return NextResponse.json({ success: true, applied: templateId })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Save custom template
export async function PUT(req: NextRequest) {
  try {
    const template = await req.json()
    if (!template.id || !template.name) {
      return NextResponse.json({ error: 'Template id and name required' }, { status: 400 })
    }

    await prisma.setting.upsert({
      where: { key: `template_custom_${template.id}` },
      update: { value: JSON.stringify(template) },
      create: { key: `template_custom_${template.id}`, value: JSON.stringify(template) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
