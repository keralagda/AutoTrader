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

export const BLOCK_DEFINITIONS: Record<BlockType, { label: string; icon: string; description: string; defaultContent: Record<string, any> }> = {
  heading: {
    label: 'Heading',
    icon: '📝',
    description: 'Title or heading text',
    defaultContent: { text: 'New Heading', level: 'h2' },
  },
  text: {
    label: 'Text / Paragraph',
    icon: '📄',
    description: 'Rich text paragraph',
    defaultContent: { text: 'Enter your text here...' },
  },
  image: {
    label: 'Image',
    icon: '🖼️',
    description: 'Single image with optional caption',
    defaultContent: { src: '', alt: '', caption: '' },
  },
  button: {
    label: 'Button',
    icon: '🔘',
    description: 'Call-to-action button',
    defaultContent: { text: 'Click Me', url: '#', variant: 'primary', size: 'md' },
  },
  spacer: {
    label: 'Spacer',
    icon: '↕️',
    description: 'Vertical spacing',
    defaultContent: { height: '40px' },
  },
  divider: {
    label: 'Divider',
    icon: '➖',
    description: 'Horizontal line separator',
    defaultContent: { style: 'solid', color: '#333' },
  },
  columns: {
    label: 'Columns',
    icon: '▥',
    description: '2-4 column layout',
    defaultContent: { count: 2 },
  },
  card: {
    label: 'Card',
    icon: '🃏',
    description: 'Content card with title, text, image',
    defaultContent: { title: 'Card Title', text: 'Card description', image: '', link: '' },
  },
  hero: {
    label: 'Hero Section',
    icon: '🦸',
    description: 'Full-width hero with headline and CTA',
    defaultContent: { headline: 'Hero Headline', subtitle: 'Subtitle text', ctaText: 'Get Started', ctaUrl: '#', backgroundImage: '' },
  },
  features: {
    label: 'Features Grid',
    icon: '⭐',
    description: 'Feature cards in a grid',
    defaultContent: { items: [{ icon: '🚀', title: 'Feature 1', text: 'Description' }, { icon: '💎', title: 'Feature 2', text: 'Description' }, { icon: '🔒', title: 'Feature 3', text: 'Description' }] },
  },
  testimonial: {
    label: 'Testimonial',
    icon: '💬',
    description: 'Customer testimonial quote',
    defaultContent: { quote: 'Great platform!', author: 'John Doe', role: 'Investor', avatar: '' },
  },
  pricing: {
    label: 'Pricing Table',
    icon: '💰',
    description: 'Pricing plan card',
    defaultContent: { name: 'Pro Plan', price: '$99', period: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], ctaText: 'Subscribe', highlighted: false },
  },
  cta: {
    label: 'Call to Action',
    icon: '📢',
    description: 'CTA banner with button',
    defaultContent: { headline: 'Ready to start?', text: 'Join thousands of investors', buttonText: 'Sign Up Now', buttonUrl: '#' },
  },
  video: {
    label: 'Video Embed',
    icon: '🎬',
    description: 'YouTube or video embed',
    defaultContent: { url: '', type: 'youtube' },
  },
  'icon-box': {
    label: 'Icon Box',
    icon: '📦',
    description: 'Icon with title and text',
    defaultContent: { icon: '🎯', title: 'Title', text: 'Description' },
  },
  stats: {
    label: 'Statistics',
    icon: '📊',
    description: 'Number statistics row',
    defaultContent: { items: [{ value: '10K+', label: 'Users' }, { value: '$5M+', label: 'Invested' }, { value: '99%', label: 'Uptime' }] },
  },
  faq: {
    label: 'FAQ',
    icon: '❓',
    description: 'Frequently asked questions',
    defaultContent: { items: [{ question: 'How does it work?', answer: 'Answer here...' }] },
  },
  html: {
    label: 'Custom HTML',
    icon: '🧩',
    description: 'Raw HTML/embed code',
    defaultContent: { code: '<div>Custom HTML</div>' },
  },
}
