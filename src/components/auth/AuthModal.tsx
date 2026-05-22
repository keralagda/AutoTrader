'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, User, Gift, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAppStore, type UserData } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// ─── Animation variants ──────────────────────────────────────────────────────

const formVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

// ─── Login Form ──────────────────────────────────────────────────────────────

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { setAuthMode, login, setShowAuthModal } = useAppStore()
  const { toast } = useToast()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      if (!email.trim()) {
        setError('Email is required')
        return
      }
      if (!password) {
        setError('Password is required')
        return
      }

      setIsLoading(true)

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Login failed')
          toast({
            title: 'Login Failed',
            description: data.error || 'Invalid credentials',
            variant: 'destructive',
          })
          return
        }

        // Handle 2FA requirement
        if (data.requires2FA) {
          toast({ title: '2FA Required', description: 'Please enter your 2FA code' })
          // Store temp token for 2FA verification
          localStorage.setItem('autotrade_2fa_token', data.tempToken)
          return
        }

        // Login successful - redirect to appropriate dashboard
        const userData = data.user
        login(userData as UserData)
        toast({
          title: 'Welcome back!',
          description: `Signed in as ${userData.name}`,
        })
        setShowAuthModal(false)

        // Redirect based on role
        if (userData.role === 'admin') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/dashboard'
        }
      } catch {
        const msg = 'Network error. Please try again.'
        setError(msg)
        toast({
          title: 'Connection Error',
          description: msg,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, login, setAuthMode, setShowAuthModal, toast]
  )

  return (
    <motion.div
      key="login-form"
      custom={1}
      variants={formVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-sm text-muted-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-11"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-sm text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-11"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => {
              toast({
                title: 'Password Reset',
                description: 'Contact admin or use the Security tab after login to change your password.',
              })
            }}
            className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-rose-400 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-300"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              Login
              <ArrowRight className="size-4 ml-1" />
            </>
          )}
        </Button>

        {/* Switch to register */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Register
          </button>
        </p>
      </form>
    </motion.div>
  )
}

// ─── Register Form ───────────────────────────────────────────────────────────

function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { setAuthMode, login, setShowAuthModal } = useAppStore()
  const { toast } = useToast()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      // Validation
      if (!name.trim()) {
        setError('Name is required')
        return
      }
      if (!email.trim()) {
        setError('Email is required')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      setIsLoading(true)

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            referralCode: referralCode.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Registration failed')
          toast({
            title: 'Registration Failed',
            description: data.error || 'Could not create account',
            variant: 'destructive',
          })
          return
        }

        const userData = data.user
        login(userData as UserData)
        toast({
          title: 'Account Created!',
          description: `Welcome, ${userData.name}!`,
        })
        setShowAuthModal(false)
        window.location.href = '/dashboard'
      } catch {
        const msg = 'Network error. Please try again.'
        setError(msg)
        toast({
          title: 'Connection Error',
          description: msg,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [name, email, password, confirmPassword, referralCode, login, setAuthMode, setShowAuthModal, toast]
  )

  return (
    <motion.div
      key="register-form"
      custom={-1}
      variants={formVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="reg-name" className="text-sm text-muted-foreground">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-11"
              disabled={isLoading}
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="reg-email" className="text-sm text-muted-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-11"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="reg-password" className="text-sm text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-11"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="reg-confirm" className="text-sm text-muted-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-confirm"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError('')
              }}
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-11"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <Label htmlFor="reg-referral" className="text-sm text-muted-foreground">
            Referral Code{' '}
            <span className="text-muted-foreground/60">(optional)</span>
          </Label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-referral"
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value)
                setError('')
              }}
              className="pl-10 bg-secondary/50 border-border/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-11"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-rose-400 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-300"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="size-4 ml-1" />
            </>
          )}
        </Button>

        {/* Switch to login */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Login
          </button>
        </p>
      </form>
    </motion.div>
  )
}

// ─── AuthModal (main export) ─────────────────────────────────────────────────

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode } = useAppStore()

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setShowAuthModal(open)
      if (!open) {
        // Reset mode to login when modal closes
        setTimeout(() => setAuthMode('login'), 200)
      }
    },
    [setShowAuthModal, setAuthMode]
  )

  return (
    <Dialog open={showAuthModal} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-emerald-500/5 p-0 overflow-hidden"
        showCloseButton
      >
        {/* Decorative top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400" />

        <div className="p-6 pt-5">
          {/* Header */}
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-center">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Auto Trade
              </span>
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {authMode === 'login'
                ? 'Sign in to your account'
                : 'Create a new account'}
            </DialogDescription>
          </DialogHeader>

          {/* Tab indicators */}
          <div className="flex mb-6 bg-secondary/50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                authMode === 'login'
                  ? 'bg-emerald-600/20 text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                authMode === 'register'
                  ? 'bg-emerald-600/20 text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          {/* Animated form container */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={authMode === 'login' ? 1 : -1}>
              {authMode === 'login' ? (
                <LoginForm key="login" />
              ) : (
                <RegisterForm key="register" />
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
