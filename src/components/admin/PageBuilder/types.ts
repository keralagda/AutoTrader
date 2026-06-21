// Page Builder Types

export interface PageBlock {
  id: string
  type: BlockType
  content: Record<string, any>
  style: BlockStyle
  children?: PageBlock[] // For column/container blocks
}

export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'columns'
  | 'card'
  | 'hero'
  | 'features'
  | 'testimonial'
  | 'pricing'
  | 'cta'
  | 'video'
  | 'icon-box'
  | 'stats'
  | 'faq'
  | 'html'
  | 'countdown'
  | 'progress-bar'
  | 'tabs'
  | 'accordion'
  | 'gallery'
  | 'social-links'
  | 'map'
  | 'form'
  | 'alert'
  | 'badge-row'
  | 'logo-carousel'
  | 'team-member'
  | 'timeline'
  | 'comparison-table'
  | 'gifts-perks'

export interface BlockStyle {
  backgroundColor?: string
  textColor?: string
  padding?: string
  margin?: string
  borderRadius?: string
  textAlign?: 'left' | 'center' | 'right'
  maxWidth?: string
  animation?: string
}

export interface PageData {
  id: string
  name: string
  slug: string
  blocks: PageBlock[]
  published: boolean
  settings?: PageSettings
  createdAt?: string
  updatedAt?: string
}

export interface PageSettings {
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  customCSS?: string
  customJS?: string
  headerCode?: string
  footerCode?: string
}

export const BLOCK_DEFINITIONS: Record<BlockType, { label: string; icon: string; description: string; category: string; defaultContent: Record<string, any> }> = {
  heading: {
    label: 'Heading',
    icon: '📝',
    category: 'Basic',
    description: 'Title or heading text',
    defaultContent: { text: 'New Heading', level: 'h2' },
  },
  text: {
    label: 'Text / Paragraph',
    icon: '📄',
    category: 'Basic',
    description: 'Rich text paragraph',
    defaultContent: { text: 'Enter your text here...' },
  },
  image: {
    label: 'Image',
    icon: '🖼️',
    category: 'Media',
    description: 'Single image with optional caption',
    defaultContent: { src: '', alt: '', caption: '' },
  },
  button: {
    label: 'Button',
    icon: '🔘',
    category: 'Basic',
    description: 'Call-to-action button',
    defaultContent: { text: 'Click Me', url: '#', variant: 'primary', size: 'md' },
  },
  spacer: {
    label: 'Spacer',
    icon: '↕️',
    category: 'Layout',
    description: 'Vertical spacing',
    defaultContent: { height: '40px' },
  },
  divider: {
    label: 'Divider',
    icon: '➖',
    category: 'Layout',
    description: 'Horizontal line separator',
    defaultContent: { style: 'solid', color: '#333' },
  },
  columns: {
    label: 'Columns',
    icon: '▥',
    category: 'Layout',
    description: '2-4 column layout',
    defaultContent: { count: 2 },
  },
  card: {
    label: 'Card',
    icon: '🃏',
    category: 'Content',
    description: 'Content card with title, text, image',
    defaultContent: { title: 'Card Title', text: 'Card description', image: '', link: '' },
  },
  hero: {
    label: 'Hero Section',
    icon: '🦸',
    category: 'Sections',
    description: 'Full-width hero with headline and CTA',
    defaultContent: { headline: 'Hero Headline', subtitle: 'Subtitle text', ctaText: 'Get Started', ctaUrl: '#', backgroundImage: '' },
  },
  features: {
    label: 'Features Grid',
    icon: '⭐',
    category: 'Sections',
    description: 'Feature cards in a grid',
    defaultContent: { items: [{ icon: '🚀', title: 'Feature 1', text: 'Description' }, { icon: '💎', title: 'Feature 2', text: 'Description' }, { icon: '🔒', title: 'Feature 3', text: 'Description' }] },
  },
  testimonial: {
    label: 'Testimonial',
    icon: '💬',
    category: 'Content',
    description: 'Customer testimonial quote',
    defaultContent: { quote: 'Great platform!', author: 'John Doe', role: 'Investor', avatar: '' },
  },
  pricing: {
    label: 'Pricing Table',
    icon: '💰',
    category: 'Sections',
    description: 'Pricing plan card',
    defaultContent: { name: 'Pro Plan', price: '$99', period: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], ctaText: 'Subscribe', highlighted: false },
  },
  cta: {
    label: 'Call to Action',
    icon: '📢',
    category: 'Sections',
    description: 'CTA banner with button',
    defaultContent: { headline: 'Ready to start?', text: 'Join thousands of investors', buttonText: 'Sign Up Now', buttonUrl: '#' },
  },
  video: {
    label: 'Video Embed',
    icon: '🎬',
    category: 'Media',
    description: 'YouTube or video embed',
    defaultContent: { url: '', type: 'youtube' },
  },
  'icon-box': {
    label: 'Icon Box',
    icon: '📦',
    category: 'Content',
    description: 'Icon with title and text',
    defaultContent: { icon: '🎯', title: 'Title', text: 'Description' },
  },
  stats: {
    label: 'Statistics',
    icon: '📊',
    category: 'Sections',
    description: 'Number statistics row',
    defaultContent: { items: [{ value: '10K+', label: 'Users' }, { value: '$5M+', label: 'Invested' }, { value: '99%', label: 'Uptime' }] },
  },
  faq: {
    label: 'FAQ',
    icon: '❓',
    category: 'Content',
    description: 'Frequently asked questions',
    defaultContent: { items: [{ question: 'How does it work?', answer: 'Answer here...' }] },
  },
  html: {
    label: 'Custom HTML',
    icon: '🧩',
    category: 'Advanced',
    description: 'Raw HTML/embed code',
    defaultContent: { code: '<div>Custom HTML</div>' },
  },
  countdown: {
    label: 'Countdown Timer',
    icon: '⏰',
    category: 'Interactive',
    description: 'Countdown to a specific date',
    defaultContent: { targetDate: new Date(Date.now() + 7 * 86400000).toISOString(), title: 'Offer Ends In', style: 'flip' },
  },
  'progress-bar': {
    label: 'Progress Bar',
    icon: '📶',
    category: 'Interactive',
    description: 'Animated progress/skill bar',
    defaultContent: { items: [{ label: 'Trading Volume', value: 85, color: 'emerald' }, { label: 'User Satisfaction', value: 95, color: 'amber' }] },
  },
  tabs: {
    label: 'Tabs',
    icon: '📑',
    category: 'Interactive',
    description: 'Tabbed content sections',
    defaultContent: { items: [{ title: 'Tab 1', content: 'Content for tab 1' }, { title: 'Tab 2', content: 'Content for tab 2' }] },
  },
  accordion: {
    label: 'Accordion',
    icon: '🪗',
    category: 'Interactive',
    description: 'Collapsible content panels',
    defaultContent: { items: [{ title: 'Section 1', content: 'Expandable content here' }, { title: 'Section 2', content: 'More content' }] },
  },
  gallery: {
    label: 'Image Gallery',
    icon: '🎨',
    category: 'Media',
    description: 'Grid or masonry image gallery',
    defaultContent: { images: [], columns: 3, gap: '8px', layout: 'grid' },
  },
  'social-links': {
    label: 'Social Links',
    icon: '🔗',
    category: 'Content',
    description: 'Social media icon links',
    defaultContent: { links: [{ platform: 'twitter', url: '#' }, { platform: 'telegram', url: '#' }, { platform: 'discord', url: '#' }], style: 'icons' },
  },
  map: {
    label: 'Map Embed',
    icon: '🗺️',
    category: 'Media',
    description: 'Google Maps or location embed',
    defaultContent: { embedUrl: '', height: '300px' },
  },
  form: {
    label: 'Contact Form',
    icon: '📋',
    category: 'Interactive',
    description: 'Simple contact/lead form',
    defaultContent: { fields: [{ type: 'text', label: 'Name', required: true }, { type: 'email', label: 'Email', required: true }, { type: 'textarea', label: 'Message', required: false }], submitText: 'Send', successMessage: 'Thank you!' },
  },
  alert: {
    label: 'Alert / Notice',
    icon: '⚠️',
    category: 'Content',
    description: 'Info, warning, or success alert box',
    defaultContent: { type: 'info', title: 'Notice', message: 'Important information here', dismissible: false },
  },
  'badge-row': {
    label: 'Badge Row',
    icon: '🏷️',
    category: 'Content',
    description: 'Row of badges/tags/labels',
    defaultContent: { items: [{ text: 'Secure', color: 'emerald' }, { text: 'Fast', color: 'cyan' }, { text: 'Reliable', color: 'amber' }] },
  },
  'logo-carousel': {
    label: 'Logo Carousel',
    icon: '🎠',
    category: 'Sections',
    description: 'Partner/sponsor logo slider',
    defaultContent: { logos: [], speed: 'normal', title: 'Trusted By' },
  },
  'team-member': {
    label: 'Team Member',
    icon: '👤',
    category: 'Content',
    description: 'Team member profile card',
    defaultContent: { name: 'John Doe', role: 'CEO', avatar: '', bio: 'Short bio here', social: [] },
  },
  timeline: {
    label: 'Timeline',
    icon: '📅',
    category: 'Sections',
    description: 'Vertical timeline/roadmap',
    defaultContent: { items: [{ date: '2024', title: 'Launch', description: 'Platform launched' }, { date: '2025', title: 'Growth', description: '10K users' }] },
  },
  'comparison-table': {
    label: 'Comparison Table',
    icon: '📊',
    category: 'Sections',
    description: 'Feature comparison table',
    defaultContent: { headers: ['Feature', 'Basic', 'Pro'], rows: [['Support', '✓', '✓'], ['API Access', '✗', '✓']] },
  },
  'gifts-perks': {
    label: 'Gifts & Perks Builder',
    icon: '🎁',
    category: 'Content',
    description: 'Display leadership ranks, rewards, gifts, and matching perks',
    defaultContent: {
      title: 'Leadership Ranks, Gifts & Perks',
      description: 'Progress through our binary MLM milestones to unlock massive bonuses, luxury gifts, and special account privileges.',
      items: [
        { rank: 'Executive', reqVolume: '$1,000', gift: 'Nova Executive Writing Pen & Official Badge', perk: '5% binary pairing cap limit boost', badgeColor: 'emerald' },
        { rank: 'Manager', reqVolume: '$5,000', gift: 'Montblanc Luxury Set & Plaque', perk: '10% binary pairing cap limit boost', badgeColor: 'cyan' },
        { rank: 'Director', reqVolume: '$20,000', gift: 'VIP Leadership Retreat Invite', perk: '18k Gold Badge & Global Event Invites', badgeColor: 'purple' },
        { rank: 'President', reqVolume: '$100,000', gift: '18k Gold President Ring & Luxury Car Program', perk: 'Full priority broker access & VIP channels', badgeColor: 'amber' }
      ]
    }
  },
}
