'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore, type UserData } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, Shield, Cpu, Database, Network, ListChecks, Printer, 
  Terminal, ChevronRight, Lock, ArrowLeft, Layers, Sparkles 
} from 'lucide-react'

export default function BlueprintPage() {
  const { isAuthenticated, user, login, logout } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'features' | 'apis' | 'schema' | 'prompt'>('features')
  const router = useRouter()

  useEffect(() => {
    // Validate session and admin/staff role
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        if (data.authenticated && data.user) {
          const staffRoles = ['admin', 'super_admin', 'moderator', 'support']
          if (!staffRoles.includes(data.user.role)) {
            router.replace('/dashboard')
            return
          }
          login(data.user as UserData)
        } else {
          throw new Error('Not authenticated')
        }
      })
      .catch(() => {
        logout()
        router.replace('/?login=true')
      })
      .finally(() => setLoading(false))
  }, [router, login, logout])

  const handleExportPDF = () => {
    window.print()
  }

  if (loading || !isAuthenticated || !['admin', 'super_admin', 'moderator', 'support'].includes(user?.role || '')) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 animate-pulse">
            <Lock className="size-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Authenticating Stealth Console...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-[#b9c5d9] p-4 sm:p-8 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Print styles override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-section {
            display: block !important;
            page-break-after: always !important;
          }
          .print-card {
            border: 1px solid #ddd !important;
            background: transparent !important;
            box-shadow: none !important;
            color: black !important;
          }
          .print-title {
            color: black !important;
          }
          pre, code {
            background: #f4f4f4 !important;
            color: black !important;
            border: 1px solid #ccc !important;
            white-space: pre-wrap !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-black pointer-events-none no-print" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none no-print" />

      <div className="max-w-6xl mx-auto space-y-8 relative print-container">
        
        {/* Header Console */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-950/50 pb-6 no-print">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/control-hub" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="size-3" /> Back to Console
              </Link>
              <span className="text-muted-foreground">•</span>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                Stealth Clearance
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Shield className="size-8 text-emerald-400" /> Platform Blueprints & Spec
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Core specifications, database schemas, API maps, and site restoration instructions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="border-border/50 bg-card/50 text-foreground hover:bg-card flex items-center gap-2 text-xs">
              <Printer className="size-4" /> Export to PDF
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 border-b border-border/10 pb-4 no-print">
          <Button
            onClick={() => setActiveTab('features')}
            variant={activeTab === 'features' ? 'default' : 'ghost'}
            className={`text-xs px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'features' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ListChecks className="size-3.5" /> Platform Features
          </Button>
          <Button
            onClick={() => setActiveTab('apis')}
            variant={activeTab === 'apis' ? 'default' : 'ghost'}
            className={`text-xs px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'apis' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Cpu className="size-3.5" /> API Catalog
          </Button>
          <Button
            onClick={() => setActiveTab('schema')}
            variant={activeTab === 'schema' ? 'default' : 'ghost'}
            className={`text-xs px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'schema' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Database className="size-3.5" /> Database Models
          </Button>
          <Button
            onClick={() => setActiveTab('prompt')}
            variant={activeTab === 'prompt' ? 'default' : 'ghost'}
            className={`text-xs px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'prompt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Terminal className="size-3.5" /> Rebuild Prompt
          </Button>
        </div>

        {/* PRINT MODE CONTAINER - ALL sections render in print, but screen uses tab filters */}
        
        {/* Section 1: Platform Features */}
        <div className={`print-section ${activeTab !== 'features' ? 'no-print' : ''}`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 print-title">
              <ListChecks className="size-5 text-emerald-400" /> Platform Features Index
            </h2>
            <p className="text-xs text-muted-foreground">Functional list of features implemented across the BNFX codebase</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-emerald-950/40 bg-card/30 backdrop-blur-sm print-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2 print-title">
                  <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">👤</span> User Dashboard & Trading Suite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>• <strong>Overview Status</strong>: Displays VIP tier cards, total deposited, active plan type, dynamic calculations of total earnings, direct sponsor count, and total team size.</p>
                <p>• <strong>Live Earning Counter</strong>: An dynamic client-side ticker counting accrued trade profit live based on plan configurations.</p>
                <p>• <strong>Dual Wallet System</strong>: Sidebar menu hosting Collapsible <strong>Trading Wallet</strong> (where yields, stack increments deposit) and <strong>Withdrawal Wallet</strong> (where commission transfers go).</p>
                <p>• <strong>Deposit Console</strong>: Hosts payment modal forms for Bank Transfer, USDC Crypto Address Generation & Verification, and Razorpay API integration.</p>
                <p>• <strong>Investment Suite</strong>: Allows users to lock balances into plans, toggle auto-reinvest options, set compounds, and view detailed locked durations.</p>
                <p>• <strong>Staking Module</strong>: Principal staking locks with early withdrawal penalties and staking yields.</p>
                <p>• <strong>Trading Simulator & Signals</strong>: Simulated active charts with real-time trading terminals, AI market comment feeds, and signal updates.</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-950/40 bg-card/30 backdrop-blur-sm print-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2 print-title">
                  <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">🌳</span> Alliance Growth Network (MLM)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>• <strong>Binary Placement Placement Engine</strong>: Automatically routes new referrees to left/right legs based on sponsor preferences (Balanced, Left-Heavy, Right-Heavy, Cycle Fill).</p>
                <p>• <strong>Recursive Volume Carry-Forward</strong>: Instantly propagates deposit volumes (PV, BV, TV) up the binary parent structure to ancestors upon confirmation.</p>
                <p>• <strong>Pairing & Cycle Match Engines</strong>: Triggers weak-leg pairings or custom ratio cycles (e.g. 1:1 or 2:1) that flush out matched volumes and credit pairing bonuses to uplines.</p>
                <p>• <strong>Dynamic Role Promotion</strong>: Automatically tracks direct referral count, personal investment volume, leg volumes, and upgrades users to <strong>Leader</strong> status upon rank qualification.</p>
                <p>• <strong>Multi-Level Referral Depth Bounds</strong>: Dynamic arrays capped by the active plan's `registrationReferralLevels` depth (e.g., restricted to 1 level if database rules specify it, rather than hardcoded fallbacks).</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-950/40 bg-card/30 backdrop-blur-sm print-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2 print-title">
                  <span className="p-1 rounded bg-violet-500/10 text-violet-400">🛡️</span> Admin Console & Feature Builders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>• <strong>Advanced Plan Builder</strong>: Dynamic creator/modifier allowing setup of basic pricing variables, profit-sharing yields, early penalty options, and MLM configuration limits.</p>
                <p>• <strong>Optional Subscription Splits</strong>: Built-in Switch toggle to activate or deactivate entry activation fee distributions. Hides and bypasses 100% splits validation checks when disabled.</p>
                <p>• <strong>Profits Distribution Control</strong>: Manual profit yield executor, custom logic rules injector, and daily cron trigger simulations.</p>
                <p>• <strong>Systems Performance & Auditor</strong>: Real-time diagnostic tool listing warning flags if a plan's profit sharing configurations drift from the 100% total rule or if bounds are broken.</p>
                <p>• <strong>SMTP Fallback & Email Bridge Rotation</strong>: Admin page overrides that route user notifications through backup server rotations, Proton Bridge networks, or Vercel/Resend API keys.</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-950/40 bg-card/30 backdrop-blur-sm print-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2 print-title">
                  <span className="p-1 rounded bg-rose-500/10 text-rose-400">🎯</span> Gamification & Internal Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>• <strong>Nova Points & Rewards Store</strong>: Collects screen-time points (NP) and permits redemption for prizes (e.g. Lucky Spin weights or store rewards) via database logs.</p>
                <p>• <strong>Geoblocking & KYCs</strong>: Restricts platform entry by region and provides verification dashboards for KYC document reviews.</p>
                <p>• <strong>Bulk Actions & Data Reset</strong>: Comprehensive control panel to simulate data resets, mock fake users, generate logs, or clean caches.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 2: API Catalog */}
        <div className={`print-section ${activeTab !== 'apis' ? 'no-print' : ''}`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 print-title">
              <Cpu className="size-5 text-emerald-400" /> Platform REST API Catalog
            </h2>
            <p className="text-xs text-muted-foreground">Mapping of backend routing controllers and parameters</p>
          </div>
          <Card className="border-emerald-950/40 bg-card/30 backdrop-blur-sm print-card">
            <CardContent className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="py-2 pr-4">Method</th>
                    <th className="py-2 pr-4">Endpoint</th>
                    <th className="py-2 pr-4">Purpose</th>
                    <th className="py-2 pr-4">Request / Payload Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  <tr>
                    <td className="py-2"><Badge variant="default" className="bg-emerald-500/20 text-emerald-400">GET</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/auth/session</td>
                    <td className="py-2">Retrieves session authentication state and user parameters.</td>
                    <td className="py-2 text-muted-foreground font-mono">None</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">POST</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/auth/login</td>
                    <td className="py-2">Authenticates users and starts sessions.</td>
                    <td className="py-2 text-muted-foreground font-mono">{"{ email, password }"}</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">POST</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/plan-activation</td>
                    <td className="py-2">Charges activation fee, verifies KYC, and activates MLM structures if enabled.</td>
                    <td className="py-2 text-muted-foreground font-mono">{"{ userId, planId }"}</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="default" className="bg-emerald-500/20 text-emerald-400">GET</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/earnings</td>
                    <td className="py-2">Returns historical earnings list and dynamic all-time sums by type.</td>
                    <td className="py-2 text-muted-foreground font-mono">?userId=X&t=timestamp</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">POST</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/admin/plans</td>
                    <td className="py-2">Creates a new investment/MLM plan blueprint.</td>
                    <td className="py-2 text-muted-foreground font-mono">Plan fields JSON payload</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="secondary" className="bg-sky-500/20 text-sky-400">PUT</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/admin/plans</td>
                    <td className="py-2">Updates an existing plan and sanitizes non-schema relation/UI flags.</td>
                    <td className="py-2 text-muted-foreground font-mono">{"{ id, ...updates }"}</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">POST</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/cron/distribute-profits</td>
                    <td className="py-2">Triggers automated yield distribution, referral matching, and binary cycles.</td>
                    <td className="py-2 text-muted-foreground font-mono">Header: x-cron-secret</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="default" className="bg-emerald-500/20 text-emerald-400">GET</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/team</td>
                    <td className="py-2">Returns referral downline depth maps and yield percentages.</td>
                    <td className="py-2 text-muted-foreground font-mono">?userId=X</td>
                  </tr>
                  <tr>
                    <td className="py-2"><Badge variant="secondary" className="bg-rose-500/20 text-rose-400 border-rose-500/30">DELETE</Badge></td>
                    <td className="py-2 font-mono font-bold">/api/admin/plans</td>
                    <td className="py-2">Deletes a plan (or deactivates it if active deposits are linked).</td>
                    <td className="py-2 text-muted-foreground font-mono">{"{ id }"}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Database Schema */}
        <div className={`print-section ${activeTab !== 'schema' ? 'no-print' : ''}`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 print-title">
              <Database className="size-5 text-emerald-400" /> Prisma SSoT Schema Specification
            </h2>
            <p className="text-xs text-muted-foreground">Unified schemas derived from `prisma/schema.prisma` single source of truth</p>
          </div>
          <Card className="border-emerald-950/40 bg-card/30 backdrop-blur-sm print-card">
            <CardContent className="p-4">
              <pre className="text-xs font-mono bg-black/40 text-emerald-300 p-4 rounded-lg overflow-x-auto leading-relaxed border border-emerald-950/50 print-card">
{`model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  name                  String
  phone                 String?
  passwordHash          String
  role                  String   @default("user") // "user", "leader", "admin", "super_admin"
  isActive              Boolean  @default(false)
  tradingBalance        Float    @default(0)
  withdrawalBalance     Float    @default(0)
  totalEarnings         Float    @default(0)
  totalDeposited        Float    @default(0)
  referralCode          String   @unique
  referredById          String?
  binaryTreePosition    String   @default("")     // "L" or "R" relative to parent
  binaryTreeParentId    String?
  binaryTreeLeftChildId String?
  binaryTreeRightChildId String?
  binaryTreeLeftVolume  Float    @default(0)
  binaryTreeRightVolume Float    @default(0)
  binaryTreeLeftVolumeCarryForward Float @default(0)
  binaryTreeRightVolumeCarryForward Float @default(0)
  autoUpgradeEnabled    Boolean  @default(false)
  autoUpgradePercent    Float    @default(0)
  autoUpgradeAccumulated Float   @default(0)
  autoUpgradeTargetPlanId String?
}

model Plan {
  id                    String   @id @default(cuid())
  name                  String
  entryFee              Float    @default(0)
  minDeposit            Float    @default(0)
  maxDeposit            Float    @default(0)
  dailyEarningPercent   Float    @default(0)
  maxEarningLimit       Float    @default(0)
  durationDays          Int      @default(0)
  isBinaryMlmEnabled    Boolean  @default(false)
  isLeadershipEligible  Boolean  @default(true)
  isSubscriptionDistributionEnabled Boolean @default(false)
  subscriptionReferralPercent Float @default(80)
  subscriptionRewardsPercent  Float @default(15)
  subscriptionPlatformPercent Float @default(5)
  referralRules         PlanReferralRule[]
  pairingRules          PlanPairingRule[]
}

model Deposit {
  id                    String   @id @default(cuid())
  userId                String
  planId                String
  amount                Float
  status                String   // "active", "locked", "completed"
  earnedSoFar           Float    @default(0)
  lockedUntil           DateTime?
  createdAt             DateTime @default(now())
}

model Earning {
  id                    String   @id @default(cuid())
  userId                String
  depositId             String?
  amount                Float
  type                  String   // "referral", "profit_share", "bonus", "daily", "subtract"
  level                 Int?
  walletTarget          String   @default("trading") // "trading" or "withdrawal"
  createdAt             DateTime @default(now())
}`}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Rebuild Prompt */}
        <div className={`print-section ${activeTab !== 'prompt' ? 'no-print' : ''}`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 print-title">
              <Terminal className="size-5 text-emerald-400" /> Platform Rebuild Prompt Blueprint
            </h2>
            <p className="text-xs text-muted-foreground">Comprehensive system prompt to regenerate this entire application from scratch in future AI environments</p>
          </div>
          <Card className="border-emerald-950/40 bg-card/30 backdrop-blur-sm print-card">
            <CardContent className="p-4">
              <div className="relative">
                <Button 
                  onClick={() => {
                    const promptText = document.getElementById('rebuild-prompt-content')?.innerText
                    if (promptText) {
                      navigator.clipboard.writeText(promptText)
                      alert('Rebuild prompt copied to clipboard!')
                    }
                  }}
                  className="absolute top-2 right-2 text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 no-print"
                  size="sm"
                >
                  Copy Prompt
                </Button>
                <div 
                  id="rebuild-prompt-content" 
                  className="text-xs font-mono bg-black/40 text-[#c2d0e6] p-4 rounded-lg overflow-y-auto leading-relaxed border border-emerald-950/50 max-h-[500px] whitespace-pre-wrap print-card"
                >
{`You are tasked with rebuilding BNFX - a high-end, sovereign trading investment and binary MLM commission platform. Adhere to the following structural specifications, rules, and system logic:

### 1. Technology Stack
- **Core Framework**: Next.js 15+ (App Router), Tailwind CSS v4, Lucide-React, Recharts.
- **Database & Type ORM**: Prisma ORM with PostgreSQL database schema.
- **Styling Guide**: Sovereign theme with dark-mode glassmorphism and skeuomorphic tactile depth cards. 

### 2. Database Models & Relationships
Implement a single-source-of-truth database schema containing:
- **User**: Stores login credentials, role flags ("user", "leader", "admin"), active balances (trading/withdrawal), and binary tree properties (binaryTreeLeftVolume, binaryTreeRightVolume, carryForwards, position, parentId, left/right child IDs).
- **Plan**: Holds entry activation fees, investment boundaries, stacking variables, and extra splits. Includes toggles: isBinaryMlmEnabled, isLeadershipEligible, and isSubscriptionDistributionEnabled.
- **Deposit**: Holds client investment records, status ("active", "locked", "completed"), earnedSoFar trackers, and duration limits.
- **Earning**: Records payout ledgers with specific type flags ("daily", "referral", "profit_share", "binary_pairing_bonus", "binary_cycle_bonus", "binary_flush_bonus").
- **TransactionLog**: Audits overall capital mutations.
- **Setting**: Key-value templates.

### 3. Core Logic Engines
- **Daily Profit Distribution Cron**: Triggered via /api/cron/distribute-profits. Loops through all due active deposits. Generates yields based on plan-specific risk bounds. Triggers profit-sharing splits up the referral chain based on sponsor rank, direct referrals conditions (Level L requires >= L direct recruits), and sponsor min active deposits.
- **Binary Placement Placement Engine**: Places new recruits in the binary tree on left/right legs using the sponsor's placement preference (Balanced, Left-Heavy, Right-Heavy, Cycle Fill).
- **Binary Volume Propagation**: Recursive ancestor loops that add deposit or fee volumes to carry-forwards when activated.
- **Binary Match & Pairing Engine**: Evaluates carry-forwards (LeftCF, RightCF) and deducts pairs based on weak-leg volume or custom rules (e.g. 1:1 or 2:1 cycles). Credits pairing commissions to the upline.
- **Optional Subscription splits**: Activates or bypasses entry fee allocation to uplines via the Plan Builder Switch.

### 4. User Dashboard Requirements
- **Overview Stats**: Display active plan, total deposited, active deposits, total direct, total team, carry-forwards, and live client-side profit tickers.
- **Earnings Page**: Summary cards for Total, Referral, Binary, Profit Share, Daily, and Bonus Income. The summaries must be calculated using database all-time group aggregation (Prisma groupBy) rather than truncated page lists. Page fetches must include cache-busters (&t=timestamp) to prevent Next.js cache lag.
- **Wallet Collapsible Sidebar**: Side navigation hosting Collapsible Trading Wallet and Withdrawal Wallet displays.
- **Staking Calculator & Simulator**: Interactive yield projection widgets.

### 5. Secure REST APIs
- All backend routes must implement database connectivity guards and diagnostic trace logs.
- Admin controllers (/api/admin/plans) must sanitize non-scalar UI properties and relations (isNew, isEditing, deposits) before Prisma DB writes.`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
