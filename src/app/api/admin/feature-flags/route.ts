import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// All platform feature flags with defaults
const DEFAULT_FLAGS: Record<string, { enabled: boolean; label: string; description: string; category: string }> = {
  // Landing Page
  nova_ai_chatbot: { enabled: true, label: 'Nova AI Chatbot', description: 'Floating AI chatbot on landing page', category: 'Landing Page' },
  withdrawal_proof_ticker: { enabled: true, label: 'Withdrawal Proof Ticker', description: 'Scrolling withdrawal proofs on landing page', category: 'Landing Page' },
  fake_notifications: { enabled: true, label: 'Fake Notification Toasts', description: 'Show fake investment notifications to visitors', category: 'Landing Page' },
  promotion_banner: { enabled: true, label: 'Promotion Banner', description: 'Show active promotions banner', category: 'Landing Page' },
  announcement_banner: { enabled: true, label: 'Announcement Banner', description: 'Top announcement bar on landing page', category: 'Landing Page' },
  referral_calculator: { enabled: true, label: 'Referral Calculator', description: 'Referral income calculator section', category: 'Landing Page' },
  earnings_calculator: { enabled: true, label: 'Earnings Calculator', description: 'Investment earnings calculator section', category: 'Landing Page' },
  testimonials_section: { enabled: true, label: 'Testimonials', description: 'Testimonials section on landing page', category: 'Landing Page' },
  stats_section: { enabled: true, label: 'Stats Section', description: 'Platform stats section on landing page', category: 'Landing Page' },

  // User Dashboard
  daily_checkin: { enabled: true, label: 'Daily Check-in', description: 'Daily check-in for Nova Points', category: 'User Dashboard' },
  nova_points_store: { enabled: true, label: 'Nova Points Store', description: 'Rewards store for NP redemption', category: 'User Dashboard' },
  live_trading: { enabled: true, label: 'Live Trading Simulator', description: 'Trading simulator in user dashboard', category: 'User Dashboard' },
  p2p_transfer: { enabled: true, label: 'P2P Transfer', description: 'Peer-to-peer balance transfers between users', category: 'User Dashboard' },
  wallet_transfer: { enabled: true, label: 'Wallet Transfer', description: 'Transfer between trading and withdrawal wallets', category: 'User Dashboard' },
  challenges: { enabled: true, label: 'Challenges & Badges', description: 'Gamification challenges system', category: 'User Dashboard' },
  leaderboard: { enabled: true, label: 'Leaderboard', description: 'User rankings leaderboard', category: 'User Dashboard' },
  session_timeout: { enabled: true, label: 'Session Timeout', description: 'Auto-logout after inactivity', category: 'User Dashboard' },
  welcome_tour: { enabled: true, label: 'Welcome Tour', description: 'Onboarding tour for new users', category: 'User Dashboard' },

  // Finance
  metamask_connect: { enabled: true, label: 'MetaMask Connect', description: 'MetaMask wallet connection for deposits', category: 'Finance' },
  coinpayments: { enabled: true, label: 'CoinPayments Gateway', description: 'CoinPayments crypto gateway', category: 'Finance' },
  nowpayments: { enabled: true, label: 'NOWPayments Gateway', description: 'NOWPayments crypto gateway', category: 'Finance' },
  auto_compound: { enabled: true, label: 'Auto-Compound', description: 'Allow users to auto-reinvest earnings', category: 'Finance' },
  deposit_approval: { enabled: true, label: 'Deposit Approval Required', description: 'All deposits require admin approval', category: 'Finance' },
  stacking: { enabled: true, label: 'Deposit Stacking', description: 'Allow multiple deposits on same plan', category: 'Finance' },

  // Security
  two_factor_auth: { enabled: true, label: '2FA Authentication', description: 'Two-factor authentication for users', category: 'Security' },
  kyc_verification: { enabled: true, label: 'KYC Verification', description: 'Identity verification system', category: 'Security' },
  ip_login_alerts: { enabled: true, label: 'IP Login Alerts', description: 'Notify users of new IP logins', category: 'Security' },
  geo_blocking: { enabled: true, label: 'Geo Blocking', description: 'Block access from specific countries', category: 'Security' },

  // AI Features
  ai_trading_signals: { enabled: true, label: 'AI Trading Signals', description: 'AI-generated trading signals', category: 'AI Features' },
  ai_market_commentary: { enabled: true, label: 'AI Market Commentary', description: 'AI market analysis and commentary', category: 'AI Features' },
  ai_content_generator: { enabled: true, label: 'AI Content Generator', description: 'AI-powered content generation for admin', category: 'AI Features' },
  auto_translation: { enabled: true, label: 'Auto Translation', description: 'Automatic geo-based language translation', category: 'AI Features' },

  // Platform
  pwa_support: { enabled: true, label: 'PWA Support', description: 'Progressive Web App install prompt', category: 'Platform' },
  cookie_consent: { enabled: true, label: 'Cookie Consent', description: 'Cookie consent banner', category: 'Platform' },
  maintenance_mode: { enabled: false, label: 'Maintenance Mode', description: 'Show maintenance page to all users', category: 'Platform' },
  registration_open: { enabled: true, label: 'Registration Open', description: 'Allow new user registrations', category: 'Platform' },
  referral_system: { enabled: true, label: 'Referral System', description: '7-level referral commission system', category: 'Platform' },
  vip_tiers: { enabled: true, label: 'VIP Tier System', description: 'VIP tier progression with cashback', category: 'Platform' },
}

// GET - Load feature flags
export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'feature_flags' } })
    const saved = setting ? JSON.parse(setting.value) : {}

    // Merge saved with defaults (saved overrides defaults)
    const flags = Object.entries(DEFAULT_FLAGS).map(([key, def]) => ({
      key,
      ...def,
      enabled: saved[key] !== undefined ? saved[key] : def.enabled,
    }))

    return NextResponse.json(flags)
  } catch (error) {
    console.error('Feature flags GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT - Update feature flags
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    // body is { [key]: boolean }
    const setting = await db.setting.findUnique({ where: { key: 'feature_flags' } })
    const current = setting ? JSON.parse(setting.value) : {}
    const updated = { ...current, ...body }

    await db.setting.upsert({
      where: { key: 'feature_flags' },
      update: { value: JSON.stringify(updated) },
      create: { key: 'feature_flags', value: JSON.stringify(updated) },
    })

    await db.activityLog.create({
      data: { action: 'feature_flags_updated', details: JSON.stringify({ changed: Object.keys(body) }) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feature flags PUT error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
