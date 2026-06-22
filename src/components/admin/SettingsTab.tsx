'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { Save, Settings, Image, Upload, Type, ImageIcon, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

interface SettingsState {
  platform_name: string
  currency: string
  min_withdrawal: string
  withdrawal_fee: string
  trading_days: string
  profit_cycle: string
  challenges_enabled: string
  logo_url: string
  logo_dark_url: string
  favicon_url: string
  branding_mode: string // 'name' | 'logo' | 'name_logo'
  smtp_gmail_user: string
  smtp_gmail_pass: string
  smtp_servers: string
  smtp_proton_user: string
  smtp_proton_pass: string
  smtp_proton_host: string
  smtp_proton_port: string
  smtp_proton_secure: string
  resend_api_key: string
  email_from: string
  default_logic_builder_config: string
  default_nova_points_config: string
}

const DEFAULT_SETTINGS: SettingsState = {
  platform_name: 'BNFX',
  currency: 'USDC',
  min_withdrawal: '10',
  withdrawal_fee: '2',
  trading_days: 'monday,tuesday,wednesday,thursday,friday',
  profit_cycle: 'weekly',
  challenges_enabled: 'false',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  branding_mode: 'name',
  smtp_gmail_user: '',
  smtp_gmail_pass: '',
  smtp_servers: '',
  smtp_proton_user: '',
  smtp_proton_pass: '',
  smtp_proton_host: '127.0.0.1',
  smtp_proton_port: '1025',
  smtp_proton_secure: 'false',
  resend_api_key: '',
  email_from: 'BNFX <onboarding@resend.dev>',
  default_logic_builder_config: '',
  default_nova_points_config: '',
}

export function SettingsTab() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testRecipient, setTestRecipient] = useState('')
  const [testingMail, setTestingMail] = useState(false)

  const handleSendTestMail = async () => {
    if (!testRecipient.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a recipient email address.', variant: 'destructive' })
      return
    }
    setTestingMail(true)
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testRecipient,
          smtpUser: settings.smtp_gmail_user,
          smtpPass: settings.smtp_gmail_pass,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ title: 'Success', description: 'Test email dispatched successfully! Check your inbox/spam folder.' })
      } else {
        throw new Error(data.error || 'Failed to dispatch test mail')
      }
    } catch (err: any) {
      toast({ title: 'SMTP Verification Failed', description: err.message, variant: 'destructive' })
    } finally {
      setTestingMail(false)
    }
  }

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSettings({ ...DEFAULT_SETTINGS, ...data })
    } catch {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Settings Saved', description: 'Platform settings have been updated' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleTradingDay = (day: string) => {
    const current = settings.trading_days.split(',').filter(Boolean)
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day]
    setSettings(prev => ({ ...prev, trading_days: updated.join(',') }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-10 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your trading platform</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-400" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Platform Name</Label>
              <Input
                value={settings.platform_name}
                onChange={e => setSettings(prev => ({ ...prev, platform_name: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Currency</Label>
              <Input
                value={settings.currency}
                onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Minimum Withdrawal Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={settings.min_withdrawal}
                  onChange={e => setSettings(prev => ({ ...prev, min_withdrawal: e.target.value }))}
                  className="bg-muted/50 border-border/50 pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Withdrawal Fee (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={settings.withdrawal_fee}
                  onChange={e => setSettings(prev => ({ ...prev, withdrawal_fee: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Days */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Trading Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map(day => {
                const isActive = settings.trading_days.split(',').includes(day.value)
                return (
                  <label
                    key={day.value}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <Checkbox
                      checked={isActive}
                      onCheckedChange={() => toggleTradingDay(day.value)}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Profit Cycle & Features */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Profit & Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Profit Cycle</Label>
              <div className="flex gap-2">
                {['weekly', 'monthly'].map(cycle => (
                  <button
                    key={cycle}
                    onClick={() => setSettings(prev => ({ ...prev, profit_cycle: cycle }))}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                      settings.profit_cycle === cycle
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'border-border/50 text-muted-foreground hover:border-border'
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Challenges</p>
                <p className="text-xs text-muted-foreground">Enable challenge features</p>
              </div>
              <Switch
                checked={settings.challenges_enabled === 'true'}
                onCheckedChange={checked =>
                  setSettings(prev => ({ ...prev, challenges_enabled: checked ? 'true' : 'false' }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMTP & Transactional Emails Configuration */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-400" />
            SMTP & Transactional Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Gmail SMTP User (Email)</Label>
              <Input
                type="email"
                placeholder="e.g. keralagda@gmail.com"
                value={settings.smtp_gmail_user}
                onChange={e => setSettings(prev => ({ ...prev, smtp_gmail_user: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
              <p className="text-[10px] text-muted-foreground">The Gmail address used to authenticate and send verification messages.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Gmail App Password</Label>
              <Input
                type="password"
                placeholder="e.g. vycj vyaf eryv ewql"
                value={settings.smtp_gmail_pass}
                onChange={e => setSettings(prev => ({ ...prev, smtp_gmail_pass: e.target.value }))}
                className="bg-muted/50 border-border/50 font-mono"
              />
              <p className="text-[10px] text-muted-foreground">App-specific password generated in your Google Account security settings.</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Resend and Sender Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Resend API Key</Label>
              <Input
                type="password"
                placeholder="re_123456789"
                value={settings.resend_api_key}
                onChange={e => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))}
                className="bg-muted/50 border-border/50 font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Resend delivery service authorization key (alternative to Gmail SMTP).</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">System Sender Email (From)</Label>
              <Input
                type="text"
                placeholder="BNFX <onboarding@resend.dev>"
                value={settings.email_from}
                onChange={e => setSettings(prev => ({ ...prev, email_from: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
              <p className="text-[10px] text-muted-foreground">Default envelope header sender address shown on messages.</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Proton Bridge Local SMTP Settings */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proton Bridge Local SMTP Settings</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-muted-foreground font-medium">Proton User</Label>
                <Input
                  type="text"
                  placeholder="e.g. proton-bridge-user"
                  value={settings.smtp_proton_user}
                  onChange={e => setSettings(prev => ({ ...prev, smtp_proton_user: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-muted-foreground font-medium">Proton Password</Label>
                <Input
                  type="password"
                  value={settings.smtp_proton_pass}
                  onChange={e => setSettings(prev => ({ ...prev, smtp_proton_pass: e.target.value }))}
                  className="bg-muted/50 border-border/50 font-mono"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-muted-foreground font-medium">Proton Host</Label>
                <Input
                  type="text"
                  value={settings.smtp_proton_host}
                  onChange={e => setSettings(prev => ({ ...prev, smtp_proton_host: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground font-medium">Proton Port</Label>
                <Input
                  type="number"
                  value={settings.smtp_proton_port}
                  onChange={e => setSettings(prev => ({ ...prev, smtp_proton_port: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground font-medium">Proton Secure (TLS)</Label>
                <select
                  value={settings.smtp_proton_secure}
                  onChange={e => setSettings(prev => ({ ...prev, smtp_proton_secure: e.target.value }))}
                  className="w-full bg-muted/50 border border-border/50 text-xs rounded-md h-9 px-2 text-foreground focus:outline-none"
                >
                  <option value="false">No (STARTTLS)</option>
                  <option value="true">Yes (SSL/TLS)</option>
                </select>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* SMTP Rotation List */}
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">SMTP Rotation Servers List</Label>
            <Textarea
              placeholder="host:port:user:pass:from,host2:port2:user2:pass2:from2"
              value={settings.smtp_servers}
              onChange={e => setSettings(prev => ({ ...prev, smtp_servers: e.target.value }))}
              className="bg-muted/50 border-border/50 text-xs font-mono h-16 resize-none"
            />
            <p className="text-[10px] text-muted-foreground">Comma-separated servers for round-robin rotation. Format: <code>host:port:user:pass:from</code></p>
          </div>

          <Separator className="bg-border/50" />

          {/* Test Mail Section */}
          <div className="space-y-3 max-w-lg">
            <Label className="text-muted-foreground font-medium">Verify SMTP Connection Settings</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter recipient email address..."
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
                className="bg-muted/50 border-border/50 text-xs h-9"
              />
              <Button
                onClick={handleSendTestMail}
                disabled={testingMail}
                className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-mono shrink-0 h-9"
              >
                {testingMail ? 'Testing...' : 'Send Test Mail'}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Attempts to authenticate with Gmail SMTP and send a verification test email to the address above before saving.</p>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Default Configuration Templates CRUD */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-violet-400" />
            System Default Config Templates (Editable DB-backed JSON)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">Default Logic Builder Config Template</Label>
            <Textarea
              placeholder='Enter valid JSON for Logic Builder defaults...'
              value={settings.default_logic_builder_config}
              onChange={e => setSettings(prev => ({ ...prev, default_logic_builder_config: e.target.value }))}
              className="bg-muted/50 border-border/50 text-xs font-mono h-32"
            />
            <p className="text-[10px] text-muted-foreground">Defaults applied during Logic builder resets. Must be valid JSON matching the Logic Builder schema.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">Default Nova Points Config Template</Label>
            <Textarea
              placeholder='Enter valid JSON for Nova Points defaults...'
              value={settings.default_nova_points_config}
              onChange={e => setSettings(prev => ({ ...prev, default_nova_points_config: e.target.value }))}
              className="bg-muted/50 border-border/50 text-xs font-mono h-32"
            />
            <p className="text-[10px] text-muted-foreground">Defaults applied during Nova Points resets. Must be valid JSON matching the Nova Points config schema.</p>
          </div>
        </CardContent>
      </Card>

      {/* Branding & Logo Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-emerald-400" />
            Branding & Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Mode */}
          <div className="space-y-3">
            <Label className="text-muted-foreground font-medium">Header & Footer Display</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'name', label: 'Name Only', icon: <Type className="h-5 w-5" />, desc: 'Show platform name text' },
                { value: 'name_logo', label: 'Name + Logo', icon: <><ImageIcon className="h-4 w-4" /><Type className="h-4 w-4" /></>, desc: 'Logo beside name' },
                { value: 'logo', label: 'Logo Only', icon: <ImageIcon className="h-5 w-5" />, desc: 'Show logo image only' },
              ].map(mode => (
                <button
                  key={mode.value}
                  onClick={() => setSettings(prev => ({ ...prev, branding_mode: mode.value }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    settings.branding_mode === mode.value
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-1">{mode.icon}</div>
                  <span className="text-xs font-medium">{mode.label}</span>
                  <span className="text-[10px] opacity-60">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logo Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Logo */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Main Logo</Label>
              <p className="text-[10px] text-muted-foreground">Recommended: 200×50px, PNG/SVG with transparent background</p>
              <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                {settings.logo_url ? (
                  <div className="space-y-2">
                    <img src={settings.logo_url} alt="Logo" className="h-10 mx-auto object-contain" />
                    <Button variant="ghost" size="sm" className="text-xs text-rose-400" onClick={() => setSettings(prev => ({ ...prev, logo_url: '' }))}>Remove</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">200 × 50 px</p>
                  </div>
                )}
              </div>
              <Input
                value={settings.logo_url}
                onChange={e => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="Paste logo URL or upload in Media"
                className="text-xs h-8"
              />
            </div>

            {/* Dark Mode Logo */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Dark Mode Logo</Label>
              <p className="text-[10px] text-muted-foreground">For dark backgrounds. 200×50px, PNG/SVG, light colored</p>
              <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center bg-black/20 hover:border-primary/30 transition-colors">
                {settings.logo_dark_url ? (
                  <div className="space-y-2">
                    <img src={settings.logo_dark_url} alt="Dark Logo" className="h-10 mx-auto object-contain" />
                    <Button variant="ghost" size="sm" className="text-xs text-rose-400" onClick={() => setSettings(prev => ({ ...prev, logo_dark_url: '' }))}>Remove</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">200 × 50 px</p>
                  </div>
                )}
              </div>
              <Input
                value={settings.logo_dark_url}
                onChange={e => setSettings(prev => ({ ...prev, logo_dark_url: e.target.value }))}
                placeholder="Paste dark logo URL"
                className="text-xs h-8"
              />
            </div>

            {/* Favicon */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Favicon</Label>
              <p className="text-[10px] text-muted-foreground">Browser tab icon. 32×32px or 64×64px, PNG/ICO/SVG</p>
              <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                {settings.favicon_url ? (
                  <div className="space-y-2">
                    <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 mx-auto object-contain" />
                    <Button variant="ghost" size="sm" className="text-xs text-rose-400" onClick={() => setSettings(prev => ({ ...prev, favicon_url: '' }))}>Remove</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">32 × 32 px</p>
                  </div>
                )}
              </div>
              <Input
                value={settings.favicon_url}
                onChange={e => setSettings(prev => ({ ...prev, favicon_url: e.target.value }))}
                placeholder="Paste favicon URL"
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground font-medium">Preview</Label>
            <div className="rounded-xl border border-border/50 p-4 bg-background/50">
              <div className="flex items-center gap-3">
                {(settings.branding_mode === 'logo' || settings.branding_mode === 'name_logo') && (
                  settings.logo_dark_url || settings.logo_url ? (
                    <img src={settings.logo_dark_url || settings.logo_url} alt="Logo" className="h-8 object-contain" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-400">B</span>
                    </div>
                  )
                )}
                {(settings.branding_mode === 'name' || settings.branding_mode === 'name_logo') && (
                  <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                    {settings.platform_name || 'BNFX'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">This is how your brand will appear in the header and footer</p>
            </div>
          </div>

          {/* Size Guide */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
            <p className="text-xs font-medium mb-2">📐 Recommended Sizes</p>
            <div className="grid grid-cols-3 gap-3 text-[10px] text-muted-foreground">
              <div className="p-2 rounded bg-background/50">
                <p className="font-medium text-foreground">Main Logo</p>
                <p>200 × 50 px</p>
                <p>PNG or SVG</p>
                <p>Transparent BG</p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="font-medium text-foreground">Dark Logo</p>
                <p>200 × 50 px</p>
                <p>PNG or SVG</p>
                <p>Light/white color</p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="font-medium text-foreground">Favicon</p>
                <p>32 × 32 px (min)</p>
                <p>64 × 64 px (best)</p>
                <p>PNG, ICO, or SVG</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
