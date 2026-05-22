'use client'

import { useState } from 'react'
import { Diamond } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Plans', href: '#plans' },
  { label: 'About', href: '#about' },
  { label: 'Referral', href: '#referral' },
]

const socialLinks = [
  {
    label: 'Twitter',
    href: '#',
    icon: (
      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: '#',
    icon: (
      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: '#',
    icon: (
      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
      </svg>
    ),
  },
]

export default function Footer() {
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: string; title: string; content: string }>({
    open: false,
    type: '',
    title: '',
    content: '',
  })
  const [loadingLegal, setLoadingLegal] = useState(false)

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const openLegalDoc = async (type: string) => {
    setLoadingLegal(true)
    setLegalModal({ open: true, type, title: 'Loading...', content: '' })
    try {
      const res = await fetch(`/api/legal?type=${type}`)
      if (res.ok) {
        const data = await res.json()
        setLegalModal({ open: true, type, title: data.title, content: data.content })
      }
    } catch {
      setLegalModal({ open: true, type, title: 'Error', content: 'Failed to load document.' })
    } finally {
      setLoadingLegal(false)
    }
  }

  return (
    <>
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Diamond className="size-6 text-emerald-400 fill-emerald-400/30" />
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                  Auto Trade
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Automated crypto investment platform powered by AI. Earn daily returns with
                transparent distribution.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="size-10 rounded-lg bg-background/50 border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-200"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider">Quick Links</h4>
              <nav className="flex flex-col gap-2">
                {quickLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider">Legal</h4>
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => openLegalDoc('terms')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => openLegalDoc('privacy')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => openLegalDoc('risk')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Risk Disclaimer
                </button>
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Auto Trade. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-emerald-400 font-medium">Auto Trade Protocol</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Legal Document Modal */}
      <Dialog open={legalModal.open} onOpenChange={(open) => setLegalModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{legalModal.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose prose-sm prose-invert max-w-none">
              {legalModal.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-sm">{line.slice(2, -2)}</p>
                if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>
                if (line.trim() === '') return <br key={i} />
                return <p key={i} className="text-sm text-muted-foreground mb-1">{line}</p>
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
