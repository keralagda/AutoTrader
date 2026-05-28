'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Flag, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface FeatureFlag {
  key: string
  enabled: boolean
  label: string
  description: string
  category: string
}

export function AdminFeatureFlagsTab() {
  const { toast } = useToast()
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/feature-flags')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFlags(data) })
      .catch(() => toast({ title: 'Failed to load flags', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (key: string, enabled: boolean) => {
    setSaving(key)
    // Optimistic update
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled } : f))

    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: enabled }),
      })
      if (res.ok) {
        toast({ title: `${enabled ? 'Enabled' : 'Disabled'}: ${flags.find(f => f.key === key)?.label}` })
      } else {
        // Revert
        setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !enabled } : f))
        toast({ title: 'Failed to update', variant: 'destructive' })
      }
    } catch {
      setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !enabled } : f))
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
  }

  // Group by category
  const categories = [...new Set(flags.map(f => f.category))]
  const filtered = flags.filter(f =>
    f.label.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase()) ||
    f.key.toLowerCase().includes(search.toLowerCase())
  )
  const enabledCount = flags.filter(f => f.enabled).length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flag className="size-5 text-emerald-400" />
            Feature Flags
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Toggle platform features on/off instantly without code changes</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="size-3 mr-1" />
            {enabledCount} enabled
          </Badge>
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
            <XCircle className="size-3 mr-1" />
            {flags.length - enabledCount} disabled
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search features..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Flags by Category */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryFlags = filtered.filter(f => f.category === category)
          if (categoryFlags.length === 0) return null

          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
              <Card className="border-border/50">
                <CardContent className="p-0 divide-y divide-border/30">
                  {categoryFlags.map(flag => (
                    <div key={flag.key} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{flag.label}</p>
                          <code className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded font-mono">{flag.key}</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                      </div>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={v => handleToggle(flag.key, v)}
                        disabled={saving === flag.key}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
