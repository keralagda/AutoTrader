'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Globe, Shield, Loader2, X, Plus } from 'lucide-react'

interface GeoSettings {
  enabled: boolean
  blockedCountries: string[]
  allowedCountries: string[]
  blockMessage: string
}

export function AdminGeoBlockingTab() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<GeoSettings>({
    enabled: false,
    blockedCountries: [],
    allowedCountries: [],
    blockMessage: 'This service is not available in your region.',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCountry, setNewCountry] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/geo-blocking')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/geo-blocking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast({ title: 'Geo-blocking settings saved' })
      } else {
        toast({ title: 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const addBlockedCountry = () => {
    if (!newCountry.trim()) return
    const country = newCountry.trim().toUpperCase()
    if (!settings.blockedCountries.includes(country)) {
      setSettings({ ...settings, blockedCountries: [...settings.blockedCountries, country] })
    }
    setNewCountry('')
  }

  const removeBlockedCountry = (country: string) => {
    setSettings({ ...settings, blockedCountries: settings.blockedCountries.filter(c => c !== country) })
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Geo-Blocking Settings
        </h2>
        <p className="text-sm text-muted-foreground">Restrict access from specific countries</p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Enable Geo-Blocking</span>
            <Switch checked={settings.enabled} onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })} />
          </CardTitle>
          <CardDescription>When enabled, users from blocked countries cannot access the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Blocked Countries */}
          <div className="space-y-2">
            <Label>Blocked Countries (ISO codes)</Label>
            <div className="flex gap-2">
              <Input
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="e.g. US, CN, RU"
                onKeyDown={(e) => e.key === 'Enter' && addBlockedCountry()}
              />
              <Button onClick={addBlockedCountry} size="sm"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {settings.blockedCountries.map(country => (
                <Badge key={country} variant="outline" className="gap-1 text-rose-400 border-rose-500/30">
                  {country}
                  <button onClick={() => removeBlockedCountry(country)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {settings.blockedCountries.length === 0 && (
                <span className="text-xs text-muted-foreground">No countries blocked</span>
              )}
            </div>
          </div>

          {/* Block Message */}
          <div className="space-y-2">
            <Label>Block Message</Label>
            <Textarea
              value={settings.blockMessage}
              onChange={(e) => setSettings({ ...settings, blockMessage: e.target.value })}
              placeholder="Message shown to blocked users"
              rows={2}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
