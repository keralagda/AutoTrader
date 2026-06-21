'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { CreditCard, CheckCircle, XCircle, Clock, History, BarChart3, List } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

interface Payment { id: string; userId: string; amount: number; method: string; status: string; createdAt: string; user?: { name: string; email: string } }

export function AdminDepositsTab() {
  const { toast } = useToast()
  const { user } = useAppStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [requireConfirmation, setRequireConfirmation] = useState(false)
  const [historyData, setHistoryData] = useState<{
    deposits: any[]
    investments: any[]
  }>({ deposits: [], investments: [] })

  const loadHistory = () => {
    fetch('/api/admin/history')
      .then(res => res.json())
      .then(data => {
        if (data && data.deposits && data.investments) {
          setHistoryData(data)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/deposits').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([pays, settings]) => {
      if (Array.isArray(pays)) setPayments(pays)
      const confirmSetting = Array.isArray(settings) ? settings.find((s: any) => s.key === 'require_deposit_confirmation') : null
      setRequireConfirmation(confirmSetting?.value === 'true')
    }).catch(() => {})
    
    loadHistory()
  }, [])

  const handleToggleConfirmation = async (enabled: boolean) => {
    setRequireConfirmation(enabled)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'require_deposit_confirmation', value: enabled ? 'true' : 'false' }),
    })
    toast({ title: enabled ? 'Manual confirmation enabled' : 'Auto-confirm enabled' })
  }

  const handleAction = async (paymentId: string, action: 'confirm' | 'reject') => {
    const res = await fetch('/api/admin/deposits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, action, adminId: user?.id }),
    })
    if (res.ok) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: action === 'confirm' ? 'confirmed' : 'failed' } : p))
      toast({ title: `Deposit ${action === 'confirm' ? 'confirmed' : 'rejected'}` })
      window.dispatchEvent(new Event('admin-stats-refresh'))
      loadHistory()
    }
  }

  const pending = payments.filter(p => p.status === 'pending')
  const confirmed = payments.filter(p => p.status === 'confirmed')
  const rejected = payments.filter(p => p.status === 'failed')

  const statusBadge = (s: string) => s === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : s === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Deposit Confirmation Mode</p>
            <p className="text-xs text-muted-foreground">When enabled, deposits require manual admin approval before crediting the user&apos;s wallet.</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">{requireConfirmation ? 'Manual' : 'Auto'}</Label>
            <Switch checked={requireConfirmation} onCheckedChange={handleToggleConfirmation} />
          </div>
        </CardContent>
      </Card>

      {/* Deposits */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="size-4 text-primary" />Deposit Management</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            </TabsList>
            {['pending', 'confirmed', 'rejected'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {(tab === 'pending' ? pending : tab === 'confirmed' ? confirmed : rejected).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div>
                      <p className="text-sm font-medium">{p.user?.name || 'Unknown'} <span className="text-muted-foreground text-xs">({p.user?.email})</span></p>
                      <p className="text-xs text-muted-foreground">${p.amount.toFixed(2)} via {p.method} • {new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusBadge(p.status)}>{p.status}</Badge>
                      {p.status === 'pending' && (
                        <>
                          <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => handleAction(p.id, 'confirm')}><CheckCircle className="size-3" />Confirm</Button>
                          <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs" onClick={() => handleAction(p.id, 'reject')}><XCircle className="size-3" />Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {(tab === 'pending' ? pending : tab === 'confirmed' ? confirmed : rejected).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">No {tab} deposits</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* History & Analytics Card (Last 10) */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="size-4 text-primary animate-pulse" />
            Financial History & Analytics (Last 10 Events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart" className="gap-1.5 text-xs"><BarChart3 className="size-3.5" />Visual Chart</TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5 text-xs"><List className="size-3.5" />Date-wise History</TabsTrigger>
            </TabsList>
            
            {(() => {
              const mergedHistory = [
                ...historyData.deposits.map(d => ({
                  id: d.id,
                  name: d.user?.name || 'Unknown User',
                  email: d.user?.email || '',
                  type: 'Deposit',
                  amount: d.amount,
                  status: d.status,
                  createdAt: d.createdAt,
                  rawDate: new Date(d.createdAt),
                })),
                ...historyData.investments.map(i => ({
                  id: i.id,
                  name: i.user?.name || 'Unknown User',
                  email: i.user?.email || '',
                  type: 'Investment',
                  amount: i.amount,
                  status: i.status,
                  createdAt: i.createdAt,
                  rawDate: new Date(i.createdAt),
                }))
              ]
                .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
                .slice(0, 10)

              const chartData = [...mergedHistory].reverse().map(h => ({
                displayLabel: `${h.name.split(' ')[0]} (${h.type[0]})`,
                amount: h.amount,
                type: h.type,
                Deposit: h.type === 'Deposit' ? h.amount : 0,
                Investment: h.type === 'Investment' ? h.amount : 0,
              }))

              return (
                <>
                  <TabsContent value="chart" className="mt-4">
                    {chartData.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-6">No recent deposits or investments to graph</p>
                    ) : (
                      <div className="h-64 w-full bg-muted/10 border border-border/30 rounded-lg p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                              dataKey="displayLabel" 
                              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'rgba(20, 20, 20, 0.9)', borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }}
                              itemStyle={{ fontSize: '11px', color: '#fff' }}
                              labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                              formatter={(value: any, name: any, props: any) => [`$${value.toFixed(2)}`, props.payload.type]}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Bar dataKey="Deposit" fill="#10b981" radius={[4, 4, 0, 0]} name="Deposits" />
                            <Bar dataKey="Investment" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Investments" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="list" className="mt-4">
                    <div className="overflow-x-auto border border-border/30 rounded-lg bg-muted/10">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/50 text-muted-foreground uppercase font-bold bg-muted/40">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">User</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mergedHistory.map((h, i) => (
                            <tr key={h.id + '-' + i} className="border-b border-border/20 hover:bg-muted/20 transition-all">
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-foreground">{h.name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">{h.email}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant="outline" className={h.type === 'Deposit' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]' : 'bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]'}>
                                  {h.type}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-foreground text-sm">${h.amount.toFixed(2)}</td>
                              <td className="py-2.5 px-3">
                                <Badge className={h.status === 'confirmed' || h.status === 'active' || h.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 text-[10px]' : h.status === 'pending' ? 'bg-amber-500/20 text-amber-400 text-[10px]' : 'bg-rose-500/20 text-rose-400 text-[10px]'}>
                                  {h.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {mergedHistory.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-muted-foreground text-sm">
                                No recent deposit or investment activity found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </>
              )
            })()}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
