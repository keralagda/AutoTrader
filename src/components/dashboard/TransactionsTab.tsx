'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollText, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { P2PTransferSection } from './P2PTransferSection'

interface Transaction {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  wallet: string
  description: string | null
  status: string
  createdAt: string
}

const typeColors: Record<string, string> = {
  deposit: 'bg-emerald-500/20 text-emerald-400',
  withdrawal: 'bg-rose-500/20 text-rose-400',
  investment: 'bg-amber-500/20 text-amber-400',
  profit: 'bg-cyan-500/20 text-cyan-400',
  referral: 'bg-violet-500/20 text-violet-400',
  transfer: 'bg-blue-500/20 text-blue-400',
  reinvest: 'bg-amber-500/20 text-amber-400',
  capital_return: 'bg-emerald-500/20 text-emerald-400',
  fee: 'bg-rose-500/20 text-rose-400',
  bonus: 'bg-cyan-500/20 text-cyan-400',
}

export function TransactionsTab() {
  const { user } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    const typeParam = filter !== 'all' ? `&type=${filter}` : ''
    fetch(`/api/transactions?userId=${user.id}&page=${page}${typeParam}`)
      .then(r => r.json())
      .then(data => {
        setTransactions(Array.isArray(data.transactions) ? data.transactions : [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id, page, filter])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Transaction History</h2>
          <p className="text-sm text-muted-foreground">Complete ledger of all your account movements</p>
        </div>
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
            <SelectItem value="withdrawal">Withdrawals</SelectItem>
            <SelectItem value="investment">Investments</SelectItem>
            <SelectItem value="profit">Profits</SelectItem>
            <SelectItem value="referral">Referrals</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
            <SelectItem value="reinvest">Reinvests</SelectItem>
            <SelectItem value="capital_return">Capital Returns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="size-4 text-primary" />
            Transactions ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  {tx.amount >= 0 ? (
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <ArrowUpRight className="size-4 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <ArrowDownRight className="size-4 text-rose-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] ${typeColors[tx.type] || 'bg-muted text-muted-foreground'}`}>{tx.type.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className="text-[9px]">{tx.wallet}</Badge>
                      {tx.status && tx.status !== 'completed' && (
                        <Badge className={`text-[9px] ${
                          tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {tx.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tx.description || tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Bal: ${(tx.balanceAfter || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && !loading && (
              <p className="text-center text-muted-foreground text-sm py-8">No transactions yet</p>
            )}
          </div>

          {total > 30 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border/30">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-xs text-muted-foreground self-center">Page {page} of {Math.ceil(total / 30)}</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* P2P Transfers */}
      <P2PTransferSection />
    </div>
  )
}
