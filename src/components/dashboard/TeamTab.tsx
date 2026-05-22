'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, Copy, Check, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TeamMember {
  id: string
  name: string
  email: string
  totalDeposited: number
  totalEarnings: number
  isActive: boolean
  createdAt: string
}

interface TeamLevel {
  level: number
  members: TeamMember[]
  count: number
}

export function TeamTab() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [directReferrals, setDirectReferrals] = useState<TeamMember[]>([])
  const [teamByLevel, setTeamByLevel] = useState<TeamLevel[]>([])
  const [totalTeam, setTotalTeam] = useState(0)
  const [totalDirect, setTotalDirect] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/team?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setDirectReferrals(data.directReferrals || [])
        setTeamByLevel(data.teamByLevel || [])
        setTotalTeam(data.totalTeam || 0)
        setTotalDirect(data.totalDirect || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${user?.referralCode}`

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">My Team</h2>
        <p className="text-sm text-muted-foreground">Manage your referral network</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <UserPlus className="size-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalDirect}</p>
            <p className="text-xs text-muted-foreground">Direct Referrals</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="size-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalTeam}</p>
            <p className="text-xs text-muted-foreground">Total Team</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{teamByLevel.filter(l => l.count > 0).length}</p>
            <p className="text-xs text-muted-foreground">Active Levels</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">7</p>
            <p className="text-xs text-muted-foreground">Max Levels</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="size-4 text-primary" />
            New Registration - Share Your Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => handleCopy(referralLink)}>
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Referral Code</p>
              <p className="font-mono font-bold">{user?.referralCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Tabs */}
      <Tabs defaultValue="direct">
        <TabsList>
          <TabsTrigger value="direct">Direct Referrals</TabsTrigger>
          <TabsTrigger value="levels">Team (Level-wise)</TabsTrigger>
        </TabsList>

        <TabsContent value="direct" className="mt-4 space-y-3">
          {directReferrals.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <Users className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No direct referrals yet. Share your link to grow your team!</p>
              </CardContent>
            </Card>
          ) : (
            directReferrals.map(member => (
              <Card key={member.id} className="bg-card/50 border-border/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Deposited</p>
                    <p className="text-sm font-bold">${member.totalDeposited.toFixed(2)}</p>
                    <Badge className={member.isActive ? 'bg-emerald-500/20 text-emerald-400 text-[9px]' : 'bg-rose-500/20 text-rose-400 text-[9px]'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="levels" className="mt-4 space-y-3">
          {teamByLevel.map(level => (
            <Card key={level.level} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Level {level.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {[25, 20, 15, 10, 10, 10, 10][level.level - 1]}% commission
                    </span>
                  </div>
                  <span className="text-sm font-bold">{level.count} members</span>
                </div>
                {level.members.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {level.members.slice(0, 5).map(m => (
                      <div key={m.id} className="flex justify-between text-xs py-1 border-t border-border/30">
                        <span className="text-muted-foreground">{m.name}</span>
                        <span className="font-medium">${m.totalDeposited.toFixed(2)}</span>
                      </div>
                    ))}
                    {level.members.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        +{level.members.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
