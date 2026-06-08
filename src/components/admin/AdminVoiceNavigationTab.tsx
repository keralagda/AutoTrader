'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { 
  Mic, 
  Plus, 
  Trash2, 
  Play, 
  Check, 
  Settings2, 
  Sparkles, 
  Search, 
  HelpCircle,
  Edit2
} from 'lucide-react'

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

export function AdminVoiceNavigationTab() {
  const { toast } = useToast()
  
  // Data State
  const [commands, setCommands] = useState<VoiceCommand[]>([])
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    rate: 1.0,
    pitch: 1.0,
    triggerKey: 'v'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState('')

  // Edit/Add Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formKeywords, setFormKeywords] = useState('')
  const [formActionType, setFormActionType] = useState<'navigation' | 'auth_modal'>('navigation')
  const [formView, setFormView] = useState<'landing' | 'dashboard' | 'admin'>('landing')
  const [formDashboardTab, setFormDashboardTab] = useState('overview')
  const [formAdminTab, setFormAdminTab] = useState('plans')
  const [formHash, setFormHash] = useState('')
  const [formAuthMode, setFormAuthMode] = useState<'login' | 'register'>('login')
  const [formFeedbackText, setFormFeedbackText] = useState('')
  const [formRequiredRole, setFormRequiredRole] = useState<'public' | 'user' | 'admin'>('public')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formDescription, setFormDescription] = useState('')

  // Simulator State
  const [simQuery, setSimQuery] = useState('')
  const [simResult, setSimResult] = useState<{
    matched: boolean
    command?: VoiceCommand
    error?: string
    debugTrace?: string
  } | null>(null)

  // Load configuration
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/voice-commands')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (data.success) {
          setCommands(data.commands)
          setSettings(data.settings)
        }
      } catch (err) {
        toast({
          title: 'Error loading settings',
          description: 'Could not fetch voice commands from database.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Save config to database
  const saveConfiguration = async (updatedCommands: VoiceCommand[], updatedSettings: VoiceSettings) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/voice-commands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: updatedCommands,
          settings: updatedSettings
        })
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      if (data.success) {
        toast({
          title: 'Configuration Saved',
          description: 'Voice navigation settings written to database.',
        })
      }
    } catch (err) {
      toast({
        title: 'Error saving config',
        description: 'Failed to write setting updates to database.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle Voice Settings Changes
  const handleSettingsChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    saveConfiguration(commands, newSettings)
  }

  // Toggle command status
  const handleToggleActive = (id: string) => {
    const updated = commands.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    setCommands(updated)
    saveConfiguration(updated, settings)
  }

  // Delete command
  const handleDeleteCommand = (id: string) => {
    const updated = commands.filter(c => c.id !== id)
    setCommands(updated)
    saveConfiguration(updated, settings)
  }

  // Edit command - prefill form
  const handleStartEdit = (cmd: VoiceCommand) => {
    setEditingId(cmd.id)
    setFormKeywords(cmd.keywords.join(', '))
    setFormActionType(cmd.actionType)
    setFormView(cmd.view || 'landing')
    setFormDashboardTab(cmd.dashboardTab || 'overview')
    setFormAdminTab(cmd.adminTab || 'plans')
    setFormHash(cmd.hash || '')
    setFormAuthMode(cmd.authMode || 'login')
    setFormFeedbackText(cmd.feedbackText)
    setFormRequiredRole(cmd.requiredRole)
    setFormIsActive(cmd.isActive)
    setFormDescription(cmd.description)
  }

  // Cancel editing or clear form
  const handleCancelForm = () => {
    setEditingId(null)
    setFormKeywords('')
    setFormActionType('navigation')
    setFormView('landing')
    setFormDashboardTab('overview')
    setFormAdminTab('plans')
    setFormHash('')
    setFormAuthMode('login')
    setFormFeedbackText('')
    setFormRequiredRole('public')
    setFormIsActive(true)
    setFormDescription('')
  }

  // Submit add/edit form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formKeywords.trim() || !formFeedbackText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Keywords and Speech Feedback are required.',
        variant: 'destructive'
      })
      return
    }

    const keywordList = formKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0)

    const updatedCommand: VoiceCommand = {
      id: editingId || `vcmd_${Date.now()}`,
      keywords: keywordList,
      actionType: formActionType,
      view: formActionType === 'navigation' ? formView : undefined,
      dashboardTab: (formActionType === 'navigation' && formView === 'dashboard') ? formDashboardTab : undefined,
      adminTab: (formActionType === 'navigation' && formView === 'admin') ? formAdminTab : undefined,
      hash: (formActionType === 'navigation' && formView === 'landing') ? formHash : undefined,
      authMode: formActionType === 'auth_modal' ? formAuthMode : undefined,
      feedbackText: formFeedbackText,
      requiredRole: formRequiredRole,
      isActive: formIsActive,
      description: formDescription
    }

    let updatedList: VoiceCommand[]
    if (editingId) {
      updatedList = commands.map(c => c.id === editingId ? updatedCommand : c)
    } else {
      updatedList = [...commands, updatedCommand]
    }

    setCommands(updatedList)
    saveConfiguration(updatedList, settings)
    handleCancelForm()
  }

  // Speech Simulator Match Testing
  const handleTestMatch = () => {
    const query = simQuery.toLowerCase().trim()
    if (!query) return

    // Matching logic
    const matched = commands.find(cmd => {
      if (!cmd.isActive) return false
      return cmd.keywords.some(keyword => query.includes(keyword))
    })

    if (!matched) {
      setSimResult({
        matched: false,
        error: `No active command keyword matched "${query}".`,
        debugTrace: `Evaluated ${commands.filter(c => c.isActive).length} active commands.`
      })
      speakTest("Command not recognized. Please try again.")
      return
    }

    // Role check logic simulation (assume role is admin for testing)
    setSimResult({
      matched: true,
      command: matched,
      debugTrace: `Matched keyword list: [${matched.keywords.join(', ')}]. NavTarget: View: ${matched.view || 'N/A'}, Tab: ${matched.dashboardTab || matched.adminTab || 'N/A'}`
    })

    speakTest(matched.feedbackText)
  }

  // Trigger browser SpeechSynthesis for simulator testing
  const speakTest = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = settings.rate
      utterance.pitch = settings.pitch
      window.speechSynthesis.speak(utterance)
    } else {
      toast({
        title: 'Speech synthesis unsupported',
        description: 'This browser does not support Speech Synthesis API.',
        variant: 'destructive'
      })
    }
  }

  // Filter commands list
  const filteredCommands = commands.filter(cmd => {
    const query = searchTerm.toLowerCase()
    return (
      cmd.description.toLowerCase().includes(query) ||
      cmd.keywords.some(k => k.includes(query)) ||
      cmd.feedbackText.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground font-mono">
        <Mic className="animate-pulse mr-2 h-5 w-5" />
        LOADING SYSTEM VOICE COMMANDS...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Grid Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Voice Parameters Card */}
        <Card className="cyber-card flex-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-mono text-emerald-400 flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              VOICE ENGINE PARAMETERS
            </CardTitle>
            <CardDescription className="text-xs">
              Configure speech synthesis parameters and toggles globally
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="space-y-0.5">
                <Label htmlFor="voice-enabled" className="text-xs font-semibold">Enable Voice Navigation</Label>
                <p className="text-[10px] text-muted-foreground">Allows users to trigger navigation using web microphone</p>
              </div>
              <Switch 
                id="voice-enabled" 
                checked={settings.enabled}
                onCheckedChange={(val) => handleSettingsChange('enabled', val)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span>Speech Synthesis Rate (Speed):</span>
                <span className="text-emerald-400 font-bold">{settings.rate.toFixed(2)}x</span>
              </div>
              <Slider 
                min={0.5} 
                max={2.0} 
                step={0.1} 
                value={[settings.rate]} 
                onValueChange={(val) => handleSettingsChange('rate', val[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span>Speech Synthesis Pitch:</span>
                <span className="text-emerald-400 font-bold">{settings.pitch.toFixed(2)}</span>
              </div>
              <Slider 
                min={0.5} 
                max={1.5} 
                step={0.1} 
                value={[settings.pitch]} 
                onValueChange={(val) => handleSettingsChange('pitch', val[0])}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-mono text-muted-foreground uppercase">Activation Trigger Key</Label>
                <Input 
                  value={settings.triggerKey.toUpperCase()}
                  onChange={(e) => handleSettingsChange('triggerKey', e.target.value.toLowerCase().slice(-1))}
                  className="font-mono text-center text-xs" 
                />
              </div>
              <div className="flex items-end justify-center pb-2 text-[10px] font-mono text-muted-foreground">
                PRESS TRIGGER KEY ONCE TO START
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Test Simulator Card */}
        <Card className="cyber-card flex-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-mono text-amber-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              VOICE TEST SIMULATOR SANDBOX
            </CardTitle>
            <CardDescription className="text-xs">
              Simulate speech outputs and check which command keywords get triggered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sim-query" className="text-xs font-semibold">Simulate Spoken Phrase</Label>
              <div className="flex gap-2">
                <Input 
                  id="sim-query"
                  placeholder="e.g. 'go to deposits' or 'open withdrawals'"
                  value={simQuery}
                  onChange={(e) => setSimQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestMatch()}
                  className="text-xs font-mono"
                />
                <Button onClick={handleTestMatch} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Play className="h-4 w-4 mr-1" /> Match
                </Button>
              </div>
            </div>

            {simResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                simResult.matched 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}>
                <div className="flex items-center justify-between font-bold font-mono">
                  <span>RESULT: {simResult.matched ? 'MATCHED SUCCESSFULLY' : 'MATCH FAILED'}</span>
                  <span>{simResult.matched ? <Check className="h-4 w-4" /> : '❌'}</span>
                </div>
                {simResult.error && <p className="text-muted-foreground">{simResult.error}</p>}
                
                {simResult.matched && simResult.command && (
                  <div className="space-y-1 text-[11px] font-mono">
                    <p><strong>Command ID:</strong> {simResult.command.id}</p>
                    <p><strong>Matched Keywords:</strong> {simResult.command.keywords.join(', ')}</p>
                    <p><strong>Action Type:</strong> {simResult.command.actionType}</p>
                    {simResult.command.view && <p><strong>Target View:</strong> {simResult.command.view}</p>}
                    {(simResult.command.dashboardTab || simResult.command.adminTab) && (
                      <p><strong>Target Tab:</strong> {simResult.command.dashboardTab || simResult.command.adminTab}</p>
                    )}
                    <p><strong>Role Restrictions:</strong> {simResult.command.requiredRole.toUpperCase()}</p>
                    <div className="mt-2 p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                      <span>📢 <em>&ldquo;{simResult.command.feedbackText}&rdquo;</em></span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-white hover:bg-white/10"
                        onClick={() => speakTest(simResult.command!.feedbackText)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {simResult.debugTrace && (
                  <div className="border-t border-white/5 pt-2 mt-2 text-[9px] text-muted-foreground font-mono">
                    TRACE: {simResult.debugTrace}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main CRUD Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Form Card */}
        <Card className="cyber-card col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-emerald-400">
              {editingId ? 'EDIT COMMAND CONFIG' : 'CREATE NEW COMMAND'}
            </CardTitle>
            <CardDescription className="text-xs">
              Define keywords and resulting navigation flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Trigger Keywords (comma separated)</Label>
                <Input 
                  placeholder="e.g. withdraw, payout, cash out" 
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Description</Label>
                <Input 
                  placeholder="Navigate users to withdraw layout" 
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Action Type</Label>
                  <Select value={formActionType} onValueChange={(val: any) => setFormActionType(val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="navigation">Navigation</SelectItem>
                      <SelectItem value="auth_modal">Auth Modal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Required Role</Label>
                  <Select value={formRequiredRole} onValueChange={(val: any) => setFormRequiredRole(val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (None)</SelectItem>
                      <SelectItem value="user">User (Auth)</SelectItem>
                      <SelectItem value="admin">Admin Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formActionType === 'navigation' && (
                <div className="space-y-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Target View</Label>
                    <Select value={formView} onValueChange={(val: any) => setFormView(val)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landing">Public Landing</SelectItem>
                        <SelectItem value="dashboard">User Dashboard</SelectItem>
                        <SelectItem value="admin">Admin Control Hub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formView === 'landing' && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Scroll Hash Link Anchor</Label>
                      <Input 
                        placeholder="e.g. #plans or #calculator" 
                        value={formHash}
                        onChange={(e) => setFormHash(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  )}

                  {formView === 'dashboard' && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Dashboard Tab</Label>
                      <Select value={formDashboardTab} onValueChange={setFormDashboardTab}>
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="overview">Overview</SelectItem>
                          <SelectItem value="profile">Profile</SelectItem>
                          <SelectItem value="earnings">Earnings</SelectItem>
                          <SelectItem value="investment">Investment Plans</SelectItem>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdraw">Withdrawal</SelectItem>
                          <SelectItem value="team">Team / Affiliate</SelectItem>
                          <SelectItem value="rewards">Rewards Store</SelectItem>
                          <SelectItem value="challenges">Competition</SelectItem>
                          <SelectItem value="leaderboard">Leaderboard</SelectItem>
                          <SelectItem value="transactions">Transactions</SelectItem>
                          <SelectItem value="security">Security / Pin</SelectItem>
                          <SelectItem value="help">Help Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formView === 'admin' && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground">Admin Menu Tab</Label>
                      <Select value={formAdminTab} onValueChange={setFormAdminTab}>
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plans">Plan Builder</SelectItem>
                          <SelectItem value="users">Manage Users</SelectItem>
                          <SelectItem value="deposits">Deposit Approvals</SelectItem>
                          <SelectItem value="withdrawals">Withdrawals Manager</SelectItem>
                          <SelectItem value="logicBuilder">Rules Builder</SelectItem>
                          <SelectItem value="chatbot">AI Chatbot Builder</SelectItem>
                          <SelectItem value="voiceNavigation">Voice Commands</SelectItem>
                          <SelectItem value="pdfBuilder">PDF Builder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {formActionType === 'auth_modal' && (
                <div className="space-y-1 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Modal Authentication Mode</Label>
                  <Select value={formAuthMode} onValueChange={(val: any) => setFormAuthMode(val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="login">Open Login Form</SelectItem>
                      <SelectItem value="register">Open Registration Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Speech Synthesis Feedback Text</Label>
                <Input 
                  placeholder="e.g. Navigating to withdrawals panel" 
                  value={formFeedbackText}
                  onChange={(e) => setFormFeedbackText(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded border border-white/5 bg-white/[0.01]">
                <Label htmlFor="form-active" className="text-xs cursor-pointer">Set Command Active</Label>
                <Switch 
                  id="form-active"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-mono">
                  <Check className="h-4 w-4 mr-1" /> SAVE COMMAND
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCancelForm} className="font-mono">
                  CLEAR
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Commands List Grid (High Density Table) */}
        <Card className="cyber-card col-span-2 flex flex-col h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-mono text-emerald-400">COMMANDS DIRECTORY</CardTitle>
              <CardDescription className="text-xs">Manage voice trigger keyword routing lists</CardDescription>
            </div>
            {/* Search Box */}
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search commands..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs font-mono h-8"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0 border-t border-white/10">
            <div className="divide-y divide-white/5">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-mono text-xs">
                  NO VOICE COMMANDS FOUND MATCHING THE QUERY.
                </div>
              ) : (
                filteredCommands.map(cmd => (
                  <div key={cmd.id} className="p-4 flex items-start justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {cmd.keywords.map(kw => (
                          <span key={kw} className="bg-white/10 border border-white/10 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                            &ldquo;{kw}&rdquo;
                          </span>
                        ))}
                        <span className={`text-[8px] uppercase tracking-wider font-mono px-1 rounded ${
                          cmd.requiredRole === 'admin' 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' 
                            : cmd.requiredRole === 'user'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {cmd.requiredRole}
                        </span>
                      </div>
                      <p className="text-xs text-white/90 font-medium">{cmd.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span className="text-emerald-500">📢 &ldquo;{cmd.feedbackText}&rdquo;</span>
                        <span>•</span>
                        <span>
                          {cmd.actionType === 'navigation' 
                            ? `Go: ${cmd.view}/${cmd.dashboardTab || cmd.adminTab || cmd.hash || 'home'}` 
                            : `Auth: ${cmd.authMode}`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch 
                        checked={cmd.isActive}
                        onCheckedChange={() => handleToggleActive(cmd.id)}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-white"
                        onClick={() => handleStartEdit(cmd)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        onClick={() => handleDeleteCommand(cmd.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
