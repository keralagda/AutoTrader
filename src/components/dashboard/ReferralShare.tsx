'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Copy, Check, Share2, MessageCircle, Send } from 'lucide-react'

export function ReferralShare() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const referralCode = user?.referralCode || ''
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${referralCode}`
    : `https://autotrade.app?ref=${referralCode}`

  const shareMessage = `Join Auto Trade and start earning daily returns on your USDC investments! Use my referral code: ${referralCode}\n\n${referralLink}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast({ title: 'Referral link copied!' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
    window.open(url, '_blank')
  }

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Auto Trade and start earning daily returns!')}`
    window.open(url, '_blank')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Auto Trade - USDC Auto-Earning',
          text: shareMessage,
          url: referralLink,
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopy()
    }
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          Share & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Invite friends and earn referral bonuses on their deposits
        </p>

        {/* Referral Link */}
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="text-xs font-mono bg-muted/50"
          />
          <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            className="gap-1.5 text-xs bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTelegramShare}
            className="gap-1.5 text-xs bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
          >
            <Send className="h-3.5 w-3.5" />
            Telegram
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            className="gap-1.5 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
