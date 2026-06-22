import { db } from '../src/lib/db'

const awwwardsTemplate = {
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
    stats: [
      { label: 'Total Volume', value: 25000000, prefix: '$', suffix: '+', icon: '💰' },
      { label: 'Active Investors', value: 25000, prefix: '', suffix: '+', icon: '👥' },
      { label: 'Uptime', value: 99.9, prefix: '', suffix: '%', icon: '⚡' },
      { label: 'Daily Yield', value: 8, prefix: '', suffix: '%', icon: '📈' },
    ],
  },
  sections: ['hero', 'stats', 'features-bento', 'plans', 'how-it-works', 'cta', 'footer'],
  styles: {
    borderRadius: '24px',
    fontFamily: 'Inter, system-ui',
    cardStyle: 'glass-minimal',
    animationStyle: 'scroll-reveal',
    layout: 'awwwards',
  },
}

async function main() {
  console.log('Seeding database data...')

  // 1. Set Awwwards Minimal template as active in Settings
  await db.setting.upsert({
    where: { key: 'active_template' },
    update: { value: JSON.stringify(awwwardsTemplate) },
    create: { key: 'active_template', value: JSON.stringify(awwwardsTemplate) }
  })

  await db.setting.upsert({
    where: { key: 'active_template_id' },
    update: { value: 'awwwards-minimal' },
    create: { key: 'active_template_id', value: 'awwwards-minimal' }
  })

  console.log('Awwwards Minimal template set as active in settings.')

  // 2. Seed sample real users (role: 'user', isFake: false)
  const sampleUsers = [
    {
      email: 'user1@example.com',
      name: 'John Doe',
      password: 'password123',
      role: 'user',
      referralCode: 'USRD001',
      tradingBalance: 5000,
      withdrawalBalance: 250,
      totalEarnings: 820,
      totalDeposited: 4500,
    },
    {
      email: 'user2@example.com',
      name: 'Jane Smith',
      password: 'password123',
      role: 'user',
      referralCode: 'USRD002',
      tradingBalance: 12500,
      withdrawalBalance: 1200,
      totalEarnings: 3100,
      totalDeposited: 10000,
    },
    {
      email: 'user3@example.com',
      name: 'David Miller',
      password: 'password123',
      role: 'user',
      referralCode: 'USRD003',
      tradingBalance: 450,
      withdrawalBalance: 10,
      totalEarnings: 85,
      totalDeposited: 500,
    }
  ]

  for (const u of sampleUsers) {
    const existing = await db.user.findUnique({ where: { email: u.email } })
    if (!existing) {
      await db.user.create({
        data: {
          ...u,
          isFake: false,
          isActive: true
        }
      })
      console.log(`Created sample real user: ${u.email}`)
    } else {
      console.log(`Sample user already exists: ${u.email}`)
    }
  }

  console.log('Seeding completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
