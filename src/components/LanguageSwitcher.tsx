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
import { locales, getLocale, setLocale, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en')

  useEffect(() => {
    setCurrentLocale(getLocale())

    const handleChange = () => setCurrentLocale(getLocale())
    window.addEventListener('locale-changed', handleChange)
    return () => window.removeEventListener('locale-changed', handleChange)
  }, [])

  const handleSelect = (locale: Locale) => {
    setLocale(locale)
    setCurrentLocale(locale)
    // Force re-render by reloading (simple approach)
    window.location.reload()
  }

  const current = locales.find(l => l.code === currentLocale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">{current?.nativeName || 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {locales.map(locale => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleSelect(locale.code)}
            className={currentLocale === locale.code ? 'bg-primary/10 text-primary' : ''}
          >
            <span className="flex-1">{locale.nativeName}</span>
            <span className="text-xs text-muted-foreground">{locale.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
