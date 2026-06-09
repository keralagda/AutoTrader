'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Mic, X, Sparkles, Volume2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MagneticButton } from './landing/MagneticButton'

interface VoiceCommand {
  id: string
  keywords: string[]
  actionType: 'navigation' | 'auth_modal'
  view?: 'landing' | 'dashboard' | 'admin'
  dashboardTab?: string
  adminTab?: string
  hash?: string
  authMode?: 'login' | 'register'
  feedbackText: string
  requiredRole: 'public' | 'user' | 'admin'
  isActive: boolean
  description: string
}

interface VoiceSettings {
  enabled: boolean
  rate: number
  pitch: number
  triggerKey: string
}

export function VoiceNavigator() {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  
  // Dynamic settings
  const [commands, setCommands] = useState<VoiceCommand[]>([])
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: true,
    rate: 1.0,
    pitch: 1.0,
    triggerKey: 'v'
  })

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
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = voiceSettings.rate
      utterance.pitch = voiceSettings.pitch
      window.speechSynthesis.speak(utterance)
    }
  }

  // Load voice configurations dynamically from API
  useEffect(() => {
    const fetchVoiceConfig = async () => {
      try {
        const res = await fetch('/api/voice-commands')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setCommands(data.commands)
            setVoiceSettings(data.settings)
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic voice commands:', err)
      }
    }
    fetchVoiceConfig()
  }, [isAuthenticated, user])

  // Initialize Speech Recognition API
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
  }, [commands, voiceSettings])

  // Keypress listener for customizable trigger key shortcut
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

      const triggerKey = voiceSettings.triggerKey || 'v'
      if (e.key.toLowerCase() === triggerKey.toLowerCase()) {
        e.preventDefault()
        toggleListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSupported, isListening, voiceSettings])

  const toggleListening = () => {
    if (!isSupported) {
      toast({
        title: 'Voice navigation not supported',
        description: 'Your browser does not support the Web Speech API. Try Chrome or Safari.',
        variant: 'destructive',
      })
      return
    }

    if (!voiceSettings.enabled) {
      toast({
        title: 'Voice navigation disabled',
        description: 'Voice navigation settings are currently toggled off by administrator.',
        variant: 'destructive',
      })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setTranscript('Activating microphone...')
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

    if (!voiceSettings.enabled) {
      speakFeedback('Voice navigation is currently disabled.')
      return
    }

    // Match command dynamically
    const matched = commands.find(c => 
      c.keywords.some((kw: string) => cmd.includes(kw.toLowerCase()))
    )

    if (!matched) {
      speakFeedback(`Command not recognized: "${cmd}". Please try again.`)
      return
    }

    // Role & Authorization Checks
    if (matched.requiredRole === 'user' && !isAuthenticated) {
      // Premium Fallback check for unauthenticated users asking for referral team or plans info
      if (matched.keywords.some(k => ['referrals', 'affiliate', 'matrix', 'team'].includes(k))) {
        setView('landing')
        window.location.hash = '#referrals'
        const el = document.querySelector('#referrals')
        el?.scrollIntoView({ behavior: 'smooth' })
        speakFeedback('Scrolling to referral rewards information')
        return
      }
      if (matched.keywords.some(k => ['plans', 'packages', 'rates'].includes(k))) {
        setView('landing')
        window.location.hash = '#plans'
        const el = document.querySelector('#plans')
        el?.scrollIntoView({ behavior: 'smooth' })
        speakFeedback('Scrolling to our investment yields table')
        return
      }

      speakFeedback('Authentication required. Please sign in first.')
      return
    }

    if (matched.requiredRole === 'admin') {
      const isAdmin = ['admin', 'super_admin', 'moderator', 'support'].includes(user?.role || '')
      if (!isAdmin) {
        speakFeedback('Access denied. Administrator privileges required.')
        return
      }
    }

    // Action Execution
    if (matched.actionType === 'auth_modal') {
      setView('landing')
      setAuthMode(matched.authMode || 'login')
      setShowAuthModal(true)
    } else if (matched.actionType === 'navigation') {
      if (matched.view) setView(matched.view)

      if (matched.view === 'dashboard' && matched.dashboardTab) {
        setDashboardTab(matched.dashboardTab as any)
      } else if (matched.view === 'admin' && matched.adminTab) {
        setAdminTab(matched.adminTab as any)
      } else if (matched.view === 'landing' && matched.hash !== undefined) {
        window.location.hash = matched.hash
        const el = document.querySelector(matched.hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }

    speakFeedback(matched.feedbackText)
  }

  // Generate cues to display inside overlay
  const displayCues = commands.slice(0, 7)

  return (
    <>
      {/* Floating Activation Button in bottom-right corner */}
      <div className="fixed bottom-20 right-20 md:bottom-24 md:right-6 z-50">
        <MagneticButton
          onClick={toggleListening}
          className={`relative p-4 rounded-full flex items-center justify-center border shadow-xl backdrop-blur-md transition-all duration-300 ${
            isListening
              ? 'bg-amber-500 border-amber-400 text-black scale-110 shadow-amber-500/20'
              : 'bg-black/80 border-white/10 text-white hover:border-white/20'
          }`}
        >
          <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
          {/* Pulsing indicator tag */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isListening ? 'bg-black' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isListening ? 'bg-black' : 'bg-amber-500'}`}></span>
          </span>
          <span className="absolute right-14 bg-black/95 text-white/50 border border-white/[0.06] text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded shadow-md pointer-events-none select-none opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
            Press [{voiceSettings.triggerKey.toUpperCase()}]
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
                  SPEAK A CONFIGURABLE ROUTE COMMAND
                </p>
              </div>

              {/* Command Cue Suggestions Bento */}
              {displayCues.length > 0 && (
                <div className="border-t border-white/10 pt-6 space-y-3 text-left">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 mb-2">
                    Sample Voice Commands:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-white/60">
                    {displayCues.map(cue => (
                      <div key={cue.id} className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-amber-400 font-bold">&ldquo;{cue.keywords[0]}&rdquo;</span>
                        <ArrowRight className="h-3 w-3 opacity-30" />
                        <span className="text-white/30 text-[9px] truncate">{cue.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-white/30">
                <Volume2 className="h-3 w-3" />
                SPEECH ENGINE ONLINE
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
