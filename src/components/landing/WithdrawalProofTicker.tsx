'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface Proof {
  id: string
  name: string
  amount: number
  method: string
  time: string
}

export function WithdrawalProofTicker() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/withdrawal-proofs')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setProofs(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (proofs.length === 0) return
    // Show a proof every 8 seconds
    const interval = setInterval(() => {
      setVisible(true)
      setTimeout(() => {
        setVisible(false)
        setTimeout(() => setCurrentIndex(prev => (prev + 1) % proofs.length), 500)
      }, 5000)
    }, 8000)
    // Show first one immediately
    setTimeout(() => setVisible(true), 2000)
    return () => clearInterval(interval)
  }, [proofs.length])

  if (proofs.length === 0) return null

  const current = proofs[currentIndex]
  const timeAgo = getTimeAgo(current.time)

  return (
    <div className={`fixed bottom-24 left-4 md:bottom-6 md:left-6 z-40 transition-all duration-500 ${visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
      <div className="flex items-center gap-3 bg-card/95 backdrop-blur-lg border border-emerald-500/20 rounded-xl px-4 py-3 shadow-xl shadow-emerald-500/5 max-w-[280px]">
        <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{current.name} withdrew</p>
          <p className="text-sm font-bold text-emerald-400">${current.amount.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
