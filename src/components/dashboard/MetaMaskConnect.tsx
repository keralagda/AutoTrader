'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Wallet, Link2, Unlink, Copy, Check } from 'lucide-react'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}

export function MetaMaskConnect() {
  const { user, updateUserProfile } = useAppStore()
  const { toast } = useToast()
  const [account, setAccount] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(false)

  useEffect(() => {
    setHasMetaMask(typeof window !== 'undefined' && !!window.ethereum?.isMetaMask)
    // Check if already connected
    if (user?.walletAddress) {
      setAccount(user.walletAddress)
    }
  }, [user?.walletAddress])

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast({ title: 'MetaMask not found', description: 'Please install MetaMask browser extension', variant: 'destructive' })
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    setConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        setAccount(address)

        // Save to user profile
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, walletAddress: address }),
        })
        if (res.ok) {
          updateUserProfile({ walletAddress: address })
          toast({ title: 'MetaMask Connected!', description: `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}` })
        }
      }
    } catch (err: any) {
      if (err.code === 4001) {
        toast({ title: 'Connection rejected', description: 'You rejected the MetaMask connection request', variant: 'destructive' })
      } else {
        toast({ title: 'Connection failed', description: err.message || 'Could not connect to MetaMask', variant: 'destructive' })
      }
    } finally {
      setConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    setAccount(null)
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, walletAddress: '' }),
    })
    updateUserProfile({ walletAddress: '' })
    toast({ title: 'Wallet disconnected' })
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (account) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-emerald-400 font-medium">MetaMask Connected</p>
          <p className="text-[11px] font-mono text-muted-foreground truncate">{account}</p>
        </div>
        <button onClick={copyAddress} className="p-1.5 hover:bg-muted rounded">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        <button onClick={disconnectWallet} className="p-1.5 hover:bg-rose-500/10 rounded" title="Disconnect">
          <Unlink className="h-3.5 w-3.5 text-rose-400" />
        </button>
      </div>
    )
  }

  return (
    <Button
      onClick={connectMetaMask}
      disabled={connecting}
      variant="outline"
      className="w-full gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
    >
      {connecting ? (
        <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {connecting ? 'Connecting...' : hasMetaMask ? 'Connect MetaMask' : 'Install MetaMask'}
    </Button>
  )
}
