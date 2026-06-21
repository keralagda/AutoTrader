'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Mail, ShieldAlert, Sparkles, RefreshCw, Send, CheckCircle, AlertTriangle, Terminal, Key } from 'lucide-react'

export function AdminEmailVerifier() {
  const { toast } = useToast()
  const [testEmail, setTestEmail] = useState('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const runDiagnostics = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail) {
      toast({ title: 'Input Required', description: 'Please enter a test recipient email address.', variant: 'destructive' })
      return
    }

    setRunning(true)
    setResults(null)
    setLogs(['[SYSTEM] Initializing email verifier sandbox...', '[SYSTEM] Fetching connection verification token...'])

    try {
      const res = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete diagnostics')

      setResults(data)
      setLogs(data.traceLogs || [])
      
      const success = (data.smtp?.success || false) || (data.resend?.success || false)
      if (success) {
        toast({ title: 'Diagnostics Complete', description: 'At least one email gateway sent successfully.' })
      } else {
        toast({ title: 'Diagnostics FAILED', description: 'Both SMTP and Resend pipelines failed. Check logs.', variant: 'destructive' })
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[CRITICAL ERROR] Diagnostics aborted: ${err.message}`])
      toast({ title: 'Diagnostic Run Failed', description: err.message, variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-emerald-400" /> Email Pipeline Diagnostics & Verifier
        </h1>
        <p className="text-muted-foreground text-sm">
          Run diagnostics on active SMTP server round-robin rotation and Resend API pipelines to troubleshoot email delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form panel */}
        <Card className="bg-card/40 border-border/50 shadow-xl lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Key className="size-4 text-emerald-400" /> Send Test Email
            </CardTitle>
            <CardDescription className="text-xs">
              Initiates diagnostic connection handshakes and triggers a test delivery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={runDiagnostics} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="testEmail" className="text-xs text-muted-foreground">Recipient Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="bg-muted/30 border-border/50 text-xs h-9 font-mono"
                  disabled={running}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={running}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9"
              >
                {running ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Running Diagnostics...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Trigger Diagnostic Test</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results & logs panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status summary */}
          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SMTP Status */}
              <Card className="bg-card/30 border-border/50">
                <CardContent className="p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gmail SMTP Server</p>
                    <p className="text-sm font-semibold">smtp.gmail.com:587</p>
                    {results.smtp?.success ? (
                      <p className="text-[11px] text-emerald-400 font-medium">Handshake & Delivery Active</p>
                    ) : (
                      <p className="text-[11px] text-red-400 font-medium truncate max-w-[200px]" title={results.smtp?.error}>
                        Failed: {results.smtp?.error || 'Not Configured'}
                      </p>
                    )}
                  </div>
                  <Badge className={results.smtp?.success ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                    {results.smtp?.success ? "ONLINE" : "OFFLINE"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Resend Status */}
              <Card className="bg-card/30 border-border/50">
                <CardContent className="p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Resend API Key</p>
                    <p className="text-sm font-semibold">api.resend.com</p>
                    {results.resend?.success ? (
                      <p className="text-[11px] text-emerald-400 font-medium">API Response OK</p>
                    ) : (
                      <p className="text-[11px] text-red-400 font-medium truncate max-w-[200px]" title={results.resend?.error}>
                        Failed: {results.resend?.error || 'Not Configured'}
                      </p>
                    )}
                  </div>
                  <Badge className={results.resend?.success ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                    {results.resend?.success ? "ONLINE" : "OFFLINE"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Diagnostic Log */}
          <Card className="bg-card/40 border-border/50 shadow-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/30">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Terminal className="size-4 text-emerald-400" /> Connection & Delivery Trace Log
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Real-time pipeline monitoring output
                </CardDescription>
              </div>
              {logs.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLogs([])}
                  className="h-6 text-[10px] text-muted-foreground"
                >
                  Clear Console
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="font-mono text-[11px] p-4 min-h-[220px] max-h-[350px] overflow-y-auto bg-black/60 text-slate-300 space-y-1.5 scrollbar-thin">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground select-none">
                    <Mail className="h-8 w-8 mb-2 opacity-30" />
                    <p>Sandbox ready. Trigger diagnostics to inspect output.</p>
                  </div>
                ) : (
                  logs.map((log, idx) => {
                    let textClass = "text-slate-300"
                    if (log.includes('✅') || log.includes('success')) textClass = "text-emerald-400 font-semibold"
                    if (log.includes('❌') || log.includes('Error')) textClass = "text-red-400"
                    if (log.includes('⚠️')) textClass = "text-amber-400"
                    if (log.startsWith('[SYSTEM]')) textClass = "text-cyan-400"
                    
                    return (
                      <p key={idx} className={`${textClass} break-all leading-normal`}>
                        {log}
                      </p>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
