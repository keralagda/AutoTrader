'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, ArrowUpCircle, Clock, ExternalLink } from 'lucide-react'

interface WithdrawalRecord {
  id: string
  userId: string
  amount: number
  walletAddress: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  txHash: string | null
  createdAt: string
  updatedAt: string
  user: { name: string; email: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10', icon: Clock },
  approved: { label: 'Approved', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'border-rose-500/30 text-rose-400 bg-rose-500/10', icon: XCircle },
  completed: { label: 'Completed', color: 'border-green-500/30 text-green-400 bg-green-500/10', icon: ArrowUpCircle },
}

export function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [txHashModal, setTxHashModal] = useState<string | null>(null)
  const [txHash, setTxHash] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/withdrawals')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWithdrawals(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load withdrawals', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWithdrawals() }, [fetchWithdrawals])

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Withdrawal Updated', description: `Status changed to ${status}` })
      window.dispatchEvent(new Event('admin-stats-refresh'))
      fetchWithdrawals()
    } catch {
      toast({ title: 'Error', description: 'Failed to update withdrawal', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkComplete = async () => {
    if (!txHashModal || !txHash) return
    setActionLoading(txHashModal)
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txHashModal, status: 'completed', txHash }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Withdrawal Completed', description: 'Transaction hash recorded' })
      setTxHashModal(null)
      setTxHash('')
      window.dispatchEvent(new Event('admin-stats-refresh'))
      fetchWithdrawals()
    } catch {
      toast({ title: 'Error', description: 'Failed to mark withdrawal as complete', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')
  const filteredWithdrawals = statusFilter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === statusFilter)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Withdrawal Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Review and process withdrawal requests</p>
      </div>

      {/* Pending Alert */}
      {pendingWithdrawals.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-400">
                  {pendingWithdrawals.length} Pending Withdrawal{pendingWithdrawals.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: ${pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)} USDC awaiting review
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map(status => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <Badge variant="secondary" className="ml-2 bg-muted/50 text-xs">
                {withdrawals.filter(w => w.status === status).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No withdrawals found</p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Wallet</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map(w => {
                    const statusConfig = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending
                    const StatusIcon = statusConfig.icon
                    return (
                      <TableRow key={w.id} className={`border-border/30 ${w.status === 'pending' ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-muted/30'}`}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">{w.user.name}</p>
                            <p className="text-xs text-muted-foreground">{w.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">${(w.amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 max-w-[180px]">
                            <code className="text-xs text-muted-foreground truncate">{w.walletAddress}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.color} gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                          {w.txHash && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]" title={w.txHash}>
                              TX: {w.txHash.slice(0, 10)}...
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {w.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(w.id, 'approved')}
                                  disabled={actionLoading === w.id}
                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 px-2"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(w.id, 'rejected')}
                                  disabled={actionLoading === w.id}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {w.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setTxHashModal(w.id); setTxHash('') }}
                                disabled={actionLoading === w.id}
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-8 px-2"
                              >
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TX Hash Dialog */}
      <Dialog open={!!txHashModal} onOpenChange={() => { setTxHashModal(null); setTxHash('') }}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-green-400" />
              Mark as Completed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Transaction Hash</label>
              <Input
                placeholder="0x..."
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                className="bg-muted/50 border-border/50"
              />
              <p className="text-xs text-muted-foreground">Enter the blockchain transaction hash for this withdrawal</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setTxHashModal(null); setTxHash('') }}>
                Cancel
              </Button>
              <Button
                onClick={handleMarkComplete}
                disabled={!txHash || actionLoading === txHashModal}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading === txHashModal ? 'Processing...' : 'Complete Withdrawal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
