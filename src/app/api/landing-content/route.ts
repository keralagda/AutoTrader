import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default section content
const DEFAULT_SECTIONS: Record<string, any> = {
  hero: {
    title: '🔥 Start Now\nJoin BNFX!',
    subtitle: 'Enable Your USDC Auto-Earning Mode!',
    description: 'Automated crypto trading with daily returns up to 15%. Join thousands of investors earning passive income with our AI-powered platform.',
    ctaPrimary: 'Start Earning',
    ctaSecondary: 'View Plans',
    backgroundImage: '',
    stats: [
      { label: 'Total Users', value: 12847, prefix: '', suffix: '+' },
      { label: 'Total Earned', value: 2450000, prefix: '$', suffix: '' },
      { label: 'Active Plans', value: 8456, prefix: '', suffix: '' },
    ],
  },
  stats: {
    title: 'Platform Statistics',
    subtitle: 'Real-time numbers that showcase the growth and trust in our platform.',
    items: [
      { label: 'Total Platform Users', value: 12847, prefix: '', suffix: '+', color: 'emerald' },
      { label: 'Total USDC Distributed', value: 5280000, prefix: '$', suffix: '+', color: 'amber' },
      { label: 'Active Investments', value: 8456, prefix: '', suffix: '', color: 'cyan' },
      { label: 'Countries Supported', value: 142, prefix: '', suffix: '+', color: 'emerald' },
    ],
  },
  footer: {
    companyName: 'BNFX',
    tagline: 'AI-Powered USDC Auto-Earning Platform',
    copyright: '© 2026 BNFX. All rights reserved.',
    links: [
      { label: 'Terms of Service', url: '#' },
      { label: 'Privacy Policy', url: '#' },
      { label: 'Contact Us', url: '#' },
    ],
    socials: [
      { platform: 'telegram', url: '#' },
      { platform: 'twitter', url: '#' },
      { platform: 'discord', url: '#' },
    ],
  },
  navbar: {
    logoText: 'BNFX',
    logoImage: '',
    links: [
      { label: 'Home', href: '#home' },
      { label: 'Plans', href: '#plans' },
      { label: 'Referral', href: '#referral' },
      { label: 'Leaderboard', href: '/leaderboard' },
    ],
  },
}

export async function GET() {
  try {
    const sections = await db.landingSection.findMany({ orderBy: { sortOrder: 'asc' } })

    // Merge with defaults for any missing sections
    const result: Record<string, any> = {}
    for (const [key, defaultContent] of Object.entries(DEFAULT_SECTIONS)) {
      const existing = sections.find(s => s.sectionKey === key)
      if (existing) {
        result[key] = {
          ...defaultContent,
          ...(existing.content ? JSON.parse(existing.content) : {}),
          title: existing.title || defaultContent.title,
          subtitle: existing.subtitle || defaultContent.subtitle,
          isVisible: existing.isVisible,
          sortOrder: existing.sortOrder,
        }
      } else {
        result[key] = { ...defaultContent, isVisible: true, sortOrder: 0 }
      }
    }

    // Include any custom sections not in defaults
    for (const section of sections) {
      if (!DEFAULT_SECTIONS[section.sectionKey]) {
        result[section.sectionKey] = {
          ...(section.content ? JSON.parse(section.content) : {}),
          title: section.title,
          subtitle: section.subtitle,
          isVisible: section.isVisible,
          sortOrder: section.sortOrder,
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get landing content error:', error)
    return NextResponse.json(DEFAULT_SECTIONS)
  }
}
