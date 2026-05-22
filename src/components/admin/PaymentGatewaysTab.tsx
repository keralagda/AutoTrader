'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Plus, Save, Edit2, X, Trash2, CreditCard,
  Wallet, Landmark, Bitcoin, Shield, DollarSign, Globe,
} from 'lucide-react'
import type { PaymentGatewayType } from '@/lib/types'

interface EditableGateway extends PaymentGatewayType {
  isEditing?: boolean
  isNew?: boolean
}

const GATEWAY_TYPE_CONFIG: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  fields: { key: string; label: string; placeholder: string; type?: string }[]
}> = {
  crypto: {
    label: 'Cryptocurrency',
    icon: Bitcoin,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    fields: [
      { key: 'network', label: 'Network', placeholder: 'e.g. polygon, ethereum, bitcoin' },
      { key: 'address', label: 'Wallet Address', placeholder: '0x...' },
    ],
  },
  indian: {
    label: 'Indian Gateway',
    icon: Landmark,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Enter API key', type: 'password' },
      { key: 'apiSecret', label: 'API Secret', placeholder: 'Enter API secret', type: 'password' },
    ],
  },
}

export function PaymentGatewaysTab() {
  const [gateways, setGateways] = useState<EditableGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchGateways = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-gateways')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGateways(data.map((g: PaymentGatewayType) => ({ ...g, isEditing: false })))
    } catch {
      toast({ title: 'Error', description: 'Failed to load payment gateways', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGateways() }, [fetchGateways])

  const handleEdit = (id: string) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, isEditing: true } : g))
  }

  const handleCancel = (id: string) => {
    const gw = gateways.find(g => g.id === id)
    if (gw?.isNew) {
      setGateways(prev => prev.filter(g => g.id !== id))
    } else {
      fetchGateways()
    }
  }

  const handleChange = (id: string, field: string, value: string | number | boolean) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  const handleSave = async (gw: EditableGateway) => {
    if (!gw.name.trim()) {
      toast({ title: 'Error', description: 'Gateway name is required', variant: 'destructive' })
      return
    }
    setSaving(gw.id)
    try {
      if (gw.isNew) {
        const { id, isEditing, isNew, ...data } = gw as any
        const res = await fetch('/api/admin/payment-gateways', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'Gateway Created', description: `${gw.name} has been created` })
      } else {
        const { id, isEditing, isNew, ...data } = gw as any
        const res = await fetch('/api/admin/payment-gateways', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: gw.id, ...data }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'Gateway Updated', description: `${gw.name} has been updated` })
      }
      fetchGateways()
    } catch {
      toast({ title: 'Error', description: 'Failed to save gateway', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/admin/payment-gateways', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Gateway Deleted', description: 'Payment gateway has been removed' })
      fetchGateways()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete gateway', variant: 'destructive' })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleAddNew = (type: 'crypto' | 'indian') => {
    const config = GATEWAY_TYPE_CONFIG[type]
    const newGw: EditableGateway = {
      id: `new-${Date.now()}`,
      name: '',
      type,
      network: '',
      address: '',
      apiKey: '',
      apiSecret: '',
      minAmount: 10,
      maxAmount: 100000,
      feePercent: 0,
      isActive: false,
      sortOrder: gateways.length + 1,
      isEditing: true,
      isNew: true,
    }
    setGateways(prev => [...prev, newGw])
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cryptoGateways = gateways.filter(g => g.type === 'crypto')
  const indianGateways = gateways.filter(g => g.type === 'indian')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payment Gateways</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure crypto and Indian payment gateways</p>
      </div>

      {/* Crypto Gateways */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Bitcoin className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Crypto Gateways</h3>
              <p className="text-xs text-muted-foreground">USDC, BTC, ETH and other crypto payments</p>
            </div>
          </div>
          <Button onClick={() => handleAddNew('crypto')} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Crypto
          </Button>
        </div>

        {cryptoGateways.map(gw => (
          <GatewayCard
            key={gw.id}
            gateway={gw}
            saving={saving === gw.id}
            onEdit={() => handleEdit(gw.id)}
            onCancel={() => handleCancel(gw.id)}
            onSave={() => handleSave(gw)}
            onChange={handleChange}
            onDelete={() => setDeleteTarget(gw.id)}
            isDeleteTarget={deleteTarget === gw.id}
            onDeleteConfirm={() => handleDelete(gw.id)}
            onDeleteCancel={() => setDeleteTarget(null)}
          />
        ))}

        {cryptoGateways.length === 0 && (
          <Card className="bg-card/50 border-border/50 border-dashed">
            <CardContent className="py-8 text-center">
              <Bitcoin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No crypto gateways configured</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* Indian Gateways */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Indian Gateways</h3>
              <p className="text-xs text-muted-foreground">UPI, Bank Transfer, Razorpay and more</p>
            </div>
          </div>
          <Button onClick={() => handleAddNew('indian')} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Indian Gateway
          </Button>
        </div>

        {indianGateways.map(gw => (
          <GatewayCard
            key={gw.id}
            gateway={gw}
            saving={saving === gw.id}
            onEdit={() => handleEdit(gw.id)}
            onCancel={() => handleCancel(gw.id)}
            onSave={() => handleSave(gw)}
            onChange={handleChange}
            onDelete={() => setDeleteTarget(gw.id)}
            isDeleteTarget={deleteTarget === gw.id}
            onDeleteConfirm={() => handleDelete(gw.id)}
            onDeleteCancel={() => setDeleteTarget(null)}
          />
        ))}

        {indianGateways.length === 0 && (
          <Card className="bg-card/50 border-border/50 border-dashed">
            <CardContent className="py-8 text-center">
              <Landmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No Indian gateways configured</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Gateway Card ──────────────────────────────────────────────────────────
function GatewayCard({
  gateway,
  saving,
  onEdit,
  onCancel,
  onSave,
  onChange,
  onDelete,
  isDeleteTarget,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  gateway: EditableGateway
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onChange: (id: string, field: string, value: string | number | boolean) => void
  onDelete: () => void
  isDeleteTarget: boolean
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}) {
  const config = GATEWAY_TYPE_CONFIG[gateway.type] || GATEWAY_TYPE_CONFIG.crypto
  const Icon = config.icon

  if (gateway.isEditing) {
    return (
      <Card className={cn('bg-card/50', config.borderColor, 'border')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className={cn('h-4 w-4', config.color)} />
              {gateway.isNew ? 'New Gateway' : `Edit: ${gateway.name}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
              <Button size="sm" onClick={onSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <Save className="h-3.5 w-3.5" />{saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Gateway Name</Label>
              <Input
                value={gateway.name}
                onChange={e => onChange(gateway.id, 'name', e.target.value)}
                placeholder="e.g. USDC (Polygon)"
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sort Order</Label>
              <Input
                type="number"
                value={gateway.sortOrder}
                onChange={e => onChange(gateway.id, 'sortOrder', parseInt(e.target.value) || 0)}
                className="bg-muted/50 border-border/50"
              />
            </div>
          </div>

          {/* Type-specific fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.fields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</Label>
                <Input
                  type={field.type || 'text'}
                  value={(gateway as any)[field.key] || ''}
                  onChange={e => onChange(gateway.id, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-muted/50 border-border/50"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Min Amount ($)</Label>
              <Input
                type="number"
                value={gateway.minAmount}
                onChange={e => onChange(gateway.id, 'minAmount', parseFloat(e.target.value) || 0)}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Max Amount ($)</Label>
              <Input
                type="number"
                value={gateway.maxAmount}
                onChange={e => onChange(gateway.id, 'maxAmount', parseFloat(e.target.value) || 0)}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fee (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={gateway.feePercent}
                onChange={e => onChange(gateway.id, 'feePercent', parseFloat(e.target.value) || 0)}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 w-full">
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-xs text-muted-foreground">Enable for deposits</p>
                </div>
                <Switch
                  checked={gateway.isActive}
                  onCheckedChange={v => onChange(gateway.id, 'isActive', v)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // View mode
  return (
    <Card className="bg-card/50 border-border/50 hover:border-emerald-500/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{gateway.name}</p>
                <Badge
                  variant="outline"
                  className={gateway.isActive
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-border/50 text-muted-foreground bg-muted/50'
                  }
                >
                  {gateway.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {gateway.type === 'crypto' ? gateway.network : 'INR'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Fee: {gateway.feePercent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ${gateway.minAmount} - ${gateway.maxAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onEdit} className="text-muted-foreground hover:text-foreground">
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog open={isDeleteTarget} onOpenChange={open => { if (!open) onDeleteCancel() }}>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onDelete} className="text-muted-foreground hover:text-rose-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Gateway</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{gateway.name}&rdquo;? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
