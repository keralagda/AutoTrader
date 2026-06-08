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
  QrCode,
  ShieldAlert,
  ArrowRight,
  Lock,
  DollarSign
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
  const [plans, setPlans] = useState<any[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  // Document Config State
  const [includePage1, setIncludePage1] = useState(true)
  const [includePage2, setIncludePage2] = useState(true)
  const [includePage3, setIncludePage3] = useState(true)

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
  
  // QR Data URL State
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Generation Trigger state
  const [generating, setGenerating] = useState(false)

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

  // Dynamic QR Code generation matching join url
  useEffect(() => {
    if (!showQrCode || !customJoinUrl) {
      setQrDataUrl('')
      return
    }

    import('qrcode').then(QRCode => {
      QRCode.toDataURL(customJoinUrl, {
        width: 150,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      }).then((url: string) => setQrDataUrl(url))
    }).catch(err => {
      console.error('QR generation error in builder:', err)
    })
  }, [showQrCode, customJoinUrl])

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

  // Export PDF using html2canvas & jsPDF (multi-page snap compilation)
  const handleDownloadPdf = async () => {
    setGenerating(true)
    
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = 210
      const pdfHeight = 297

      // Gather active page IDs to compile
      const pagesToCompile: string[] = []
      if (includePage1) pagesToCompile.push('pdf-page-1')
      if (includePage2) pagesToCompile.push('pdf-page-2')
      if (includePage3) pagesToCompile.push('pdf-page-3')

      if (pagesToCompile.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please select at least one page to include in compile checklist.',
          variant: 'destructive'
        })
        setGenerating(false)
        return
      }

      for (let i = 0; i < pagesToCompile.length; i++) {
        const pageId = pagesToCompile[i]
        const element = document.getElementById(pageId)
        if (!element) continue

        // Temporarily ensure element is visible/rendered correctly for canvas snap
        const canvas = await html2canvas(element, {
          scale: 2, // High resolution scale factor
          useCORS: true,
          allowTaint: true,
          backgroundColor: palette.bg
        })

        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        
        if (i > 0) {
          pdf.addPage()
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      }
      
      const fileName = `${documentTitle.toLowerCase().replace(/ /g, '_')}_brochure.pdf`
      pdf.save(fileName)

      toast({
        title: 'PDF Compiled Successfully',
        description: `Downloaded ${pagesToCompile.length}-page staking document.`
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
        LOADING PLATFORM ENTITIES FOR BUILDER...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Controls Column */}
      <div className="lg:col-span-2 space-y-6 text-xs">
        {/* Document Structure & Pages */}
        <Card className="cyber-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-emerald-400 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              COMPILE STRUCTURE
            </CardTitle>
            <CardDescription className="text-xs">
              Check pages to include in the compiled multi-page document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/5">
              <div className="space-y-0.5">
                <Label htmlFor="page-1-toggle" className="text-xs cursor-pointer font-medium">Page 1: Overview & Campaigns</Label>
                <p className="text-[10px] text-muted-foreground">Title, subtitle, branding, active promotions, and custom highlights.</p>
              </div>
              <Switch id="page-1-toggle" checked={includePage1} onCheckedChange={setIncludePage1} />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/5">
              <div className="space-y-0.5">
                <Label htmlFor="page-2-toggle" className="text-xs cursor-pointer font-medium">Page 2: Plans Catalog & Lockings</Label>
                <p className="text-[10px] text-muted-foreground">Detailed plans comparison table, locking rules, and exit penalties.</p>
              </div>
              <Switch id="page-2-toggle" checked={includePage2} onCheckedChange={setIncludePage2} />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/5">
              <div className="space-y-0.5">
                <Label htmlFor="page-3-toggle" className="text-xs cursor-pointer font-medium">Page 3: Referrals & Split Matrices</Label>
                <p className="text-[10px] text-muted-foreground">Referral payouts level rules, and compound profit shares.</p>
              </div>
              <Switch id="page-3-toggle" checked={includePage3} onCheckedChange={setIncludePage3} />
            </div>
          </CardContent>
        </Card>

        {/* Text & Styling Config */}
        <Card className="cyber-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-amber-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              THEME & DATA CONFIG
            </CardTitle>
            <CardDescription className="text-xs">
              Configure layout headings, color presets, and QR redirect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  Include Dynamic Join QR Code
                </Label>
                <Switch 
                  id="qr-toggle"
                  checked={showQrCode}
                  onCheckedChange={setShowQrCode}
                />
              </div>
              
              {showQrCode && (
                <div className="space-y-1">
                  <Label className="text-[9px] font-mono text-muted-foreground uppercase">QR Target Registration URL</Label>
                  <Input 
                    value={customJoinUrl}
                    onChange={(e) => setCustomJoinUrl(e.target.value)}
                    placeholder="URL to join platform"
                    className="h-8 font-mono text-[10px]"
                  />
                  <p className="text-[9px] text-muted-foreground mt-0.5">Vector QR patterns regenerate live inside the brochure.</p>
                </div>
              )}
            </div>

            {/* Footer Disclaimer */}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Footer Disclaimer Text</Label>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-emerald-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              STAKING & CAMPAIGN DATA
            </CardTitle>
            <CardDescription className="text-xs">
              Inject existing plans and campaigns dynamically into the document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select Plans (Multi) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Include Plans (Multi-Select)</Label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto border border-white/5 rounded-lg p-2 bg-black/20">
                {plans.length === 0 ? (
                  <p className="text-muted-foreground text-[10px] text-center font-mono py-4">NO PLANS LOADED</p>
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
                      <label htmlFor={`chk_${p.id}`} className="text-[11px] select-none cursor-pointer truncate font-mono text-white/80">
                        {p.name} ({p.dailyEarningPercent}% Yield)
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Select Campaign */}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground uppercase">Attach Promotional Campaign</Label>
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
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> COMPILING MULTI-PAGE PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" /> EXPORT {selectedPlanIds.length > 0 ? `${(includePage1?1:0)+(includePage2?1:0)+(includePage3?1:0)}` : '0'}-PAGE PDF BROCHURE
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-3 flex flex-col items-center gap-6 overflow-y-auto max-h-[85vh] pr-2">
        {/* Page 1 Preview Container */}
        {includePage1 && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5 self-start">
              <span>◉ PAGE 1: COVER & CAMPAIGNS SUMMARY</span>
            </div>
            
            <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1 bg-[#121212]/80 backdrop-blur-md">
              <div
                id="pdf-page-1"
                style={{ 
                  width: '595px', 
                  height: '842px', 
                  backgroundColor: palette.bg,
                  color: palette.text,
                  fontFamily: 'Courier, monospace'
                }}
                className="relative flex flex-col justify-between p-8 overflow-hidden select-none"
              >
                <div className="absolute inset-0 cyber-mesh opacity-5 pointer-events-none" />
                <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full filter blur-[100px] opacity-[0.08]" style={{ backgroundColor: palette.primary }} />
                
                {/* Header */}
                <div className="space-y-2 text-center border-b pb-4 relative" style={{ borderColor: `${palette.primary}20` }}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="h-6 w-6 rounded flex items-center justify-center text-xs font-mono text-black font-extrabold" style={{ backgroundColor: palette.primary }}>B</span>
                    <span className="text-xs font-mono font-extrabold tracking-widest text-white">BNFX PROTOCOL CONTROL HUB</span>
                  </div>
                  <h1 className="text-xl font-black font-sans uppercase tracking-tight text-white leading-tight">
                    {documentTitle}
                  </h1>
                  <p className="text-[10px] font-mono tracking-wider" style={{ color: palette.primary }}>
                    {documentSubtitle}
                  </p>
                </div>

                {/* Body Content */}
                <div className="flex-1 py-8 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest border-l-2 pl-2" style={{ borderColor: palette.primary }}>
                      Platform Overview & Yield Node
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      BNFX provides decentralised liquidity vaults yielding high-density returns backed by auto-hedged capital contracts. The automated compiler extracts live database records to generate this contract sheet.
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border bg-white/[0.01]" style={{ borderColor: `${palette.primary}10` }}>
                      <span className="text-[9px] text-muted-foreground uppercase block">Vault Status:</span>
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        SECURE ACTIVE
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border bg-white/[0.01]" style={{ borderColor: `${palette.primary}10` }}>
                      <span className="text-[9px] text-muted-foreground uppercase block">Uptime Index:</span>
                      <span className="text-[11px] font-bold text-white block mt-0.5">99.98% AUDITED</span>
                    </div>
                  </div>

                  {/* Promo Campaign Banner */}
                  {selectedPromo ? (
                    <div className="p-4 rounded-xl border border-dashed text-center space-y-3 relative overflow-hidden bg-white/[0.02]" style={{ borderColor: palette.primary }}>
                      <div className="absolute top-2 right-2 text-red-500 animate-pulse">
                        <Flame className="h-4 w-4 fill-red-500" />
                      </div>
                      
                      <span className="text-[9px] font-mono border px-2 py-0.5 rounded uppercase tracking-wider bg-white/5" style={{ color: palette.primary, borderColor: `${palette.primary}30` }}>
                        CAMPAIGN: {selectedPromo.type.replace(/_/g, ' ')}
                      </span>
                      
                      <h2 className="text-sm font-bold font-sans text-white tracking-tight leading-snug">
                        {selectedPromo.title}
                      </h2>
                      
                      <p className="text-[10px] text-white/80 leading-relaxed font-mono px-4">
                        &ldquo;{selectedPromo.bannerText || selectedPromo.description}&rdquo;
                      </p>

                      <div className="grid grid-cols-2 gap-4 border-t pt-3" style={{ borderColor: `${palette.primary}15` }}>
                        <div className="text-left font-mono">
                          <span className="text-[8px] text-muted-foreground uppercase block">Campaign Multiplier</span>
                          <span className="text-lg font-black text-emerald-400">{selectedPromo.multiplier}x BOOSTED</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-[8px] text-muted-foreground uppercase block">Offer Expires</span>
                          <span className="text-[10px] font-bold text-white block mt-1">
                            {new Date(selectedPromo.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed rounded-xl text-center italic text-muted-foreground text-xs" style={{ borderColor: `${palette.primary}20` }}>
                      {"No promotion campaigns selected. Campaigns can be created under the Content -> Promotions Admin tab."}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t pt-4 space-y-3" style={{ borderColor: `${palette.primary}20` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <span className="text-[8px] font-mono font-bold text-white uppercase block">Terms & Disclaimers:</span>
                      <p className="text-[8px] text-muted-foreground font-mono leading-normal">
                        {disclaimerText}
                      </p>
                    </div>
                    {showQrCode && qrDataUrl && (
                      <div className="p-1 rounded bg-white flex flex-col items-center justify-center shrink-0 shadow">
                        <img src={qrDataUrl} alt="Real QR Code" className="h-14 w-14" />
                        <span className="text-[6px] font-mono text-black font-extrabold uppercase mt-0.5 tracking-wider">SECURE LINK</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[7px] font-mono text-muted-foreground uppercase pt-1 border-t border-white/5">
                    <span>PAGE 1 // OVERVIEW SUMMARY</span>
                    <span>GEN DATE: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page 2 Preview Container */}
        {includePage2 && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5 self-start">
              <span>◉ PAGE 2: PLANS COMPARISONS & LOCKING PARAMETERS</span>
            </div>
            
            <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1 bg-[#121212]/80 backdrop-blur-md">
              <div
                id="pdf-page-2"
                style={{ 
                  width: '595px', 
                  height: '842px', 
                  backgroundColor: palette.bg,
                  color: palette.text,
                  fontFamily: 'Courier, monospace'
                }}
                className="relative flex flex-col justify-between p-8 overflow-hidden select-none"
              >
                <div className="absolute inset-0 cyber-mesh opacity-5 pointer-events-none" />
                
                {/* Header */}
                <div className="space-y-1 border-b pb-3" style={{ borderColor: `${palette.primary}20` }}>
                  <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: palette.primary }}>STAKING catalog</span>
                  <h2 className="text-base font-extrabold text-white">YIELD ENGINES COMPARATIVE matrix</h2>
                </div>

                {/* Body Content */}
                <div className="flex-1 py-4 space-y-4 overflow-hidden">
                  <table className="w-full text-left border-collapse text-[9px] font-mono">
                    <thead>
                      <tr className="border-b" style={{ borderColor: `${palette.primary}30` }}>
                        <th className="py-2 text-white font-extrabold">Plan Name</th>
                        <th className="py-2 text-white font-extrabold text-center">Daily Return</th>
                        <th className="py-2 text-white font-extrabold text-right">Limits (USDC)</th>
                        <th className="py-2 text-white font-extrabold text-right">Lock Period</th>
                        <th className="py-2 text-white font-extrabold text-right">Auto Compound</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b" style={{ borderColor: `${palette.primary}10` }}>
                      {selectedPlans.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground italic">No plans selected. Use controls on the left.</td>
                        </tr>
                      ) : (
                        selectedPlans.map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.01]">
                            <td className="py-2 font-bold text-white">{p.name}</td>
                            <td className="py-2 text-center font-bold text-emerald-400">{p.dailyEarningPercent}%</td>
                            <td className="py-2 text-right">${p.minDeposit.toLocaleString()} - ${p.maxDeposit.toLocaleString()}</td>
                            <td className="py-2 text-right text-amber-400">{p.lockPeriodDays ?? 0} Days</td>
                            <td className="py-2 text-right text-cyan-400">{p.autoCompound ? 'SUPPORTED' : 'NO'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Advanced Plan Details Grid */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-white">Advanced Contract Specifics</h3>
                    <div className="grid grid-cols-2 gap-3 text-[8.5px] font-mono">
                      {selectedPlans.map(p => (
                        <div key={p.id} className="p-2.5 rounded border space-y-1 bg-white/[0.01]" style={{ borderColor: `${palette.primary}15` }}>
                          <div className="flex items-center justify-between border-b pb-1 font-bold text-white" style={{ borderColor: `${palette.primary}10` }}>
                            <span>💠 {p.name} spec</span>
                            {p.planBadge && <span className="bg-primary/20 text-primary px-1 rounded text-[7px]">{p.planBadge}</span>}
                          </div>
                          <p><strong>Principal Return:</strong> {p.capitalReturn?.toUpperCase() || 'INCLUDED'}</p>
                          <p><strong>Stacking limits:</strong> {p.stackingEnabled ? `Enabled (Max ${p.maxStacks} stacks, +${p.stackingBonusPercent}% stack bonus)` : 'Disabled'}</p>
                          <p><strong>Early exit penalty:</strong> {p.earlyExitPenalty}% yield fee</p>
                          <p><strong>Earning days:</strong> {p.profitDays?.toUpperCase() || 'MON-FRI'}</p>
                          {p.spotsLimit > 0 && <p className="text-amber-400"><strong>Spots Limit:</strong> {p.spotsLimit} Max</p>}
                          {p.minVipTier && <p className="text-cyan-400"><strong>Required VIP Tier:</strong> {p.minVipTier}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Parameters Matrix */}
                  <div className="p-3 rounded-lg border text-[8.5px] leading-relaxed space-y-1 bg-white/[0.01]" style={{ borderColor: `${palette.primary}20` }}>
                    <div className="font-bold text-white flex items-center gap-1 font-mono uppercase">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      Dynamic Risk Yield bounds:
                    </div>
                    <p className="text-muted-foreground text-[8px] leading-relaxed">
                      Staking algorithms partition returns by risk level. 
                      {selectedPlans.map(p => (
                        <span key={p.id} className="block text-[8px] font-mono text-white/90 mt-0.5">
                          - <strong>{p.name} Limits:</strong> Low Risk: {p.lowRiskMin}%-{p.lowRiskMax}% // Medium Risk: {p.mediumRiskMin}%-{p.mediumRiskMax}% // High Risk: {p.highRiskMin}%-{p.highRiskMax}%
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-2 space-y-2" style={{ borderColor: `${palette.primary}20` }}>
                  <div className="flex items-center justify-between text-[7px] font-mono text-muted-foreground uppercase pt-1">
                    <span>PAGE 2 // CONTRACT SPECIFICATIONS</span>
                    <span>SYSTEM IDENTIFICATION NODE: {palette.accent.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page 3 Preview Container */}
        {includePage3 && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5 self-start">
              <span>◉ PAGE 3: REFERRALS COMMISSION & PROFIT SHARING MATRIX</span>
            </div>
            
            <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1 bg-[#121212]/80 backdrop-blur-md">
              <div
                id="pdf-page-3"
                style={{ 
                  width: '595px', 
                  height: '842px', 
                  backgroundColor: palette.bg,
                  color: palette.text,
                  fontFamily: 'Courier, monospace'
                }}
                className="relative flex flex-col justify-between p-8 overflow-hidden select-none"
              >
                <div className="absolute inset-0 cyber-mesh opacity-5 pointer-events-none" />
                
                {/* Header */}
                <div className="space-y-1 border-b pb-3" style={{ borderColor: `${palette.primary}20` }}>
                  <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: palette.primary }}>REVENUE MATRIX</span>
                  <h2 className="text-base font-extrabold text-white">REFERRAL MATRIX & REWARD DISTRIBUTION</h2>
                </div>

                {/* Body Content */}
                <div className="flex-1 py-4 space-y-5 overflow-hidden">
                  
                  {/* Referral Commissions List */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-emerald-400" />
                      Multilevel Referral Commission Breakdown
                    </h3>
                    <p className="text-[8.5px] text-muted-foreground">
                      Promoters earn matrix bonuses across multiple tiers of direct and indirect sign-ups. Commission percentages are distributed instantly to the wallet target.
                    </p>

                    <div className="space-y-3">
                      {selectedPlans.map(p => {
                        const rules = p.referralRules || []
                        return (
                          <div key={p.id} className="p-2.5 rounded border space-y-2 bg-white/[0.01]" style={{ borderColor: `${palette.primary}15` }}>
                            <span className="text-[9px] font-bold text-white block">💠 {p.name} Plan Referral Rules</span>
                            {rules.length === 0 ? (
                              <p className="text-muted-foreground text-[8px] italic">No custom level referral rules defined. Uses standard 7-level default rewards.</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2 text-[8px] font-mono">
                                {rules.map((rule: any) => (
                                  <div key={rule.id} className="p-1 rounded bg-black/20 border border-white/5 text-center">
                                    <span className="text-muted-foreground block text-[7px] uppercase">Level {rule.level}</span>
                                    <span className="font-bold text-emerald-400">{rule.commission}%</span>
                                    <span className="text-white/40 block text-[6px]">{rule.type}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Profit Distribution Matrix */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5">
                      <Grid className="h-3.5 w-3.5 text-cyan-400" />
                      Protocol Yield Allocation Splits
                    </h3>
                    <p className="text-[8.5px] text-muted-foreground">
                      Staking returns distribute according to strict smart-contract rules ensuring reserve liquidity, platform funding, and direct payouts.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-[8.5px] font-mono">
                      {selectedPlans.map(p => (
                        <div key={p.id} className="p-2 rounded border bg-black/40 border-white/5 space-y-1.5" style={{ borderColor: `${palette.primary}10` }}>
                          <span className="text-[9px] font-bold text-white block truncate border-b pb-0.5 border-white/5">{p.name} Yield splits:</span>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px]">
                            <span>Holder Profit:</span>
                            <span className="text-emerald-400 font-bold text-right">{p.accountHolderPercent}%</span>
                            <span>Trading Pool:</span>
                            <span className="text-cyan-400 font-bold text-right">{p.tradeProfitSharePercent}%</span>
                            <span>Rewards Pool:</span>
                            <span className="text-amber-400 font-bold text-right">{p.rewardsOffersPercent}%</span>
                            <span>Platform Fee:</span>
                            <span className="text-rose-400 font-bold text-right">{p.platformFeePercent}%</span>
                            {p.insuranceReservePercent > 0 && (
                              <>
                                <span>Insurance Vault:</span>
                                <span className="text-blue-400 font-bold text-right">{p.insuranceReservePercent}%</span>
                              </>
                            )}
                            {p.charityDonationPercent > 0 && (
                              <>
                                <span>Charity Fund:</span>
                                <span className="text-purple-400 font-bold text-right">{p.charityDonationPercent}%</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-2 space-y-2" style={{ borderColor: `${palette.primary}20` }}>
                  <div className="flex items-center justify-between text-[7px] font-mono text-muted-foreground uppercase pt-1">
                    <span>PAGE 3 // REVENUE MATRIX & SYSTEM SPLITS</span>
                    <span>AUTOTRADE SECURE LEDGER V1.4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
