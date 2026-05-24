'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle, RefreshCw, Loader2, Wallet, FileText, Phone, Globe, Users, ShieldAlert } from 'lucide-react'

interface DuplicateData {
  summary: {
    totalUsers: number
    duplicateWallets: number
    duplicateKYC: number
    duplicatePhones: number
    duplicateIPs: number
    totalFlags: number
  }
  duplicateWallets: { address: string; users: any[]; count: number }[]
  duplicateKYC: { documentType: string; documentNumber: string; records: any[]; count: number }[]
  duplicatePhones: { phone: string; users: any[]; count: number }[]
  duplicateIPs: { ip: string; users: any[]; count: number }[]
}

export function AdminDuplicatesTab() {
  const { toast } = useToast()
  const [data, setData] = useState<DuplicateData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/duplicates')
      if (res.ok) setData(await res.json())
      else toast({ title: 'Failed to load', variant: 'destructive' })
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            Duplicate Detection
          </h2>
          <p className="text-sm text-muted-foreground">Detect multi-accounting by shared wallets, KYC docs, phones, and IPs</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{data.summary.totalUsers}</p>
            <p className="text-[10px] text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 ${data.summary.duplicateWallets > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card/50'}`}>
          <CardContent className="p-4 text-center">
            <Wallet className="h-5 w-5 mx-auto mb-1 text-amber-400" />
            <p className="text-xl font-bold text-amber-400">{data.summary.duplicateWallets}</p>
            <p className="text-[10px] text-muted-foreground">Shared Wallets</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 ${data.summary.duplicateKYC > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-card/50'}`}>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-rose-400" />
            <p className="text-xl font-bold text-rose-400">{data.summary.duplicateKYC}</p>
            <p className="text-[10px] text-muted-foreground">Shared KYC Docs</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 ${data.summary.duplicatePhones > 0 ? 'bg-violet-500/5 border-violet-500/20' : 'bg-card/50'}`}>
          <CardContent className="p-4 text-center">
            <Phone className="h-5 w-5 mx-auto mb-1 text-violet-400" />
            <p className="text-xl font-bold text-violet-400">{data.summary.duplicatePhones}</p>
            <p className="text-[10px] text-muted-foreground">Shared Phones</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 ${data.summary.duplicateIPs > 0 ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-card/50'}`}>
          <CardContent className="p-4 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-cyan-400" />
            <p className="text-xl font-bold text-cyan-400">{data.summary.duplicateIPs}</p>
            <p className="text-[10px] text-muted-foreground">Shared IPs</p>
          </CardContent>
        </Card>
      </div>

      {/* No duplicates */}
      {data.summary.totalFlags === 0 && (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
            <p className="text-lg font-semibold text-emerald-400">All Clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No duplicate entries detected across all users</p>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Wallets */}
      {data.duplicateWallets.length > 0 && (
        <Card className="bg-card/50 border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-400" />
              Shared Wallet Addresses ({data.duplicateWallets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.duplicateWallets.map((dup, i) => (
              <div key={i} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-xs font-mono text-amber-400 truncate max-w-[300px]">{dup.address}</code>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{dup.count} users</Badge>
                </div>
                <div className="space-y-1">
                  {dup.users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{u.name} <span className="text-muted-foreground">({u.email})</span></span>
                      <Badge variant="outline" className="text-[9px]">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Duplicate KYC */}
      {data.duplicateKYC.length > 0 && (
        <Card className="bg-card/50 border-rose-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-rose-400" />
              Shared KYC Documents ({data.duplicateKYC.length})
              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[9px]">HIGH RISK</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.duplicateKYC.map((dup, i) => (
              <div key={i} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-medium text-rose-400 uppercase">{dup.documentType}</span>
                    <span className="text-xs text-muted-foreground ml-2">#{dup.documentNumber}</span>
                  </div>
                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">{dup.count} users</Badge>
                </div>
                <div className="space-y-1">
                  {dup.records.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{r.user.name} <span className="text-muted-foreground">({r.user.email})</span></span>
                      <Badge variant="outline" className={`text-[9px] ${r.status === 'approved' ? 'text-emerald-400' : r.status === 'pending' ? 'text-amber-400' : 'text-rose-400'}`}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Duplicate Phones */}
      {data.duplicatePhones.length > 0 && (
        <Card className="bg-card/50 border-violet-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-violet-400" />
              Shared Phone Numbers ({data.duplicatePhones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.duplicatePhones.map((dup, i) => (
              <div key={i} className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-violet-400">{dup.phone}</span>
                  <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">{dup.count} users</Badge>
                </div>
                <div className="space-y-1">
                  {dup.users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{u.name} <span className="text-muted-foreground">({u.email})</span></span>
                      <Badge variant="outline" className="text-[9px]">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Duplicate IPs */}
      {data.duplicateIPs.length > 0 && (
        <Card className="bg-card/50 border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              Shared IP Addresses ({data.duplicateIPs.length})
              <span className="text-[10px] text-muted-foreground font-normal">(may be VPN/shared network)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.duplicateIPs.slice(0, 10).map((dup, i) => (
              <div key={i} className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-400">{dup.ip}</span>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{dup.count} users</Badge>
                </div>
                <div className="space-y-1">
                  {dup.users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{u.name} <span className="text-muted-foreground">({u.email})</span></span>
                      <span className="text-[10px] text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
