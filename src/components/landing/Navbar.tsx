'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Diamond, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLandingContent } from './LandingPage'
import { t } from '@/lib/i18n'

const navLinks = [
  { key: 'nav.home' as const, href: '#home' },
  { key: 'nav.plans' as const, href: '#plans' },
  { key: 'nav.calculator' as const, href: '#calculator' },
  { key: 'nav.revenue' as const, href: '#referral' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const content = useLandingContent()
  const navContent = content.navbar || {}
  const { setShowAuthModal, setAuthMode } = useAppStore()
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const handleLocaleChange = () => forceUpdate(n => n + 1)
    window.addEventListener('locale-changed', handleLocaleChange)
    return () => window.removeEventListener('locale-changed', handleLocaleChange)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogin = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleRegister = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  const handleNavClick = (href: string) => {
    setIsMobileOpen(false)
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/bnfx-logo.svg" alt="BNFX" className="h-8 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              {navContent.logoText || 'BNFX'}
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
              >
                {t(link.key)}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogin}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('nav.login')}
            </Button>
            <Button
              size="sm"
              onClick={handleRegister}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >{t('nav.register')}</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="block w-full text-left text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  {t(link.key)}
                </button>
              ))}
              <div className="flex items-center justify-between pt-2 pb-1">
                <span className="text-xs text-muted-foreground">Language</span>
                <LanguageSwitcher />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogin}
                  className="flex-1"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleRegister}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                >{t('nav.register')}</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
