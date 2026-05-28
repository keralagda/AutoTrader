'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Bot, Settings, BookOpen, Save, Loader2, Sparkles } from 'lucide-react'

interface ChatbotConfig {
  name: string
  personality: string
  greeting: string
  enabled: boolean
  model: string
  temperature: number
  maxTokens: number
}

export function AdminChatbotTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<ChatbotConfig>({
    name: 'Nova AI',
    personality: 'Friendly, helpful, and concise. Uses emojis occasionally.',
    greeting: 'Hi! I\'m Nova AI 🤖 — your BNFX assistant. Ask me anything about our plans, earnings, referrals, or how the platform works!',
    enabled: true,
    model: 'groq',
    temperature: 0.6,
    maxTokens: 400,
  })
  const [knowledgeBase, setKnowledgeBase] = useState('')

  useEffect(() => {
    fetch('/api/admin/chatbot')
      .then(r => r.json())
      .then(data => {
        if (data.config) setConfig(data.config)
        if (data.knowledgeBase) setKnowledgeBase(data.knowledgeBase)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/chatbot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, knowledgeBase }),
      })
      if (res.ok) {
        toast({ title: 'Chatbot settings saved' })
      } else {
        toast({ title: 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="size-5 text-emerald-400" />
            Nova AI Chatbot
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure AI chatbot behavior and knowledge base</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={config.enabled} onCheckedChange={v => setConfig(p => ({ ...p, enabled: v }))} />
            <span className="text-sm">{config.enabled ? 'Active' : 'Disabled'}</span>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="size-4" />
            AI Config
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5">
            <BookOpen className="size-4" />
            Knowledge Base
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bot Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bot Name</Label>
                  <Input value={config.name} onChange={e => setConfig(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Greeting Message</Label>
                  <Textarea
                    value={config.greeting}
                    onChange={e => setConfig(p => ({ ...p, greeting: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Personality / Tone</Label>
                  <Textarea
                    value={config.personality}
                    onChange={e => setConfig(p => ({ ...p, personality: e.target.value }))}
                    rows={3}
                    placeholder="Describe how the bot should communicate..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">AI Model</Label>
                  <select
                    value={config.model}
                    onChange={e => setConfig(p => ({ ...p, model: e.target.value }))}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="groq">Groq (Fast)</option>
                    <option value="mistral">Mistral</option>
                    <option value="nvidia">NVIDIA</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Temperature ({config.temperature})</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    onChange={e => setConfig(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Response Tokens</Label>
                  <Input
                    type="number"
                    value={config.maxTokens}
                    onChange={e => setConfig(p => ({ ...p, maxTokens: parseInt(e.target.value) || 400 }))}
                  />
                </div>
                <div className="rounded-lg bg-muted/30 p-3 border border-border/30">
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="size-3 inline mr-1 text-amber-400" />
                    The chatbot automatically includes your current plans, risk levels, and referral structure in its knowledge. Add custom info below.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="size-4 text-emerald-400" />
                Custom Knowledge Base
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Add custom information the chatbot should know. This is appended to the AI&apos;s context alongside auto-fetched plan data.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={knowledgeBase}
                onChange={e => setKnowledgeBase(e.target.value)}
                rows={16}
                placeholder={`Add custom knowledge here. Examples:

- Withdrawal minimum is $10
- We process withdrawals every day at 2 PM UTC
- Our platform has been running since 2024
- Referral bonuses are paid instantly on deposit approval
- Users can stack up to 5 deposits on Gold plan
- KYC is required for withdrawals above $500
- We support MetaMask, CoinPayments, and NOWPayments
- Contact support at support@bnfx.eu.cc

Add any FAQs, policies, or platform-specific details here...`}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-2">
                {knowledgeBase.length} characters • The bot also auto-includes: active plans, risk levels, referral structure
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
