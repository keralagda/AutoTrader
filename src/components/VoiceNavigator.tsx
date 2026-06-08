'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Mic, MicOff, X, Sparkles, Volume2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MagneticButton } from './landing/MagneticButton'

export function VoiceNavigator() {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  
  const {
    setView,
    setDashboardTab,
    setAdminTab,
    setShowAuthModal,
    setAuthMode,
    isAuthenticated,
    user,
  } = useAppStore()

  const recognitionRef = useRef<any>(null)

  // Voice output feedback
  const speakFeedback = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = 'en-US'

        rec.onstart = () => {
          setTranscript('Listening for commands...')
        }

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e.error)
          if (e.error === 'no-speech') {
            setTranscript('No speech detected. Please try again.')
          } else {
            setTranscript('Listening error occurred.')
          }
          setIsListening(false)
        }

        rec.onend = () => {
          setIsListening(false)
        }

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript
          setTranscript(text)
          processVoiceCommand(text)
        }

        recognitionRef.current = rec
      }
    }
  }, [isAuthenticated, user])

  // Keypress listener for 'v' key shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent triggering if user is actively writing in form inputs
      const activeEl = document.activeElement
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return
      }

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        toggleListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSupported, isListening])

  const toggleListening = () => {
    if (!isSupported) {
      toast({
        title: 'Voice navigation not supported',
        description: 'Your browser does not support the Web Speech API. Try Chrome or Safari.',
        variant: 'destructive',
      })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setTranscript('Activating micro...')
      try {
        recognitionRef.current?.start()
        setIsListening(true)
        speakFeedback('System listening')
      } catch (err) {
        console.error(err)
      }
    }
  }

  const processVoiceCommand = (commandText: string) => {
    const cmd = commandText.toLowerCase().trim()
    console.log('Voice Command Received:', cmd)

    // 1. PUBLIC LANDING MENU
    if (cmd.includes('home') || cmd.includes('landing') || cmd.includes('main')) {
      setView('landing')
      window.location.hash = ''
      speakFeedback('Navigating to home page')
      return
    }
    if (cmd.includes('features') || cmd.includes('pillars')) {
      setView('landing')
      window.location.hash = '#features'
      speakFeedback('Scrolling to platform features')
      return
    }
    if (cmd.includes('calculator') || cmd.includes('returns engine')) {
      setView('landing')
      window.location.hash = '#calculator'
      speakFeedback('Scrolling to return calculator')
      return
    }
    if (cmd.includes('login') || cmd.includes('sign in')) {
      setView('landing')
      setAuthMode('login')
      setShowAuthModal(true)
      speakFeedback('Opening sign in modal')
      return
    }
    if (cmd.includes('register') || cmd.includes('sign up') || cmd.includes('create account')) {
      setView('landing')
      setAuthMode('register')
      setShowAuthModal(true)
      speakFeedback('Opening sign up modal')
      return
    }

    // 2. USER DASHBOARD LINKS (Requires Auth)
    if (cmd.includes('withdraw') || cmd.includes('payout')) {
      if (!isAuthenticated) {
        speakFeedback('Authentication required. Please sign in first.')
        return
      }
      setView('dashboard')
      setDashboardTab('withdraw')
      speakFeedback('Navigating to withdrawals')
      return
    }
    if (cmd.includes('deposit') || cmd.includes('invest')) {
      if (!isAuthenticated) {
        speakFeedback('Authentication required. Please sign in first.')
        return
      }
      setView('dashboard')
      setDashboardTab('deposit')
      speakFeedback('Navigating to deposits')
      return
    }
    if (cmd.includes('transfer') || cmd.includes('p2p')) {
      if (!isAuthenticated) {
        speakFeedback('Authentication required. Please sign in first.')
        return
      }
      setView('dashboard')
      setDashboardTab('transactions')
      speakFeedback('Navigating to transfer tab')
      return
    }
    if (cmd.includes('security') || cmd.includes('settings') || cmd.includes('profile')) {
      if (!isAuthenticated) {
        speakFeedback('Authentication required. Please sign in first.')
        return
      }
      setView('dashboard')
      setDashboardTab('security')
      speakFeedback('Navigating to security settings')
      return
    }
    if (cmd.includes('referrals') || cmd.includes('affiliate') || cmd.includes('matrix')) {
      if (isAuthenticated) {
        setView('dashboard')
        setDashboardTab('team')
        speakFeedback('Navigating to affiliate matrix')
      } else {
        setView('landing')
        window.location.hash = '#referrals'
        speakFeedback('Scrolling to affiliate info')
      }
      return
    }
    if (cmd.includes('plans')) {
      if (isAuthenticated) {
        setView('dashboard')
        setDashboardTab('investment')
        speakFeedback('Navigating to your active plans')
      } else {
        setView('landing')
        window.location.hash = '#plans'
        speakFeedback('Scrolling to investment plans')
      }
      return
    }
    if (cmd.includes('dashboard') || cmd.includes('overview')) {
      if (!isAuthenticated) {
        speakFeedback('Authentication required. Please sign in first.')
        return
      }
      setView('dashboard')
      setDashboardTab('overview')
      speakFeedback('Navigating to user dashboard overview')
      return
    }

    // 3. ADMIN DASHBOARD LINKS (Requires Admin Role)
    const isAdmin = ['admin', 'super_admin', 'moderator', 'support'].includes(user?.role || '')
    
    if (cmd.includes('admin') || cmd.includes('control hub')) {
      if (!isAdmin) {
        speakFeedback('Access denied. Administrator privileges required.')
        return
      }
      setView('admin')
      setAdminTab('plans')
      speakFeedback('Navigating to admin control hub')
      return
    }
    if (cmd.includes('users list') || cmd.includes('users') || cmd.includes('manage users')) {
      if (!isAdmin) {
        speakFeedback('Access denied.')
        return
      }
      setView('admin')
      setAdminTab('users')
      speakFeedback('Navigating to user accounts manager')
      return
    }
    if (cmd.includes('manage plans') || cmd.includes('plan config')) {
      if (!isAdmin) {
        speakFeedback('Access denied.')
        return
      }
      setView('admin')
      setAdminTab('plans')
      speakFeedback('Navigating to plan builder configuration')
      return
    }
    if (cmd.includes('system logic') || cmd.includes('logic builder') || cmd.includes('logic')) {
      if (!isAdmin) {
        speakFeedback('Access denied.')
        return
      }
      setView('admin')
      setAdminTab('logicBuilder')
      speakFeedback('Navigating to system conditional logic builder')
      return
    }
    if (cmd.includes('templates') || cmd.includes('landing page templates')) {
      if (!isAdmin) {
        speakFeedback('Access denied.')
        return
      }
      setView('admin')
      setAdminTab('templates')
      speakFeedback('Navigating to landing page layout templates')
      return
    }
    if (cmd.includes('bot') || cmd.includes('telegram')) {
      if (!isAdmin) {
        speakFeedback('Access denied.')
        return
      }
      setView('admin')
      setAdminTab('chatbot')
      speakFeedback('Navigating to telegram bot builder')
      return
    }

    // Command not matched
    speakFeedback("Command not recognized: '" + cmd + "'. Try again.")
  }

  return (
    <>
      {/* Floating Activation Button in bottom-right corner */}
      <div className="fixed bottom-24 right-6 z-50">
        <MagneticButton
          onClick={toggleListening}
          className={`relative p-4 rounded-full flex items-center justify-center border shadow-xl backdrop-blur-md transition-all duration-300 ${
            isListening
              ? 'bg-amber-500 border-amber-400 text-black scale-110 shadow-amber-500/20'
              : 'bg-black/80 border-white/10 text-white hover:border-white/20'
          }`}
        >
          {isListening ? (
            <Mic className="h-5 w-5 animate-pulse" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
          {/* Pulsing indicator tag */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isListening ? 'bg-black' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isListening ? 'bg-black' : 'bg-amber-500'}`}></span>
          </span>
          <span className="absolute right-14 bg-black/95 text-white/50 border border-white/[0.06] text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded shadow-md pointer-events-none select-none opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
            Press [V]
          </span>
        </MagneticButton>
      </div>

      {/* Glassmorphic Full-Screen Listening Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6 select-none"
          >
            {/* Close trigger */}
            <div className="absolute inset-0" onClick={toggleListening} />

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg rounded-3xl bg-[#0a0a0a]/90 border border-white/10 p-8 text-center space-y-6 shadow-2xl z-10"
            >
              <button
                onClick={toggleListening}
                className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                Sovereign Voice Navigator
              </div>

              {/* Pulsing Concentric Sound Waves */}
              <div className="relative flex items-center justify-center py-8">
                <div className="absolute w-36 h-36 rounded-full bg-amber-500/5 border border-amber-500/10 animate-ping duration-[2s]" />
                <div className="absolute w-28 h-28 rounded-full bg-amber-500/10 border border-amber-500/20 animate-ping" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Mic className="h-8 w-8 animate-pulse" />
                </div>
              </div>

              {/* Real-time speech response feedback */}
              <div className="space-y-2">
                <p className="text-xl font-bold font-mono text-white tracking-tight break-words">
                  &ldquo;{transcript}&rdquo;
                </p>
                <p className="text-xs text-white/40 font-mono">
                  SPEAK A ROUTE DIRECTION KEYWORD
                </p>
              </div>

              {/* Command Cue Suggestions Bento */}
              <div className="border-t border-white/10 pt-6 space-y-3 text-left">
                <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 mb-2">
                  System Commands Library:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-white/60">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-amber-400 font-bold">&ldquo;Home&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-30" />
                    <span className="text-white/30 text-[10px]">Landing</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-amber-400 font-bold">&ldquo;Plans&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-30" />
                    <span className="text-white/30 text-[10px]">Rates Grid</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-amber-400 font-bold">&ldquo;Calculator&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-30" />
                    <span className="text-white/30 text-[10px]">Yield Tool</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-amber-400 font-bold">&ldquo;Deposit&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-30" />
                    <span className="text-white/30 text-[10px]">Add Funds</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-amber-400 font-bold">&ldquo;Withdraw&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-30" />
                    <span className="text-white/30 text-[10px]">Cashout</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-amber-400 font-bold">&ldquo;Settings&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-30" />
                    <span className="text-white/30 text-[10px]">Security</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] col-span-2">
                    <span className="text-amber-400 font-bold">&ldquo;Admin&rdquo; / &ldquo;Users&rdquo;</span>
                    <ArrowRight className="h-3 w-3 opacity-30" />
                    <span className="text-white/30 text-[10px]">Control Hub (Admin Only)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-white/30">
                <Volume2 className="h-3 w-3" />
                SPEECH RESPONSE IS ACTIVE
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
