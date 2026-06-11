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
import QRCode from 'qrcode'

function QRPreview({ value }: { value: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (!value) return
    QRCode.toDataURL(value, { margin: 1 })
      .then(setSrc)
      .catch(() => {})
  }, [value])

  if (!src) return <span className="text-[9px] text-muted-foreground animate-pulse">Generating...</span>
  return <img src={src} alt="QR Code" className="h-full w-full object-contain" />
}

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
      { key: 'network', label: 'Network', placeholder: 'e.g. bsc, polygon, ethereum' },
      { key: 'address', label: 'Admin Wallet Receive Address', placeholder: '0x...' },
      { key: 'apiSecret', label: 'Token Contract Address', placeholder: 'e.g. 0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' },
      { key: 'apiKey', label: 'JSON-RPC Provider Node URL', placeholder: 'e.g. https://bsc-dataseed.binance.org/' },
      { key: 'webhookUrl', label: 'Block Explorer Tx URL Prefix', placeholder: 'e.g. https://bscscan.com/tx/' },
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
  manual: {
    label: 'Manual Gateway',
    icon: CreditCard,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    fields: [
      { key: 'network', label: 'Network / Platform Name', placeholder: 'e.g. BEP-20, ERC-20, UPI, Bank Transfer' },
      { key: 'address', label: 'Manual Receiving Address / Account Details', placeholder: 'Enter wallet address, bank account details, or UPI ID' },
      { key: 'instructions', label: 'Payment Instructions for User', placeholder: 'Enter step-by-step payment instructions' },
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

  const handleAddNew = (type: 'crypto' | 'indian' | 'manual') => {
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
      qrImage: '',
      instructions: '',
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
  const manualGateways = gateways.filter(g => g.type === 'manual')

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

      <Separator className="bg-border/50" />

      {/* Manual Gateways */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Manual Gateways</h3>
              <p className="text-xs text-muted-foreground">Manual payments via transfers with QR uploads and instructions</p>
            </div>
          </div>
          <Button onClick={() => handleAddNew('manual')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Manual Gateway
          </Button>
        </div>

        {manualGateways.map(gw => (
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

        {manualGateways.length === 0 && (
          <Card className="bg-card/50 border-border/50 border-dashed">
            <CardContent className="py-8 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No Manual gateways configured</p>
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
              <div key={field.key} className={cn("space-y-2", field.key === 'instructions' ? "col-span-2" : "")}>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</Label>
                {field.key === 'instructions' ? (
                  <textarea
                    value={(gateway as any)[field.key] || ''}
                    onChange={e => onChange(gateway.id, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/50"
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={(gateway as any)[field.key] || ''}
                    onChange={e => onChange(gateway.id, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-muted/50 border-border/50"
                  />
                )}
              </div>
            ))}
          </div>

          {gateway.type === 'manual' && (
            <div className="border border-border/50 rounded-lg p-4 bg-muted/20 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">QR Code Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Upload Custom QR Code (optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        onChange(gateway.id, 'qrImage', reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }}
                    className="bg-muted/50 border-border/50 cursor-pointer"
                  />
                  {gateway.qrImage && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-muted-foreground">Custom QR Uploaded:</p>
                      <img src={gateway.qrImage} alt="Uploaded QR" className="h-28 w-28 object-contain border border-border/50 rounded p-1 bg-white" />
                      <Button variant="destructive" onClick={() => onChange(gateway.id, 'qrImage', '')} className="text-[10px] px-2 py-0.5 h-6">Remove Upload</Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex flex-col justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground">Auto-Generated QR Preview</Label>
                    <p className="text-[10px] text-muted-foreground">If no custom QR is uploaded, a QR will be generated automatically from the manual address field.</p>
                  </div>
                  {gateway.address ? (
                    <div className="mt-2 p-1 border border-border/50 rounded w-28 h-28 bg-white flex items-center justify-center">
                      <QRPreview value={gateway.address} />
                    </div>
                  ) : (
                    <div className="mt-2 w-28 h-28 border border-border/50 border-dashed rounded flex items-center justify-center text-[10px] text-muted-foreground text-center p-2 bg-muted/20">
                      Enter address to see preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                  {gateway.type === 'crypto' || gateway.type === 'manual' ? gateway.network : 'INR'}
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

        {/* Render manual instructions/QR in view mode */}
        {gateway.type === 'manual' && (
          <div className="mt-4 text-xs border border-border/30 rounded-lg p-3 bg-muted/10 flex gap-4 items-start">
            {gateway.qrImage ? (
              <img src={gateway.qrImage} alt="QR Code" className="h-16 w-16 object-contain bg-white border border-border/50 rounded p-0.5 shrink-0" />
            ) : gateway.address ? (
              <div className="h-16 w-16 bg-white border border-border/50 rounded p-0.5 flex items-center justify-center shrink-0">
                <QRPreview value={gateway.address} />
              </div>
            ) : null}
            <div className="space-y-1 overflow-hidden">
              <p className="font-semibold text-foreground text-[10px]">RECEIVING DETAILS / ADDRESS:</p>
              <p className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[10px] text-cyan-400 break-all select-all inline-block">{gateway.address || 'None'}</p>
              {gateway.instructions && (
                <>
                  <p className="font-semibold text-foreground text-[10px] mt-2">INSTRUCTIONS:</p>
                  <p className="text-muted-foreground text-[10px] whitespace-pre-wrap">{gateway.instructions}</p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
