'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  HelpCircle,
  Search,
  Download,
  ChevronRight,
  BookOpen,
  Sparkles,
  Wallet,
  TrendingUp,
  Shield,
  Gift,
  Users,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react'
import { USER_HELP_GUIDES } from '@/lib/help-center-data'
import { useAppStore } from '@/lib/store'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Getting Started': BookOpen,
  'Deposits': Wallet,
  'Investing': TrendingUp,
  'Withdrawals': Wallet,
  'Nova Points': Sparkles,
  'Referrals': Users,
  'Security': Shield,
  'Resources': Gift,
  'Venture & Incubations': TrendingUp,
}

export function HelpCenterTab() {
  const { user } = useAppStore()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  // Gamification completed quizzes state
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([])
  
  // Active quiz states
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [quizError, setQuizError] = useState<string | null>(null)
  const [quizSuccess, setQuizSuccess] = useState(false)
  const [quizSubmitting, setQuizSubmitting] = useState(false)

  const categories = ['all', ...new Set(USER_HELP_GUIDES.map(g => g.category))]

  const filtered = USER_HELP_GUIDES.filter(g => {
    const matchesSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.content.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCategory === 'all' || g.category === activeCategory
    return matchesSearch && matchesCat
  })

  // Fetch completed quizzes
  const fetchCompletedQuizzes = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/gamification?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.completedQuizzes) {
          setCompletedQuizzes(data.completedQuizzes)
        }
      }
    } catch (error) {
      console.error('Failed to fetch completed quizzes:', error)
    }
  }, [user?.id])

  useEffect(() => {
    fetchCompletedQuizzes()
  }, [fetchCompletedQuizzes])

  const handleExportPDF = () => {
    const content = USER_HELP_GUIDES.map(g => `## ${g.title}\n**Category:** ${g.category}\n\n${g.content}\n\n---\n`).join('\n')
    const header = `# Black Nova FX - User Guide\n## How to Deposit, Invest, Earn & Withdraw\nGenerated: ${new Date().toLocaleDateString()}\n\n---\n\n`
    const blob = new Blob([header + content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'BNFX-User-Guide.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSubmitQuiz = async (quizId: string, quizQuestions: any[]) => {
    if (!user?.id) return
    
    // Validate answers
    let allCorrect = true
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] !== q.answerIndex) {
        allCorrect = false
      }
    })

    if (!allCorrect) {
      setQuizError('Incorrect answers. Please review the guide content and try again!')
      return
    }

    setQuizSubmitting(true)
    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'quiz_complete',
          quizId,
        }),
      })

      if (res.ok) {
        setQuizSuccess(true)
        // Add to local state immediately
        setCompletedQuizzes(prev => [...prev, quizId])
      } else {
        const errData = await res.json()
        setQuizError(errData.error || 'Failed to submit quiz completion.')
      }
    } catch (err) {
      console.error('Quiz submission error:', err)
      setQuizError('Network error. Please try again.')
    } finally {
      setQuizSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <HelpCircle className="size-4 text-primary" />
          <span className="text-sm font-medium text-primary">Help Center</span>
        </div>
        <h2 className="text-2xl font-bold">How can we help you?</h2>
        <p className="text-sm text-muted-foreground">Step-by-step guides on deposits, investing, earning, and withdrawals</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for help..." className="pl-9 h-10" />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map(cat => (
          <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat)} className="gap-1.5 capitalize">
            {cat !== 'all' && CATEGORY_ICONS[cat] && (() => { const Icon = CATEGORY_ICONS[cat]; return <Icon className="size-3.5" /> })()}
            {cat === 'all' ? `All (${USER_HELP_GUIDES.length})` : cat}
          </Button>
        ))}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
          <Download className="size-3.5" />Export Guide as PDF
        </Button>
      </div>

      {/* Guides */}
      <div className="space-y-2">
        {filtered.map(guide => {
          const isExpanded = expandedId === guide.id
          return (
            <Card key={guide.id} className={`border-border/50 transition-all ${isExpanded ? 'border-primary/30 bg-primary/5' : 'hover:border-border'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : guide.id)}>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[9px] shrink-0">{guide.category}</Badge>
                    <h4 className="text-sm font-medium">{guide.title}</h4>
                  </div>
                  <ChevronRight className={`size-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 cursor-default">
                    {guide.content.split('\n').map((line, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">{line}</p>
                    ))}

                    {/* Inline Quiz Section */}
                    {guide.quiz && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                        {completedQuizzes.includes(guide.id) ? (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <div className="text-xs">
                              <p className="font-semibold">Assessment Completed ✓</p>
                              <p className="opacity-80">You have earned 50 XP for this guide.</p>
                            </div>
                          </div>
                        ) : activeQuizId === guide.id ? (
                          <div className="p-4 rounded-xl border border-primary/20 bg-background/50 space-y-4">
                            {quizSuccess ? (
                              <div className="text-center py-6 space-y-3">
                                <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                                  <Sparkles className="size-6 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="font-bold text-sm text-emerald-400">Perfect Score!</h5>
                                  <p className="text-xs text-muted-foreground">You completed the assessment and earned +50 XP!</p>
                                </div>
                                <Button size="sm" onClick={() => { setActiveQuizId(null); setQuizSuccess(false); }} className="mt-2">
                                  Done
                                </Button>
                              </div>
                            ) : (
                              <div>
                                {/* Header / Progress */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                  <span>Question {currentQuestionIndex + 1} of {guide.quiz.length}</span>
                                  <span className="font-medium text-primary">XP Reward: +50 XP</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                                  <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / guide.quiz.length) * 100}%` }}
                                  />
                                </div>

                                {/* Question */}
                                <h5 className="text-sm font-semibold text-foreground mb-3">
                                  {guide.quiz[currentQuestionIndex].question}
                                </h5>

                                {/* Options */}
                                <div className="space-y-2">
                                  {guide.quiz[currentQuestionIndex].options.map((option, optIdx) => {
                                    const isSelected = selectedAnswers[currentQuestionIndex] === optIdx
                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const newAnswers = [...selectedAnswers]
                                          newAnswers[currentQuestionIndex] = optIdx
                                          setSelectedAnswers(newAnswers)
                                          setQuizError(null)
                                        }}
                                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                                          isSelected
                                            ? 'bg-primary/10 border-primary text-primary font-medium shadow-sm shadow-primary/10'
                                            : 'bg-card border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`size-4 rounded-full border flex items-center justify-center ${
                                            isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                                          }`}>
                                            {isSelected && <div className="size-1.5 bg-background rounded-full" />}
                                          </div>
                                          <span>{option}</span>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>

                                {/* Error Message */}
                                {quizError && (
                                  <p className="text-xs text-rose-400 font-medium mt-3 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                                    ⚠️ {quizError}
                                  </p>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentQuestionIndex === 0}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCurrentQuestionIndex(prev => prev - 1)
                                    }}
                                  >
                                    Back
                                  </Button>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveQuizId(null)
                                      }}
                                    >
                                      Reset Quiz
                                    </Button>
                                    {currentQuestionIndex < guide.quiz.length - 1 ? (
                                      <Button
                                        size="sm"
                                        disabled={selectedAnswers[currentQuestionIndex] === undefined}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCurrentQuestionIndex(prev => prev + 1)
                                        }}
                                      >
                                        Next
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        disabled={selectedAnswers[currentQuestionIndex] === undefined || quizSubmitting}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSubmitQuiz(guide.id, guide.quiz!)
                                        }}
                                      >
                                        {quizSubmitting ? 'Submitting...' : 'Submit Answers'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full sm:w-auto gap-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveQuizId(guide.id)
                              setCurrentQuestionIndex(0)
                              setSelectedAnswers([])
                              setQuizError(null)
                              setQuizSuccess(false)
                            }}
                          >
                            <Sparkles className="size-3.5" />
                            Take Assessment (+50 XP)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="size-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No guides found for your search</p>
          </div>
        )}
      </div>
    </div>
  )
}
