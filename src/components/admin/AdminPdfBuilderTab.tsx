'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Download, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Percent, 
  Calendar, 
  Grid, 
  Flame, 
  UserCheck, 
  ChevronRight,
  RefreshCw,
  QrCode
} from 'lucide-react'
import type { PlanType } from '@/lib/types'

interface Promotion {
  id: string
  title: string
  description: string
  bannerText: string | null
  type: string
  multiplier: number
  startDate: string
  endDate: string
  isActive: boolean
  showOnLanding: boolean
  showOnDashboard: boolean
}

// Accent theme presets
const PALETTES = [
  { name: 'Sovereign Amber', primary: '#f59e0b', secondary: '#78350f', bg: '#0f0f0f', text: '#ffffff', accent: 'amber' },
  { name: 'Emerald Vault', primary: '#10b981', secondary: '#064e3b', bg: '#0c0f0e', text: '#ffffff', accent: 'emerald' },
  { name: 'Vortex Cyan', primary: '#06b6d4', secondary: '#164e63', bg: '#0e1113', text: '#ffffff', accent: 'cyan' },
  { name: 'Indigo Aura', primary: '#6366f1', secondary: '#312e81', bg: '#0d0d12', text: '#ffffff', accent: 'indigo' },
  { name: 'Fusion Rose', primary: '#f43f5e', secondary: '#4c0519', bg: '#0f0d0e', text: '#ffffff', accent: 'rose' }
]

export function AdminPdfBuilderTab() {
  const { toast } = useToast()
  
  // Platform Entities
  const [plans, setPlans] = useState<PlanType[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  // Document Config State
  const [selectedTemplate, setSelectedTemplate] = useState<'catalog' | 'flyer' | 'pitch'>('catalog')
  const [documentTitle, setDocumentTitle] = useState('BNFX INVESTMENT CATALOG')
  const [documentSubtitle, setDocumentSubtitle] = useState('Sovereign Yield Auto-Earning Plans')
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])
  const [selectedPromoId, setSelectedPromoId] = useState<string>('')
  const [activePaletteIndex, setActivePaletteIndex] = useState(0)
  const [disclaimerText, setDisclaimerText] = useState(
    'BNFX yields are generated via algorithmic auto-hedging contracts. Crypto investments contain inherent volatility. Review risk specifications before staking.'
  )
  const [showQrCode, setShowQrCode] = useState(true)
  const [customJoinUrl, setCustomJoinUrl] = useState('https://bnfx.platform/register')
  
  // Generation Trigger state
  const [generating, setGenerating] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Load plans and promotions
  useEffect(() => {
    async function loadEntities() {
      try {
        const [plansRes, promosRes] = await Promise.all([
          fetch('/api/plans'),
          fetch('/api/admin/promotions').catch(() => null)
        ])

        if (plansRes.ok) {
          const plansData = await plansRes.json()
          setPlans(plansData)
          if (plansData.length > 0) {
            setSelectedPlanIds(plansData.slice(0, 3).map((p: any) => p.id))
          }
        }

        if (promosRes && promosRes.ok) {
          const promosData = await promosRes.json()
          setPromotions(promosData)
          if (promosData.length > 0) {
            setSelectedPromoId(promosData[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching entities for PDF builder:', err)
        toast({
          title: 'Error loading entities',
          description: 'Could not load existing plans/promotions for the document builder.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    loadEntities()
  }, [])

  // Dynamic template text adjustment when template changes
  useEffect(() => {
    if (selectedTemplate === 'catalog') {
      setDocumentTitle('BNFX INVESTMENT CATALOG')
      setDocumentSubtitle('Sovereign Yield Auto-Earning Plans')
    } else if (selectedTemplate === 'flyer') {
      setDocumentTitle('SOVEREIGN MULTIPLIER CAMPAIGN')
      setDocumentSubtitle('Limited Staking Boost & Affiliate Rewards')
    } else {
      setDocumentTitle('INVST PLATFORM PRESENTATION')
      setDocumentSubtitle('Decentralized Auto-Trading Protocol Overview')
    }
  }, [selectedTemplate])

  // Toggle Plan Multi-selection
  const handleTogglePlanSelection = (id: string) => {
    if (selectedPlanIds.includes(id)) {
      setSelectedPlanIds(selectedPlanIds.filter(pid => pid !== id))
    } else {
      setSelectedPlanIds([...selectedPlanIds, id])
    }
  }

  // Get active color properties
  const palette = PALETTES[activePaletteIndex]

  // Retrieve selected entities
  const selectedPlans = plans.filter(p => selectedPlanIds.includes(p.id))
  const selectedPromo = promotions.find(pr => pr.id === selectedPromoId)

  // Export PDF using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return
    setGenerating(true)
    
    try {
      // Dynamically import jsPDF and html2canvas on client side
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // High resolution scale factor
        useCORS: true,
        allowTaint: true,
        backgroundColor: palette.bg
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      
      // Setup A4 size sheet: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = 210
      const pdfHeight = 297
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      
      const fileName = `${documentTitle.toLowerCase().replace(/ /g, '_')}_design.pdf`
      pdf.save(fileName)

      toast({
        title: 'PDF Compiled Successfully',
        description: `Downloaded ${fileName}`
      })
    } catch (error) {
      console.error('Error generating PDF document:', error)
      toast({
        title: 'Compilation Failed',
        description: 'Failed to compile HTML nodes to PDF file.',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground font-mono">
        <RefreshCw className="animate-spin mr-2 h-5 w-5" />
        LOADING STAKING ENTITIES FROM DATABASE...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Controls Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-emerald-400 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              TEMPLATE & THEME CONFIG
            </CardTitle>
            <CardDescription className="text-xs">
              Select document blueprints, custom colors, and QR code targets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Template select */}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">PDF Template Blueprint</Label>
              <Select 
                value={selectedTemplate} 
                onValueChange={(val: any) => setSelectedTemplate(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-xs">
                  <SelectItem value="catalog">Plan Catalog Grid (Comparison Table)</SelectItem>
                  <SelectItem value="flyer">Promotional Marketing Flyer (Promo Banner)</SelectItem>
                  <SelectItem value="pitch">Investor Pitch Sheet (Company Stats & Decks)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Text */}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Document Heading Title</Label>
              <Input 
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value.toUpperCase())}
                placeholder="Title Text"
                maxLength={40}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Document Subtitle / Headline</Label>
              <Input 
                value={documentSubtitle}
                onChange={(e) => setDocumentSubtitle(e.target.value)}
                placeholder="Subtitle Text"
                maxLength={60}
              />
            </div>

            {/* Accent selection */}
            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Branding Color Accent Palette</Label>
              <div className="grid grid-cols-5 gap-2">
                {PALETTES.map((pal, idx) => (
                  <button
                    key={pal.name}
                    onClick={() => setActivePaletteIndex(idx)}
                    className={`h-7 rounded border flex items-center justify-center transition-all ${
                      activePaletteIndex === idx 
                        ? 'border-white bg-white/10 scale-105' 
                        : 'border-white/10 bg-transparent hover:border-white/20'
                    }`}
                    title={pal.name}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.primary }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic QR target */}
            <div className="space-y-3 p-3 rounded-lg border border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <Label htmlFor="qr-toggle" className="text-xs cursor-pointer flex items-center gap-1.5 font-medium">
                  <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                  Include Join QR Code
                </Label>
                <Switch 
                  id="qr-toggle"
                  checked={showQrCode}
                  onCheckedChange={setShowQrCode}
                />
              </div>
              
              {showQrCode && (
                <div className="space-y-1">
                  <Label className="text-[9px] font-mono text-muted-foreground uppercase">QR Code Redirect Link</Label>
                  <Input 
                    value={customJoinUrl}
                    onChange={(e) => setCustomJoinUrl(e.target.value)}
                    placeholder="URL to join platform"
                    className="h-8 font-mono text-[10px]"
                  />
                </div>
              )}
            </div>

            {/* Footer Disclaimer */}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Footer Terms & Disclaimer</Label>
              <Textarea 
                value={disclaimerText}
                onChange={(e) => setDisclaimerText(e.target.value)}
                placeholder="Enter financial disclaimers..."
                rows={2}
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Entity Selector Card */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-amber-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              SELECT PLATFORM DATA
            </CardTitle>
            <CardDescription className="text-xs">
              Inject existing plans and campaigns dynamically into the document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Select Plans (Multi) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Include Plans (Multi-Select)</Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border border-white/5 rounded-lg p-2 bg-black/20">
                {plans.length === 0 ? (
                  <p className="text-muted-foreground text-[10px] text-center font-mono">NO ACTIVE PLANS FOUND</p>
                ) : (
                  plans.map(p => (
                    <div key={p.id} className="flex items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        id={`chk_${p.id}`}
                        checked={selectedPlanIds.includes(p.id)}
                        onChange={() => handleTogglePlanSelection(p.id)}
                        className="rounded border-white/10 bg-black/40 accent-emerald-500 cursor-pointer"
                      />
                      <label htmlFor={`chk_${p.id}`} className="text-xs select-none cursor-pointer truncate font-mono text-white/80">
                        {p.name} ({p.dailyEarningPercent}% Daily)
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Select Campaign */}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Attach Promotion Campaign</Label>
              <Select 
                value={selectedPromoId} 
                onValueChange={setSelectedPromoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select active campaign" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-xs">
                  {promotions.length === 0 ? (
                    <SelectItem value="none" disabled>No promotions found</SelectItem>
                  ) : (
                    promotions.map(pr => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.title} ({pr.multiplier}x Multiplier)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleDownloadPdf} 
              disabled={generating} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-mono font-bold mt-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> COMPILED TO A4 GRAPHIC...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" /> EXPORT PRINTABLE PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-3 flex flex-col items-center">
        <div className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5 self-start">
          <Grid className="h-3.5 w-3.5" />
          A4 Print Preview Canvas (Live Vector Mockup)
        </div>
        
        {/* Aspect Ratio A4 Mockup Box: Width: 460px, Height: 650px (Scaled equivalent) */}
        <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl p-2 bg-[#121212]/80 backdrop-blur-md">
          {/* Printable Element with exactly 210 x 297 ratio */}
          <div
            ref={previewRef}
            id="pdf-render-element"
            style={{ 
              width: '595px', 
              height: '842px', 
              backgroundColor: palette.bg,
              color: palette.text,
              fontFamily: 'Courier, monospace'
            }}
            className="relative flex flex-col justify-between p-8 overflow-hidden select-none border border-white/5"
          >
            {/* Background design elements */}
            <div className="absolute inset-0 cyber-mesh opacity-5 pointer-events-none" />
            <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full filter blur-[100px] opacity-[0.08] pointer-events-none" style={{ backgroundColor: palette.primary }} />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full filter blur-[100px] opacity-[0.08] pointer-events-none" style={{ backgroundColor: palette.primary }} />

            {/* Document Header */}
            <div className="space-y-2 text-center border-b pb-4 relative" style={{ borderColor: `${palette.primary}20` }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="h-6 w-6 rounded flex items-center justify-center text-xs font-mono text-black font-extrabold" style={{ backgroundColor: palette.primary }}>B</span>
                <span className="text-sm font-mono font-extrabold tracking-widest text-white">BNFX PROTOCOL</span>
              </div>
              <h1 className="text-2xl font-black font-sans uppercase tracking-tight text-white leading-tight" style={{ textShadow: `0 0 10px ${palette.primary}10` }}>
                {documentTitle || 'BNFX STAKING CONTRACTS'}
              </h1>
              <p className="text-[11px] font-mono tracking-wider opacity-80" style={{ color: palette.primary }}>
                {documentSubtitle || 'Sovereign Automated Return Engines'}
              </p>
            </div>

            {/* Document Body Content based on template */}
            <div className="flex-1 py-6 space-y-6 overflow-hidden">
              {selectedTemplate === 'catalog' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest border-l-2 pl-2" style={{ borderColor: palette.primary }}>
                      Yield Plan Comparisons
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Select yields generated on live currency/stablecoin indexes, backing automated deposit margins. Principal reserves are protected by platform insurance vault parameters.
                    </p>
                  </div>

                  {/* Plans Table */}
                  <table className="w-full text-left border-collapse text-[10px] font-mono">
                    <thead>
                      <tr className="border-b" style={{ borderColor: `${palette.primary}30` }}>
                        <th className="py-2 text-white font-extrabold uppercase">Plan Name</th>
                        <th className="py-2 text-white font-extrabold uppercase text-center">Daily Return</th>
                        <th className="py-2 text-white font-extrabold uppercase text-right">Limits (USDC)</th>
                        <th className="py-2 text-white font-extrabold uppercase text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: `${palette.primary}10` }}>
                      {selectedPlans.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground italic">No plans selected. Use controls on the left.</td>
                        </tr>
                      ) : (
                        selectedPlans.map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.primary }} />
                              {p.name}
                            </td>
                            <td className="py-2.5 text-center font-bold text-emerald-400">
                              {p.dailyEarningPercent}%
                            </td>
                            <td className="py-2.5 text-right text-white/80">
                              ${p.minDeposit.toLocaleString()} - ${p.maxDeposit.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right font-medium" style={{ color: palette.primary }}>
                              {p.durationDays > 0 ? `${p.durationDays} Days` : 'Lifetime'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Extended Yield Specs Box */}
                  <div className="p-3 rounded-lg border text-[10px] leading-relaxed space-y-1 bg-white/[0.01]" style={{ borderColor: `${palette.primary}20` }}>
                    <div className="font-bold text-white flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5" style={{ color: palette.primary }} />
                      Capital Distribution Matrix:
                    </div>
                    <p className="text-muted-foreground text-[9px]">
                      Staking returns distribute daily payout models: 50% Account Holder margins, 30% Auto-Trade execution splits, 15% Platform reserves pool and 5% standard ledger fee rates.
                    </p>
                  </div>
                </div>
              )}

              {selectedTemplate === 'flyer' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest border-l-2 pl-2" style={{ borderColor: palette.primary }}>
                      Active Staking Multiplier Campaign
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Boost yield potentials and earn bonus incentives by executing matrix referral networks. High-density earnings accrue dynamically based on live promotion models.
                    </p>
                  </div>

                  {/* Promo Banner layout */}
                  {selectedPromo ? (
                    <div className="p-4 rounded-xl border border-dashed text-center space-y-3 relative overflow-hidden bg-white/[0.02]" style={{ borderColor: palette.primary }}>
                      <div className="absolute top-2 right-2 text-red-500 animate-pulse">
                        <Flame className="h-4 w-4 fill-red-500" />
                      </div>
                      
                      <span className="text-[9px] font-mono border px-2 py-0.5 rounded uppercase tracking-wider bg-white/5" style={{ color: palette.primary, borderColor: `${palette.primary}30` }}>
                        CAMPAIGN TYPE: {selectedPromo.type.replace(/_/g, ' ')}
                      </span>
                      
                      <h2 className="text-xl font-bold font-sans text-white tracking-tight leading-snug">
                        {selectedPromo.title}
                      </h2>
                      
                      <p className="text-[10.5px] text-white/80 leading-relaxed font-mono px-4">
                        &ldquo;{selectedPromo.bannerText || selectedPromo.description}&rdquo;
                      </p>

                      <div className="grid grid-cols-2 gap-4 border-t pt-3" style={{ borderColor: `${palette.primary}15` }}>
                        <div className="text-left font-mono">
                          <span className="text-[8px] text-muted-foreground uppercase block">Bonus Yield Multiplier</span>
                          <span className="text-lg font-black text-emerald-400">{selectedPromo.multiplier}x</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-[8px] text-muted-foreground uppercase block">Expiration Timeframe</span>
                          <span className="text-[10px] font-bold text-white block mt-1">
                            {new Date(selectedPromo.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed rounded-xl text-center italic text-muted-foreground text-xs" style={{ borderColor: `${palette.primary}20` }}>
                      No promotion campaigns selected. Create or select a promotion on the left.
                    </div>
                  )}

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-3 text-[9px] font-mono">
                    <div className="p-2.5 rounded border space-y-1 bg-white/[0.01]" style={{ borderColor: `${palette.primary}10` }}>
                      <span className="font-bold text-white block">🚀 Accelerated Returns</span>
                      <p className="text-muted-foreground">Staking rewards are amplified instantly upon node activation during this event window.</p>
                    </div>
                    <div className="p-2.5 rounded border space-y-1 bg-white/[0.01]" style={{ borderColor: `${palette.primary}10` }}>
                      <span className="font-bold text-white block">🔗 Affiliate Commissions</span>
                      <p className="text-muted-foreground">Receive up to 7-level direct referral commissions with automated payouts to your wallet.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedTemplate === 'pitch' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest border-l-2 pl-2" style={{ borderColor: palette.primary }}>
                      Decentralized Protocol Overview
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      BNFX leverages advanced auto-hedging modules, securing yield models against downward cryptocurrency drawdowns. Funds remain isolated inside verified non-custodial smart wallets.
                    </p>
                  </div>

                  {/* Column Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center font-mono">
                    <div className="p-2.5 rounded border bg-white/[0.01]" style={{ borderColor: `${palette.primary}10` }}>
                      <span className="text-[8px] text-muted-foreground uppercase block">Avg Daily Yield</span>
                      <span className="text-base font-black text-emerald-400">0.5% - 15.0%</span>
                    </div>
                    <div className="p-2.5 rounded border bg-white/[0.01]" style={{ borderColor: `${palette.primary}10` }}>
                      <span className="text-[8px] text-muted-foreground uppercase block">Security Protocol</span>
                      <span className="text-[10px] font-bold text-white block mt-1">Multi-Sig HSM</span>
                    </div>
                    <div className="p-2.5 rounded border bg-white/[0.01]" style={{ borderColor: `${palette.primary}10` }}>
                      <span className="text-[8px] text-muted-foreground uppercase block">Asset Support</span>
                      <span className="text-[10px] font-bold text-white block mt-1">USDC (BSC/TRON)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Protocol Security Guardrails:</h4>
                    <div className="space-y-2 text-[9.5px] text-muted-foreground font-mono leading-relaxed pl-1.5">
                      <p className="flex items-start gap-1">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: palette.primary }} />
                        <span><strong>Row-Level RLS isolation:</strong> User balances are cryptographically partitioned in the database ledger.</span>
                      </p>
                      <p className="flex items-start gap-1">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: palette.primary }} />
                        <span><strong>Smart Contract Escrow:</strong> Dynamic staking cycles hold deposits protected by collateral limits.</span>
                      </p>
                      <p className="flex items-start gap-1">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: palette.primary }} />
                        <span><strong>2FA & PIN Protection:</strong> Withdrawals require transaction confirmation PIN keys.</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Footer (CTA, QR code and disclaimer) */}
            <div className="border-t pt-4 space-y-3 relative" style={{ borderColor: `${palette.primary}20` }}>
              <div className="flex items-start justify-between gap-4">
                {/* Disclaimer */}
                <div className="flex-1 space-y-1">
                  <span className="text-[8px] font-mono font-bold text-white uppercase block">Risk & Disclaimer Terms:</span>
                  <p className="text-[8px] text-muted-foreground font-mono leading-normal">
                    {disclaimerText || 'Crypto investments contain volatility. Yields are generated via automated trading logic.'}
                  </p>
                </div>
                
                {/* QR Code Graphic Placeholder */}
                {showQrCode && (
                  <div className="p-1 rounded bg-white flex flex-col items-center justify-center shrink-0 border border-white/10 shadow">
                    <div className="h-14 w-14 flex items-center justify-center bg-white border border-neutral-200">
                      {/* Fake pixelated QR code using canvas mockup styles */}
                      <div className="grid grid-cols-6 gap-0.5 p-0.5">
                        {[
                          1,0,1,1,0,1,
                          0,1,0,0,1,0,
                          1,0,1,1,0,1,
                          1,1,0,0,1,1,
                          0,0,1,1,0,0,
                          1,1,0,1,1,1
                        ].map((cell, idx) => (
                          <div 
                            key={idx} 
                            className={`h-2 w-2 ${cell === 1 ? 'bg-black' : 'bg-transparent'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[6.5px] font-mono text-black font-extrabold uppercase mt-0.5 tracking-wider">JOIN NOW</span>
                  </div>
                )}
              </div>

              {/* Legal Footer Info */}
              <div className="flex items-center justify-between text-[7.5px] font-mono text-muted-foreground uppercase pt-1 border-t border-white/5">
                <span>SYSTEM ID: BNFX_SECURE_NODE_{palette.accent.toUpperCase()}</span>
                <span>GEN DATE: {new Date().toLocaleDateString()}</span>
                <span>AUTOTRADE PROTOCOL V1.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
