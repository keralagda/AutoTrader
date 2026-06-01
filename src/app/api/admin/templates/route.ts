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
    images: {
      heroBg: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80',
      feature1: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&q=80',
      feature2: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&q=80',
      feature3: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&q=80',
    },
    features: [
      { icon: '🔒', title: 'Bank-Grade Security', description: '256-bit encryption with multi-sig wallets and cold storage', image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&q=80' },
      { icon: '🤖', title: 'AI-Powered Trading', description: 'Machine learning algorithms analyzing 1000+ signals per second', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&q=80' },
      { icon: '⚡', title: 'Instant Withdrawals', description: 'Get your funds within minutes, not days. 24/7 processing', image: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=300&q=80' },
      { icon: '🌐', title: 'Global Access', description: 'Available in 50+ countries with multi-currency support', image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=300&q=80' },
    ],
    hero: {
      headline: 'The Future of Crypto Investing',
      subtitle: 'AI-powered trading algorithms delivering consistent daily returns. Join 10,000+ investors earning passively.',
      ctaText: 'Start Earning Now',
      ctaSecondary: 'View Plans',
      backgroundStyle: 'gradient-mesh',
      heroImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
      stats: [
        { label: 'Total Invested', value: 5000000, prefix: '$', suffix: '+', icon: '💰' },
        { label: 'Active Users', value: 10000, prefix: '', suffix: '+', icon: '👥' },
        { label: 'Daily Returns', value: 15, prefix: '', suffix: '%', icon: '📈' },
        { label: 'Countries', value: 50, prefix: '', suffix: '+', icon: '🌍' },
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
    images: {
      heroBg: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=1200&q=80',
      feature1: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&q=80',
      feature2: 'https://images.unsplash.com/photo-1644143379190-08a5f055de1d?w=400&q=80',
      feature3: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&q=80',
    },
    features: [
      { icon: '🔗', title: 'On-Chain Transparency', description: 'Every transaction verifiable on the blockchain. Full audit trail.', image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=300&q=80' },
      { icon: '🛡️', title: 'Smart Contract Audited', description: 'Audited by CertiK and Hacken. Bug bounty program active.', image: 'https://images.unsplash.com/photo-1644143379190-08a5f055de1d?w=300&q=80' },
      { icon: '💎', title: 'Multi-Protocol Yield', description: 'Aggregating yields from Aave, Compound, and Curve protocols', image: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=300&q=80' },
      { icon: '🔄', title: 'Auto-Compounding', description: 'Profits automatically reinvested for maximum compound growth', image: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=300&q=80' },
    ],
    hero: {
      headline: 'Decentralized Yield Generation',
      subtitle: 'Stake your USDC and earn automated yields through our smart contract protocols. Transparent, secure, unstoppable.',
      ctaText: 'Connect & Earn',
      ctaSecondary: 'Learn More',
      backgroundStyle: 'animated-orbs',
      heroImage: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=800&q=80',
      stats: [
        { label: 'TVL', value: 12000000, prefix: '$', suffix: '', icon: '🏦' },
        { label: 'APY', value: 365, prefix: '', suffix: '%', icon: '🚀' },
        { label: 'Protocols', value: 7, prefix: '', suffix: '', icon: '🔗' },
        { label: 'Audited', value: 100, prefix: '', suffix: '%', icon: '✅' },
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
    images: {
      heroBg: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
      feature1: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80',
      feature2: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=400&q=80',
      feature3: 'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=400&q=80',
    },
    features: [
      { icon: '📊', title: '94% Win Rate', description: 'Backtested across 5 years of market data with consistent results', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80' },
      { icon: '🏛️', title: 'Institutional Grade', description: 'Same algorithms used by hedge funds, now accessible to everyone', image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&q=80' },
      { icon: '📱', title: 'Trade Anywhere', description: 'Full mobile app with real-time alerts and one-tap trading', image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=300&q=80' },
      { icon: '🎯', title: 'Risk Management', description: 'Advanced stop-loss and position sizing. Max 3% drawdown.', image: 'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=300&q=80' },
    ],
    hero: {
      headline: 'Professional Crypto Trading',
      subtitle: 'Institutional-grade algorithms. Retail-friendly returns. Start with as little as $50 and watch your portfolio grow daily.',
      ctaText: 'Open Account',
      ctaSecondary: 'See Performance',
      backgroundStyle: 'chart-pattern',
      heroImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
      stats: [
        { label: 'Win Rate', value: 94, prefix: '', suffix: '%', icon: '🎯' },
        { label: 'Avg Daily', value: 8, prefix: '', suffix: '%', icon: '📈' },
        { label: 'Max Drawdown', value: 3, prefix: '', suffix: '%', icon: '🛡️' },
        { label: 'Since', value: 2024, prefix: '', suffix: '', icon: '📅' },
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
  // ─── NEW FUTURISTIC TEMPLATES ─────────────────────────────────────
  {
    id: 'neon-pulse',
    name: 'Neon Pulse',
    description: 'Electric neon gradients with pulsing animations, cyberpunk-inspired futuristic UI',
    thumbnail: '⚡',
    category: 'futuristic',
    colors: { primary: '#00ff88', accent: '#ff00ff', background: '#050510', card: '#0a0a1a', text: '#e0e0ff' },
    images: {
      heroBg: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
      feature1: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&q=80',
      feature2: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
      feature3: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
    },
    features: [
      { icon: '⚡', title: 'Lightning Execution', description: 'Sub-millisecond trade execution powered by quantum algorithms', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&q=80' },
      { icon: '🧬', title: 'Neural Network AI', description: 'Deep learning models trained on 10 years of market data', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=300&q=80' },
      { icon: '🛡️', title: 'Quantum Encryption', description: 'Post-quantum cryptography protecting every transaction', image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=300&q=80' },
      { icon: '🌌', title: 'Multiverse Staking', description: 'Cross-chain yield aggregation across 15+ networks', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80' },
    ],
    hero: {
      headline: 'Trade at the Speed of Light',
      subtitle: 'Next-gen AI algorithms delivering exponential returns. The future of wealth generation is here.',
      ctaText: 'Enter the Matrix',
      ctaSecondary: 'See Returns',
      backgroundStyle: 'neon-grid',
      heroImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
      stats: [
        { label: 'Avg Daily', value: 8, prefix: '', suffix: '%', icon: '📈' },
        { label: 'Active Nodes', value: 50000, prefix: '', suffix: '+', icon: '🌐' },
        { label: 'Uptime', value: 99.99, prefix: '', suffix: '%', icon: '⚡' },
        { label: 'Chains', value: 15, prefix: '', suffix: '+', icon: '🔗' },
      ],
    },
    sections: ['hero', 'stats', 'features', 'plans', 'calculator', 'testimonials', 'faq', 'footer'],
    styles: {
      borderRadius: '16px',
      fontFamily: 'Orbitron, sans-serif',
      cardStyle: 'neon-glow',
      animationStyle: 'glitch',
    },
  },
  {
    id: 'aurora-gradient',
    name: 'Aurora Gradient',
    description: 'Mesmerizing aurora borealis gradients with smooth flowing animations and glass morphism',
    thumbnail: '🌈',
    category: 'futuristic',
    colors: { primary: '#7c3aed', accent: '#06b6d4', background: '#020617', card: '#0f172a', text: '#f1f5f9' },
    images: {
      heroBg: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80',
      feature1: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80',
      feature2: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&q=80',
      feature3: 'https://images.unsplash.com/photo-1644143379190-08a5f055de1d?w=400&q=80',
    },
    features: [
      { icon: '🔮', title: 'Predictive Analytics', description: 'AI forecasts market movements 24 hours ahead with 92% accuracy', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300&q=80' },
      { icon: '💠', title: 'Smart Portfolios', description: 'Auto-rebalancing portfolios optimized by machine learning', image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=300&q=80' },
      { icon: '🌊', title: 'Liquidity Pools', description: 'Deep liquidity across 200+ trading pairs with zero slippage', image: 'https://images.unsplash.com/photo-1644143379190-08a5f055de1d?w=300&q=80' },
      { icon: '✨', title: 'Yield Optimizer', description: 'Automatically routes funds to highest-yield protocols', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300&q=80' },
    ],
    hero: {
      headline: 'Where AI Meets Wealth',
      subtitle: 'Harness the power of aurora-class algorithms. Automated wealth generation with institutional-grade security.',
      ctaText: 'Start Your Journey',
      ctaSecondary: 'Explore Plans',
      backgroundStyle: 'aurora-waves',
      heroImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80',
      stats: [
        { label: 'AUM', value: 25000000, prefix: '$', suffix: '', icon: '🏦' },
        { label: 'Investors', value: 25000, prefix: '', suffix: '+', icon: '👥' },
        { label: 'Accuracy', value: 92, prefix: '', suffix: '%', icon: '🎯' },
        { label: 'Pairs', value: 200, prefix: '', suffix: '+', icon: '💱' },
      ],
    },
    sections: ['hero', 'features', 'stats', 'plans', 'how-it-works', 'calculator', 'testimonials', 'footer'],
    styles: {
      borderRadius: '20px',
      fontFamily: 'Sora, sans-serif',
      cardStyle: 'glass-aurora',
      animationStyle: 'float',
    },
  },
  {
    id: 'quantum-dark',
    name: 'Quantum Dark',
    description: 'Ultra-minimal dark theme with geometric patterns, particle effects, and sharp typography',
    thumbnail: '🔬',
    category: 'futuristic',
    colors: { primary: '#f97316', accent: '#eab308', background: '#000000', card: '#0c0c0c', text: '#fafafa' },
    images: {
      heroBg: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200&q=80',
      feature1: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
      feature2: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80',
      feature3: 'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=400&q=80',
    },
    features: [
      { icon: '🔥', title: 'Blazing Returns', description: 'Proprietary algorithms delivering up to 15% daily on high-risk trades', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80' },
      { icon: '🎲', title: 'Risk Engine', description: 'Dynamic risk scoring with real-time portfolio hedging', image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&q=80' },
      { icon: '⚙️', title: 'Auto-Compound', description: 'Earnings automatically reinvested for exponential growth', image: 'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=300&q=80' },
      { icon: '📡', title: 'Signal Network', description: '10,000+ data points analyzed per second across global markets', image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=300&q=80' },
    ],
    hero: {
      headline: 'Quantum-Grade Trading',
      subtitle: 'Zero-latency execution. Maximum returns. Built for serious investors who demand performance.',
      ctaText: 'Deploy Capital',
      ctaSecondary: 'View Performance',
      backgroundStyle: 'particle-field',
      heroImage: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&q=80',
      stats: [
        { label: 'Win Rate', value: 96, prefix: '', suffix: '%', icon: '🎯' },
        { label: 'Max Daily', value: 15, prefix: '', suffix: '%', icon: '🔥' },
        { label: 'Latency', value: 0.3, prefix: '', suffix: 'ms', icon: '⚡' },
        { label: 'Signals/s', value: 10000, prefix: '', suffix: '+', icon: '📡' },
      ],
    },
    sections: ['hero', 'performance', 'features', 'plans', 'calculator', 'security', 'testimonials', 'footer'],
    styles: {
      borderRadius: '4px',
      fontFamily: 'Space Mono, monospace',
      cardStyle: 'sharp-edge',
      animationStyle: 'particle',
    },
  },
  {
    id: 'hologram-ui',
    name: 'Hologram UI',
    description: 'Futuristic holographic interface with iridescent colors, 3D depth effects, and sci-fi aesthetics',
    thumbnail: '🌀',
    category: 'futuristic',
    colors: { primary: '#06ffa5', accent: '#b94fff', background: '#030318', card: '#0a0a2e', text: '#e8e8ff' },
    images: {
      heroBg: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80',
      feature1: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80',
      feature2: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&q=80',
      feature3: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
    },
    features: [
      { icon: '🌀', title: 'Holographic Dashboard', description: 'Real-time 3D visualization of your portfolio performance', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&q=80' },
      { icon: '🧠', title: 'Sentient AI', description: 'Self-evolving algorithms that adapt to market conditions in real-time', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=300&q=80' },
      { icon: '💎', title: 'Diamond Hands Mode', description: 'Lock-in profits with smart take-profit and stop-loss automation', image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=300&q=80' },
      { icon: '🚀', title: 'Warp Speed Payouts', description: 'Instant withdrawals to any wallet, any chain, any time', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&q=80' },
    ],
    hero: {
      headline: 'The Holographic Future of Finance',
      subtitle: 'Step into tomorrow. AI-driven wealth generation with a sci-fi interface that makes investing feel like magic.',
      ctaText: 'Activate Protocol',
      ctaSecondary: 'View Holograms',
      backgroundStyle: 'hologram-grid',
      heroImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80',
      stats: [
        { label: 'Protocol TVL', value: 50000000, prefix: '$', suffix: '', icon: '💰' },
        { label: 'Nodes Active', value: 100000, prefix: '', suffix: '+', icon: '🌐' },
        { label: 'Yield APY', value: 500, prefix: '', suffix: '%', icon: '🚀' },
        { label: 'Chains', value: 20, prefix: '', suffix: '+', icon: '🔗' },
      ],
    },
    sections: ['hero', 'features', 'stats', 'plans', 'calculator', 'referral', 'testimonials', 'partners', 'footer'],
    styles: {
      borderRadius: '24px',
      fontFamily: 'Exo 2, sans-serif',
      cardStyle: 'hologram',
      animationStyle: 'holographic',
    },
  },
  {
    id: 'awwwards-minimal',
    name: 'Awwwards Minimal',
    description: 'Award-winning minimal design with large kinetic typography, bento grids, scroll animations, and glassmorphism. Inspired by Linear, Stripe, and Vercel.',
    thumbnail: '🏆',
    category: 'premium',
    colors: { primary: '#f59e0b', accent: '#f97316', background: '#030303', card: '#0a0a0a', text: '#ffffff' },
    images: {
      heroBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
    },
    features: [
      { icon: '⚡', title: 'AI Trading Engine', description: 'Neural network processing 10,000+ signals per second' },
      { icon: '🛡️', title: 'Bank-Grade Security', description: '256-bit encryption with multi-sig wallets' },
      { icon: '🌐', title: 'Global Access', description: '50+ countries, multi-language, multi-currency' },
      { icon: '📈', title: 'Variable Returns', description: 'Choose Low, Medium, or High risk profiles' },
    ],
    hero: {
      headline: 'Your money works harder.',
      subtitle: 'Automated crypto trading with institutional-grade AI. Earn daily returns while you sleep.',
      ctaText: 'Start Earning',
      ctaSecondary: 'View Performance',
      backgroundStyle: 'gradient-orbs',
    },
    sections: ['hero', 'stats', 'features-bento', 'plans', 'how-it-works', 'cta', 'footer'],
    styles: {
      borderRadius: '24px',
      fontFamily: 'Inter, system-ui',
      cardStyle: 'glass-minimal',
      animationStyle: 'scroll-reveal',
      layout: 'awwwards', // Special flag to use AwwwardsLanding component
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

// DELETE - Remove a custom template
export async function DELETE(req: NextRequest) {
  try {
    const { templateId } = await req.json()
    if (!templateId) {
      return NextResponse.json({ error: 'templateId required' }, { status: 400 })
    }

    // Cannot delete built-in templates
    if (BUILT_IN_TEMPLATES.find(t => t.id === templateId)) {
      return NextResponse.json({ error: 'Cannot delete built-in templates' }, { status: 400 })
    }

    const key = `template_custom_${templateId}`
    const existing = await prisma.setting.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.setting.delete({ where: { key } })

    // If this was the active template, reset to default
    const activeId = await prisma.setting.findUnique({ where: { key: 'active_template_id' } })
    if (activeId?.value === templateId) {
      await prisma.setting.update({
        where: { key: 'active_template_id' },
        data: { value: 'crypto-dark' },
      })
      await prisma.setting.upsert({
        where: { key: 'active_template' },
        update: { value: JSON.stringify(BUILT_IN_TEMPLATES[0]) },
        create: { key: 'active_template', value: JSON.stringify(BUILT_IN_TEMPLATES[0]) },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
