'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLocale } from '@/lib/i18n'

// Client-side translation cache
const clientCache: Record<string, string> = {}

export function useTranslate(texts: string[]): string[] {
  const [translated, setTranslated] = useState<string[]>(texts)
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    setLocale(getLocale())
    const handler = () => setLocale(getLocale())
    window.addEventListener('locale-changed', handler)
    return () => window.removeEventListener('locale-changed', handler)
  }, [])

  useEffect(() => {
    if (locale === 'en' || texts.length === 0) {
      setTranslated(texts)
      return
    }

    // Check client cache first
    const allCached = texts.every(t => clientCache[`${locale}:${t}`])
    if (allCached) {
      setTranslated(texts.map(t => clientCache[`${locale}:${t}`]))
      return
    }

    // Fetch translations from API
    const uncached = texts.filter(t => !clientCache[`${locale}:${t}`])
    if (uncached.length === 0) return

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: uncached, targetLang: locale }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.translations && Array.isArray(data.translations)) {
          // Cache results
          uncached.forEach((t, i) => {
            clientCache[`${locale}:${t}`] = data.translations[i] || t
          })
          // Update all texts
          setTranslated(texts.map(t => clientCache[`${locale}:${t}`] || t))
        }
      })
      .catch(() => {
        setTranslated(texts)
      })
  }, [locale, texts.join('|')])

  return translated
}

// Simple single-string translation hook
export function useT(text: string): string {
  const [result] = useTranslate([text])
  return result
}
