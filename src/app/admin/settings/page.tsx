'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Settings, Zap, Users, Activity, Bot } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedSettings, setUpdatedSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const settingsMap = await res.json()

      // Convert settings map to array of setting objects
      const settingsArray: Setting[] = Object.entries(settingsMap).map(([key, value]) => ({
        id: key, // Using key as id for simplicity
        key,
        value
      }))

      setSettings(settingsArray)
      setUpdatedSettings(settingsMap) // Initialize with current values
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function updateSettings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const result = await res.json()
      alert('Settings updated successfully!')

      // Refresh settings from server to ensure we have the latest
      await fetchSettings()
    } catch (err) {
      console.error('Failed to update settings:', err)
      setError('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  function handleSettingChange(key: string, value: string) {
    setUpdatedSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  function handleSettingToggle(key: string, checked: boolean) {
    setUpdatedSettings(prev => ({
      ...prev,
      [key]: checked ? 'true' : 'false'
    }))
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="space-y-4">
            <div className="h-8 w-32 bg-muted rounded"></div>
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-8 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <h2 className="text-xl font-bold mb-4">Error Loading Settings</h2>
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            setError(null)
            fetchSettings()
          }}
          className="btn btn-primary mt-4"
        >
          <Settings className="mr-2 h-4 w-4" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and features</p>
      </div>

      {/* Binary MLM Settings Section */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Binary MLM Fake Profiles Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Enable Binary MLM for Fake Profiles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                    <Zap className="size-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Enable Binary MLM for Fake Profiles</h3>
                    <p className="text-sm text-muted-foreground">
                      When enabled, fake profiles will be configured with Binary MLM properties
                    </p>
                  </div>
                </div>
                <Switch
                  checked={updatedSettings['binaryMlmFakeProfilesEnabled'] === 'true'}
                  onCheckedChange={checked => handleSettingToggle('binaryMlmFakeProfilesEnabled', checked)}
                />
              </div>
            </div>

            {/* Binary MLM Plan ID */}
            <div className="space-y-3">
              <Label className="block text-sm font-medium mb-2">
                Binary MLM Plan ID
              </Label>
              <Input
                type="text"
                placeholder="Enter plan ID for Binary MLM enabled plan"
                value={updatedSettings['binaryMlmFakeProfilesPlanId'] || ''}
                onChange={(e) => handleSettingChange('binaryMlmFakeProfilesPlanId', e.target.value)}
                className="mb-2"
              )
              <p className="text-xs text-muted-foreground">
                The plan ID that fake profiles will use for Binary MLM functionality
              </p>
            </div>

            {/* Placement Strategy */}
            <div className="space-y-3">
              <Label className="block text-sm font-medium mb-2">
                Placement Strategy
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    placeholder="balanced, left, right, or random"
                    value={updatedSettings['binaryMlmFakeProfilesPlacementStrategy'] || 'balanced'}
                    onChange={(e) => handleSettingChange('binaryMlmFakeProfilesPlacementStrategy', e.target.value)}
                    className="w-[200px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Strategy for placing fake profiles in the binary tree:
                  <br />
                  • balanced: Alternates between left and right
                  <br />
                  • left: Always place as left child
                  <br />
                  • right: Always place as right child
                  <br />
                  • random: Randomly choose left or right
                </p>
              </div>
            </div>

            {/* Activate Deposit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Users className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Activate Deposit for Fake Profiles</h3>
                    <p className="text-sm text-muted-foreground">
                      When enabled, fake profiles will have an activating deposit to participate in Binary MLM
                    </p>
                  </div>
                </div>
                <Switch
                  checked={updatedSettings['binaryMlmFakeProfilesActivateDeposit'] === 'true'}
                  onCheckedChange={checked => handleSettingToggle('binaryMlmFakeProfilesActivateDeposit', checked)}
                />
              </div>
            </div>

            {/* Deposit Amount */}
            <div className="space-y-3">
              <Label className="block text-sm font-medium mb-2">
                Deposit Amount (USDC)
              </Label>
              <Input
                type="number"
                placeholder="Enter deposit amount"
                value={updatedSettings['binaryMlmFakeProfilesDepositAmount'] || ''}
                onChange={(e) => handleSettingChange('binaryMlmFakeProfilesDepositAmount', e.target.value)}
                className="mb-2"
                min="0"
                step="0.01"
              )
              <p className="text-xs text-muted-foreground">
                The amount of deposit to create for each fake profile to activate Binary MLM participation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings Section */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Display all other settings in a table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting Key</TableHead>
                  <TableHead className="text-right">Setting Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings
                  .filter(setting =>
                    !setting.key.startsWith('binaryMlmFakeProfiles') // Exclude Binary MLM settings (already shown above)
                  )
                  .map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-mono">{setting.key}</TableCell>
                      <TableCell className="text-right font-mono">
                        <Input
                          type="text"
                          value={updatedSettings[setting.key] || setting.value}
                          onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                          className="w-[200px] mb-1"
                        />
                      </TableCell>
                      <TableCell>
                        {/* For boolean-like settings, show a switch */}
                        {setting.value === 'true' || setting.value === 'false' ? (
                          <Switch
                            checked={updatedSettings[setting.key] === 'true' || updatedSettings[setting.key] === undefined ?
                              setting.value === 'true' : updatedSettings[setting.key] === 'true'}
                            onCheckedChange={checked => handleSettingToggle(setting.key, checked)}
                            className="ml-2"
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="mt-6">
        <Button
          onClick={updateSettings}
          className="w-full md:w-auto px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}