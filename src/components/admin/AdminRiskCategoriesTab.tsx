'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Shield, Loader2, Save, Users } from 'lucide-react'

interface UserRisk {
  id: string
  name: string
  email: string
  riskCategory: string
  customWinMin: number | null
  customWinMax: number | null
  totalDeposited: number
  isActive: boolean
}

interface Categories {
  low: { label: string; minPercent: number; maxPercent: number }
  medium: { label: string; minPercent: number; maxPercent: number }
  high: { label: string; minPercent: number; maxPercent: number }
}

export function AdminRiskCategoriesTab() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRisk[]>([])
  const [categories, setCategories] = useState<Categories>({
    low: { label: 'Low Risk', minPercent: 0.5, maxPercent: 2.0 },
    medium: { label: 'Medium Risk', minPercent: 2.0, maxPercent: 5.0 },
    high: { label: 'High Risk', minPercent: 5.0, maxPercent: 15.0 },
  })
  const [counts, setCounts] = useState({ low: 0, medium: 0, high: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/risk-categories')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setCategories(data.categories || categories)
        setCounts(data.counts || { low: 0, medium: 0, high: 0 })
      }
    } catch {} finally { setLoading(false) }
  }

  const handleSaveCategories = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/risk-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      })
      if (res.ok) toast({ title: 'Category settings saved!' })
      else toast({ title: 'Failed to save', variant: 'destructive' })
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleAssignUser = async (userId: string, riskCategory: string) => {
    try {
      await fetch('/api/admin/risk-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, riskCategory }),
      })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, riskCategory } : u))
      toast({ title: 'User category updated' })
    } catch { toast({ title: 'Failed', variant: 'destructive' }) }
  }

  const handleSetCustom = async (userId: string, min: number, max: number) => {
    try {
      await fetch('/api/admin/risk-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, riskCategory: users.find(u => u.id === userId)?.riskCategory || 'medium', customWinMin: min, customWinMax: max }),
      })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, customWinMin: min, customWinMax: max } : u))
      toast({ title: 'Custom win % set' })
    } catch { toast({ title: 'Failed', variant: 'destructive' }) }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Risk Categories & Win %</h2>
        <p className="text-sm text-muted-foreground">Assign users to risk tiers and configure variable daily return percentages</p>
      </div>

      {/* Category Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Category Percentage Ranges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['low', 'medium', 'high'] as const).map(cat => {
              const colors = { low: 'emerald', medium: 'amber', high: 'rose' }
              const c = colors[cat]
              return (
                <div key={cat} className={`p-4 rounded-xl border border-${c}-500/20 bg-${c}-500/5`}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`bg-${c}-500/20 text-${c}-400 border-${c}-500/30 capitalize`}>{cat}</Badge>
                    <span className="text-xs text-muted-foreground">{counts[cat]} users</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Min %/day</Label>
                      <Input type="number" step="0.1" className="h-8 text-xs" value={categories[cat].minPercent} onChange={e => setCategories(prev => ({ ...prev, [cat]: { ...prev[cat], minPercent: parseFloat(e.target.value) || 0 } }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Max %/day</Label>
                      <Input type="number" step="0.1" className="h-8 text-xs" value={categories[cat].maxPercent} onChange={e => setCategories(prev => ({ ...prev, [cat]: { ...prev[cat], maxPercent: parseFloat(e.target.value) || 0 } }))} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <Button onClick={handleSaveCategories} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Ranges
          </Button>
        </CardContent>
      </Card>

      {/* User Assignments */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> User Assignments ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {users.filter(u => u.isActive).map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email} • ${(user.totalDeposited || 0).toFixed(0)} deposited</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={user.riskCategory} onValueChange={v => handleAssignUser(user.id, v)}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🔴 High</SelectItem>
                    </SelectContent>
                  </Select>
                  {user.customWinMin !== null && (
                    <Badge variant="outline" className="text-[9px]">{user.customWinMin}-{user.customWinMax}%</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
