'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CHALLENGE_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  BADGE_RARITY_LABELS,
  type ChallengeCategory,
  type ChallengeDifficulty,
  type BadgeRarity,
} from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Target,
  Award,
  Plus,
  Pencil,
  Trash2,
  Users,
  Star,
  Zap,
  RefreshCcw,
  ToggleLeft,
  Search,
} from 'lucide-react'

interface AdminChallenge {
  id: string
  title: string
  description: string
  category: string
  challengeType: string
  targetValue: number
  reward: number
  xpReward: number
  badgeIcon: string
  difficulty: string
  colorTheme: string
  streakBased: boolean
  requireStreakDays: number
  bonusMultiplier: number
  isRecurring: boolean
  recurrencePeriod: string
  startDate: string
  endDate?: string | null
  isActive: boolean
  sortOrder: number
  participantCount: number
}

interface AdminBadge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  xpRequired: number
  condition: string
  colorTheme: string
  isActive: boolean
  earnedByCount: number
}

const CHALLENGE_CATEGORIES: ChallengeCategory[] = ['daily', 'weekly', 'milestone', 'special', 'streak', 'referral', 'deposit']
const CHALLENGE_TYPES = ['target', 'streak', 'action']
const DIFFICULTIES: ChallengeDifficulty[] = ['easy', 'medium', 'hard', 'elite']
const COLOR_THEMES = ['emerald', 'amber', 'cyan', 'rose', 'violet']
const RECURRENCE_PERIODS = ['none', 'daily', 'weekly', 'monthly']
const BADGE_CATEGORIES = ['achievement', 'milestone', 'streak', 'social', 'special']
const BADGE_RARITIES: BadgeRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const EMPTY_CHALLENGE = {
  title: '',
  description: '',
  category: 'milestone',
  challengeType: 'target',
  targetValue: 1,
  reward: 0,
  xpReward: 0,
  badgeIcon: '🎯',
  difficulty: 'easy',
  colorTheme: 'emerald',
  streakBased: false,
  requireStreakDays: 0,
  bonusMultiplier: 1,
  isRecurring: false,
  recurrencePeriod: 'none',
  isActive: true,
  sortOrder: 0,
}

const EMPTY_BADGE = {
  name: '',
  description: '',
  icon: '🏅',
  category: 'achievement',
  rarity: 'common',
  xpRequired: 0,
  condition: '',
  colorTheme: 'emerald',
  isActive: true,
}

export function AdminChallengesTab() {
  const [challenges, setChallenges] = useState<AdminChallenge[]>([])
  const [badges, setBadges] = useState<AdminBadge[]>([])
  const [stats, setStats] = useState({ totalChallenges: 0, activeChallenges: 0, totalParticipations: 0, totalBadges: 0 })
  const [loading, setLoading] = useState(true)

  // Challenge form state
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<AdminChallenge | null>(null)
  const [challengeForm, setChallengeForm] = useState(EMPTY_CHALLENGE)
  const [savingChallenge, setSavingChallenge] = useState(false)

  // Badge form state
  const [showBadgeForm, setShowBadgeForm] = useState(false)
  const [editingBadge, setEditingBadge] = useState<AdminBadge | null>(null)
  const [badgeForm, setBadgeForm] = useState(EMPTY_BADGE)
  const [savingBadge, setSavingBadge] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'challenge' | 'badge'; id: string; name: string } | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/challenges')
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges)
        setBadges(data.badges)
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch admin challenges:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openNewChallenge = () => {
    setEditingChallenge(null)
    setChallengeForm(EMPTY_CHALLENGE)
    setShowChallengeForm(true)
  }

  const openEditChallenge = (challenge: AdminChallenge) => {
    setEditingChallenge(challenge)
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      challengeType: challenge.challengeType,
      targetValue: challenge.targetValue,
      reward: challenge.reward,
      xpReward: challenge.xpReward,
      badgeIcon: challenge.badgeIcon,
      difficulty: challenge.difficulty,
      colorTheme: challenge.colorTheme,
      streakBased: challenge.streakBased,
      requireStreakDays: challenge.requireStreakDays,
      bonusMultiplier: challenge.bonusMultiplier,
      isRecurring: challenge.isRecurring,
      recurrencePeriod: challenge.recurrencePeriod,
      isActive: challenge.isActive,
      sortOrder: challenge.sortOrder,
    })
    setShowChallengeForm(true)
  }

  const saveChallenge = async () => {
    setSavingChallenge(true)
    try {
      const url = '/api/admin/challenges'
      const method = editingChallenge ? 'PUT' : 'POST'
      const body = {
        type: 'challenge',
        ...(editingChallenge ? { id: editingChallenge.id } : {}),
        ...challengeForm,
        startDate: new Date().toISOString(),
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setShowChallengeForm(false)
        fetchData()
      }
    } catch (err) {
      console.error('Save challenge error:', err)
    } finally {
      setSavingChallenge(false)
    }
  }

  const openNewBadge = () => {
    setEditingBadge(null)
    setBadgeForm(EMPTY_BADGE)
    setShowBadgeForm(true)
  }

  const openEditBadge = (badge: AdminBadge) => {
    setEditingBadge(badge)
    setBadgeForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      xpRequired: badge.xpRequired,
      condition: badge.condition,
      colorTheme: badge.colorTheme,
      isActive: badge.isActive,
    })
    setShowBadgeForm(true)
  }

  const saveBadge = async () => {
    setSavingBadge(true)
    try {
      const url = '/api/admin/challenges'
      const method = editingBadge ? 'PUT' : 'POST'
      const body = {
        type: 'badge',
        ...(editingBadge ? { id: editingBadge.id } : {}),
        ...badgeForm,
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setShowBadgeForm(false)
        fetchData()
      }
    } catch (err) {
      console.error('Save badge error:', err)
    } finally {
      setSavingBadge(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/admin/challenges?type=${deleteTarget.type}&id=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  const toggleActive = async (type: 'challenge' | 'badge', id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/challenges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, isActive: !currentActive }),
      })
      if (res.ok) fetchData()
    } catch (err) {
      console.error('Toggle active error:', err)
    }
  }

  const filteredChallenges = challenges.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBadges = badges.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Target className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Challenges</p>
              <p className="text-xl font-bold">{stats.totalChallenges}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ToggleLeft className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold">{stats.activeChallenges}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Users className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Participations</p>
              <p className="text-xl font-bold">{stats.totalParticipations}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Award className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Badges</p>
              <p className="text-xl font-bold">{stats.totalBadges}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="challenges">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="challenges" className="gap-1.5">
              <Target className="size-4" /> Challenges
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1.5">
              <Award className="size-4" /> Badges
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
          </div>
        </div>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewChallenge} className="gap-1.5">
              <Plus className="size-4" /> New Challenge
            </Button>
          </div>

          <ScrollArea className="max-h-[600px]">
            <div className="space-y-3 pr-4">
              {filteredChallenges.map((challenge) => {
                const catInfo = CHALLENGE_CATEGORY_LABELS[challenge.category as ChallengeCategory]
                return (
                  <Card key={challenge.id} className={`bg-card/50 ${challenge.isActive ? 'border-border/50' : 'border-border/30 opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{challenge.badgeIcon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold truncate">{challenge.title}</p>
                              {catInfo && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                  {catInfo.icon} {catInfo.label}
                                </Badge>
                              )}
                              {challenge.isRecurring && (
                                <Badge className="text-[10px] bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shrink-0">
                                  <RefreshCcw className="size-2.5 mr-0.5" /> {challenge.recurrencePeriod}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{challenge.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-0.5"><Zap className="size-3 text-amber-400" /> {challenge.xpReward} XP</span>
                              {challenge.reward > 0 && <span className="flex items-center gap-0.5"><Star className="size-3 text-amber-400" /> ${challenge.reward}</span>}
                              <span className="flex items-center gap-0.5"><Users className="size-3" /> {challenge.participantCount} joined</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={challenge.isActive}
                            onCheckedChange={() => toggleActive('challenge', challenge.id, challenge.isActive)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEditChallenge(challenge)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => setDeleteTarget({ type: 'challenge', id: challenge.id, name: challenge.title })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {filteredChallenges.length === 0 && (
                <Card className="bg-card/30 border-border/30">
                  <CardContent className="p-8 text-center">
                    <Target className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No challenges found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewBadge} className="gap-1.5">
              <Plus className="size-4" /> New Badge
            </Button>
          </div>

          <ScrollArea className="max-h-[600px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
              {filteredBadges.map((badge) => {
                const rarityInfo = BADGE_RARITY_LABELS[badge.rarity as BadgeRarity]
                return (
                  <Card key={badge.id} className={`bg-card/50 ${badge.isActive ? 'border-border/50' : 'border-border/30 opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{badge.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold truncate">{badge.name}</p>
                              <Badge className={`text-[10px] ${rarityInfo.bgClass} ${rarityInfo.color} ${rarityInfo.borderClass}`}>
                                {rarityInfo.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>{badge.earnedByCount} earned</span>
                              {badge.xpRequired > 0 && <span>{badge.xpRequired} XP auto-unlock</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={badge.isActive}
                            onCheckedChange={() => toggleActive('badge', badge.id, badge.isActive)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEditBadge(badge)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => setDeleteTarget({ type: 'badge', id: badge.id, name: badge.name })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Challenge Form Dialog */}
      <Dialog open={showChallengeForm} onOpenChange={setShowChallengeForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              {editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
            </DialogTitle>
            <DialogDescription>
              {editingChallenge ? 'Modify challenge settings and rewards' : 'Set up a new challenge for your users'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    placeholder="Challenge title"
                    value={challengeForm.title}
                    onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the challenge in plain English..."
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Icon (Emoji)</Label>
                  <Input
                    placeholder="🎯"
                    value={challengeForm.badgeIcon}
                    onChange={(e) => setChallengeForm({ ...challengeForm, badgeIcon: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={challengeForm.category}
                    onValueChange={(v) => setChallengeForm({ ...challengeForm, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHALLENGE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CHALLENGE_CATEGORY_LABELS[cat]?.icon} {CHALLENGE_CATEGORY_LABELS[cat]?.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={challengeForm.challengeType}
                    onValueChange={(v) => setChallengeForm({ ...challengeForm, challengeType: v, streakBased: v === 'streak' })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHALLENGE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t === 'target' ? '🎯 Reach a target number' : t === 'streak' ? '🔥 Consecutive days' : '✅ Do something once'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select
                    value={challengeForm.difficulty}
                    onValueChange={(v) => setChallengeForm({ ...challengeForm, difficulty: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {'⭐'.repeat(DIFFICULTY_LABELS[d].stars)} {DIFFICULTY_LABELS[d].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Target & Rewards */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Target & Rewards</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={challengeForm.targetValue}
                    onChange={(e) => setChallengeForm({ ...challengeForm, targetValue: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-muted-foreground">The number users need to reach (e.g. 500 for $500 deposit)</p>
                </div>
                <div className="space-y-1.5">
                  <Label>USDC Reward</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={challengeForm.reward}
                    onChange={(e) => setChallengeForm({ ...challengeForm, reward: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>XP Reward</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={challengeForm.xpReward}
                    onChange={(e) => setChallengeForm({ ...challengeForm, xpReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bonus Multiplier</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    step="0.1"
                    value={challengeForm.bonusMultiplier}
                    onChange={(e) => setChallengeForm({ ...challengeForm, bonusMultiplier: parseFloat(e.target.value) || 1 })}
                  />
                  <p className="text-[10px] text-muted-foreground">2x means double reward (for special events)</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Streak & Recurrence */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Streak & Recurrence</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Streak-Based</Label>
                    <p className="text-[10px] text-muted-foreground">Requires consecutive days</p>
                  </div>
                  <Switch
                    checked={challengeForm.streakBased}
                    onCheckedChange={(v) => setChallengeForm({ ...challengeForm, streakBased: v })}
                  />
                </div>
                {challengeForm.streakBased && (
                  <div className="space-y-1.5">
                    <Label>Required Streak Days</Label>
                    <Input
                      type="number"
                      placeholder="7"
                      value={challengeForm.requireStreakDays}
                      onChange={(e) => setChallengeForm({ ...challengeForm, requireStreakDays: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Recurring</Label>
                    <p className="text-[10px] text-muted-foreground">Resets periodically</p>
                  </div>
                  <Switch
                    checked={challengeForm.isRecurring}
                    onCheckedChange={(v) => setChallengeForm({ ...challengeForm, isRecurring: v })}
                  />
                </div>
                {challengeForm.isRecurring && (
                  <div className="space-y-1.5">
                    <Label>Recurrence Period</Label>
                    <Select
                      value={challengeForm.recurrencePeriod}
                      onValueChange={(v) => setChallengeForm({ ...challengeForm, recurrencePeriod: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_PERIODS.filter((p) => p !== 'none').map((p) => (
                          <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Appearance */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Appearance</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Color Theme</Label>
                  <Select
                    value={challengeForm.colorTheme}
                    onValueChange={(v) => setChallengeForm({ ...challengeForm, colorTheme: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLOR_THEMES.map((t) => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={challengeForm.sortOrder}
                    onChange={(e) => setChallengeForm({ ...challengeForm, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Active</Label>
                    <p className="text-[10px] text-muted-foreground">Visible to users</p>
                  </div>
                  <Switch
                    checked={challengeForm.isActive}
                    onCheckedChange={(v) => setChallengeForm({ ...challengeForm, isActive: v })}
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={saveChallenge}
              disabled={savingChallenge || !challengeForm.title}
            >
              {savingChallenge ? 'Saving...' : editingChallenge ? 'Update Challenge' : 'Create Challenge'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Badge Form Dialog */}
      <Dialog open={showBadgeForm} onOpenChange={setShowBadgeForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="size-5 text-primary" />
              {editingBadge ? 'Edit Badge' : 'Create Badge'}
            </DialogTitle>
            <DialogDescription>
              {editingBadge ? 'Modify badge settings' : 'Create a new achievement badge for users to earn'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Badge Name</Label>
                <Input
                  placeholder="e.g. First Steps"
                  value={badgeForm.name}
                  onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="What this badge represents..."
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Icon (Emoji)</Label>
                <Input
                  placeholder="🏅"
                  value={badgeForm.icon}
                  onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={badgeForm.category}
                  onValueChange={(v) => setBadgeForm({ ...badgeForm, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BADGE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rarity</Label>
                <Select
                  value={badgeForm.rarity}
                  onValueChange={(v) => setBadgeForm({ ...badgeForm, rarity: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BADGE_RARITIES.map((r) => (
                      <SelectItem key={r} value={r}>{BADGE_RARITY_LABELS[r].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>XP Required (0 = no auto-unlock)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={badgeForm.xpRequired}
                  onChange={(e) => setBadgeForm({ ...badgeForm, xpRequired: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>How to Earn (Plain English)</Label>
                <Textarea
                  placeholder="e.g. Make your first deposit on the platform"
                  value={badgeForm.condition}
                  onChange={(e) => setBadgeForm({ ...badgeForm, condition: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color Theme</Label>
                <Select
                  value={badgeForm.colorTheme}
                  onValueChange={(v) => setBadgeForm({ ...badgeForm, colorTheme: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_THEMES.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Active</Label>
                  <p className="text-[10px] text-muted-foreground">Visible to users</p>
                </div>
                <Switch
                  checked={badgeForm.isActive}
                  onCheckedChange={(v) => setBadgeForm({ ...badgeForm, isActive: v })}
                />
              </div>
            </div>
            <Button
              className="w-full gap-2"
              onClick={saveBadge}
              disabled={savingBadge || !badgeForm.name}
            >
              {savingBadge ? 'Saving...' : editingBadge ? 'Update Badge' : 'Create Badge'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
              All user progress for this {deleteTarget?.type} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
