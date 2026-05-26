'use client'

import { useT } from '@/hooks/use-translate'

// Simple translation component - wraps text and auto-translates based on locale
export function T({ children }: { children: string }) {
  const translated = useT(children)
  return <>{translated}</>
}
