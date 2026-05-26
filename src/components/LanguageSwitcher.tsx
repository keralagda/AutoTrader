'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { locales, getLocale, setLocale, detectLocaleFromGeoIP, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en')
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    const stored = getLocale()
    setCurrentLocale(stored)

    // Auto-detect on first visit (no stored preference)
    if (!localStorage.getItem('bnfx_locale') && !detected) {
      setDetected(true)
      detectLocaleFromGeoIP().then(detectedLocale => {
        if (detectedLocale !== 'en') {
          setLocale(detectedLocale)
          setCurrentLocale(detectedLocale)
          // Apply RTL if needed
          const info = locales.find(l => l.code === detectedLocale)
          if (info) {
            document.documentElement.dir = info.dir
            document.documentElement.lang = detectedLocale
          }
        }
      })
    }

    const handleChange = () => setCurrentLocale(getLocale())
    window.addEventListener('locale-changed', handleChange)
    return () => window.removeEventListener('locale-changed', handleChange)
  }, [])

  const handleSelect = (locale: Locale) => {
    setLocale(locale)
    setCurrentLocale(locale)
  }

  const current = locales.find(l => l.code === currentLocale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2">
          <span className="text-sm">{current?.flag || '🌐'}</span>
          <span className="hidden sm:inline text-xs">{current?.nativeName || 'English'}</span>
          <Globe className="h-3.5 w-3.5 sm:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] max-h-[300px] overflow-y-auto">
        {locales.map(locale => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleSelect(locale.code)}
            className={`gap-2 ${currentLocale === locale.code ? 'bg-primary/10 text-primary' : ''}`}
          >
            <span className="text-base">{locale.flag}</span>
            <span className="flex-1 text-sm">{locale.nativeName}</span>
            <span className="text-[10px] text-muted-foreground">{locale.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
