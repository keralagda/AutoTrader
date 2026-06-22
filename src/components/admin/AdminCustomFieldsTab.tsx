'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  Settings, 
  FileText, 
  FolderTree, 
  ChevronRight, 
  Wrench, 
  Layers, 
  Database,
  ArrowRight,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react'

interface CustomField {
  key: string
  label: string
  type: string // "text", "number", "select", "date", "image", "boolean"
  options?: string // comma-separated options
  placeholder?: string
  required: boolean
}

interface CustomFieldGroup {
  id: string
  name: string
  rules: string // JSON representation
  fields: CustomField[]
}

interface CustomPostType {
  id: string
  slug: string
  name: string
  description?: string
  taxonomies?: CustomTaxonomy[]
}

interface CustomTaxonomy {
  id: string
  postTypeId: string
  slug: string
  name: string
  terms?: CustomTaxonomyTerm[]
}

interface CustomTaxonomyTerm {
  id: string
  taxonomyId: string
  name: string
  slug: string
}

interface CustomPost {
  id: string
  postTypeId: string
  title: string
  slug: string
  content?: string
  status: string
  taxonomies?: { term: CustomTaxonomyTerm }[]
  fieldValues?: Record<string, string>
}

export function AdminCustomFieldsTab() {
  const { toast } = useToast()
  
  // Navigation tabs inside custom fields builder
  const [subTab, setSubTab] = useState<'types' | 'fields' | 'posts'>('types')

  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  // System Entities Data
  const [postTypes, setPostTypes] = useState<CustomPostType[]>([])
  const [fieldGroups, setFieldGroups] = useState<CustomFieldGroup[]>([])
  const [posts, setPosts] = useState<CustomPost[]>([])

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('')

  // ─── Post Type Form State ───
  const [cptName, setCptName] = useState('')
  const [cptSlug, setCptSlug] = useState('')
  const [cptDesc, setCptDesc] = useState('')

  // ─── Taxonomy Form State ───
  const [selectedCptIdForTax, setSelectedCptIdForTax] = useState('')
  const [taxName, setTaxName] = useState('')
  const [taxSlug, setTaxSlug] = useState('')

  // ─── Taxonomy Term Form State ───
  const [selectedTaxIdForTerm, setSelectedTaxIdForTerm] = useState('')
  const [termName, setTermName] = useState('')
  const [termSlug, setTermSlug] = useState('')

  // ─── Field Group Form State ───
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupRulesPostType, setGroupRulesPostType] = useState('any')
  const [groupFields, setGroupFields] = useState<CustomField[]>([])

  // ─── Post Editor Form State ───
  const [selectedCptForPosts, setSelectedCptForPosts] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [postTitle, setPostTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postStatus, setPostStatus] = useState('draft')
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([])
  const [postFieldValues, setPostFieldValues] = useState<Record<string, string>>({})

  // Fetch all basic configuration items on load
  const loadData = async () => {
    setLoading(true)
    try {
      const t = Date.now()
      const [cptsRes, groupsRes] = await Promise.all([
        fetch(`/api/admin/custom-posts?type=cpt&t=${t}`),
        fetch(`/api/admin/custom-fields?t=${t}`)
      ])

      if (cptsRes.ok && groupsRes.ok) {
        const cpts = await cptsRes.json()
        const groups = await groupsRes.json()
        setPostTypes(cpts)
        setFieldGroups(groups)
        
        if (cpts.length > 0) {
          setSelectedCptIdForTax(cpts[0].id)
          setSelectedCptForPosts(cpts[0].slug)
        }
      }
    } catch {
      toast({ title: 'Fetch Error', description: 'Failed to load custom fields and post structures.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Load posts whenever selected post type changes
  useEffect(() => {
    if (!selectedCptForPosts) return
    const matchedCpt = postTypes.find(c => c.slug === selectedCptForPosts)
    if (!matchedCpt) return

    const loadPosts = async () => {
      try {
        const t = Date.now()
        const res = await fetch(`/api/admin/custom-posts?type=post&postTypeId=${matchedCpt.id}&t=${t}`)
        if (res.ok) {
          const data = await res.json()
          setPosts(data)
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to fetch posts for selected type.', variant: 'destructive' })
      }
    }
    loadPosts()
  }, [selectedCptForPosts, postTypes])

  // ─── Post Type CRUD ───
  const handleSavePostType = async () => {
    if (!cptName || !cptSlug) {
      toast({ title: 'Validation Warning', description: 'Name and unique slug are required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/custom-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cpt', name: cptName, slug: cptSlug, description: cptDesc })
      })
      if (res.ok) {
        toast({ title: 'Success', description: `Custom Post Type "${cptName}" created successfully.` })
        handleResetCptForm()
        loadData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create Post Type.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network Error', description: 'Failed to connect to backend.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePostType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom post type? All associated posts and taxonomies will be deleted.')) return
    try {
      const res = await fetch(`/api/admin/custom-posts?action=cpt&id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Post Type deleted.' })
        loadData()
      }
    } catch {
      toast({ title: 'Error', description: 'Delete failed.' })
    }
  }

  const handleResetCptForm = () => {
    setCptName('')
    setCptSlug('')
    setCptDesc('')
  }

  // ─── Taxonomy CRUD ───
  const handleSaveTaxonomy = async () => {
    if (!taxName || !taxSlug || !selectedCptIdForTax) {
      toast({ title: 'Validation Warning', description: 'All fields are required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/custom-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'taxonomy', postTypeId: selectedCptIdForTax, name: taxName, slug: taxSlug })
      })
      if (res.ok) {
        toast({ title: 'Success', description: `Taxonomy "${taxName}" created.` })
        setTaxName('')
        setTaxSlug('')
        loadData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create taxonomy.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to connect to backend.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTaxonomy = async (id: string) => {
    if (!confirm('Delete this taxonomy?')) return
    try {
      const res = await fetch(`/api/admin/custom-posts?action=taxonomy&id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Taxonomy deleted.' })
        loadData()
      }
    } catch {
      toast({ title: 'Error', description: 'Delete failed.' })
    }
  }

  // ─── Taxonomy Term CRUD ───
  const handleSaveTerm = async () => {
    if (!termName || !termSlug || !selectedTaxIdForTerm) {
      toast({ title: 'Validation Warning', description: 'All fields are required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/custom-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'term', taxonomyId: selectedTaxIdForTerm, name: termName, slug: termSlug })
      })
      if (res.ok) {
        toast({ title: 'Success', description: `Term "${termName}" added.` })
        setTermName('')
        setTermSlug('')
        loadData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to add term.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to connect to backend.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTerm = async (id: string) => {
    if (!confirm('Delete this term?')) return
    try {
      const res = await fetch(`/api/admin/custom-posts?action=term&id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Term deleted.' })
        loadData()
      }
    } catch {
      toast({ title: 'Error', description: 'Delete failed.' })
    }
  }

  // ─── Field Groups & AI Prompt Builder ───
  const handleAiGenerateFields = async () => {
    if (!aiPrompt) {
      toast({ title: 'Validation Warning', description: 'Please input a prompt description.', variant: 'destructive' })
      return
    }
    setAiGenerating(true)
    try {
      const res = await fetch('/api/admin/custom-fields/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.fields && Array.isArray(data.fields)) {
          setGroupFields(data.fields)
          toast({ title: 'AI Assistant', description: 'Successfully generated field definitions. Review and save below.' })
        }
      } else {
        const err = await res.json()
        toast({ title: 'AI Assistant failed', description: err.error || 'Could not understand prompt.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to contact AI generator.', variant: 'destructive' })
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAddFieldRow = () => {
    setGroupFields([...groupFields, { key: '', label: '', type: 'text', required: false, placeholder: '', options: '' }])
  }

  const handleRemoveFieldRow = (idx: number) => {
    setGroupFields(groupFields.filter((_, i) => i !== idx))
  }

  const handleUpdateFieldRow = (idx: number, updates: Partial<CustomField>) => {
    const updated = groupFields.map((field, i) => {
      if (i === idx) {
        return { ...field, ...updates }
      }
      return field
    })
    setGroupFields(updated)
  }

  const handleSaveFieldGroup = async () => {
    if (!groupName) {
      toast({ title: 'Validation Error', description: 'Group Name is required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const rules = { postType: groupRulesPostType }
      const payload = {
        id: editingGroupId || undefined,
        name: groupName,
        rules,
        fields: groupFields
      }

      const method = editingGroupId ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/custom-fields', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Custom Field Group saved successfully.' })
        handleResetFieldGroupForm()
        loadData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to save field group.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to connect to backend.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditFieldGroup = (group: CustomFieldGroup) => {
    setEditingGroupId(group.id)
    setGroupName(group.name)
    try {
      const parsedRules = typeof group.rules === 'string' ? JSON.parse(group.rules) : group.rules
      setGroupRulesPostType(parsedRules.postType || 'any')
    } catch {
      setGroupRulesPostType('any')
    }
    setGroupFields(group.fields)
  }

  const handleDeleteFieldGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom field group?')) return
    try {
      const res = await fetch(`/api/admin/custom-fields?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Field group deleted.' })
        loadData()
      }
    } catch {
      toast({ title: 'Error', description: 'Delete failed.' })
    }
  }

  const handleResetFieldGroupForm = () => {
    setEditingGroupId(null)
    setGroupName('')
    setGroupRulesPostType('any')
    setGroupFields([])
    setAiPrompt('')
  }

  // ─── Custom Posts (Content Entry) CRUD ───
  const handleSavePost = async () => {
    if (!postTitle || !postSlug) {
      toast({ title: 'Validation Warning', description: 'Title and Slug are required.', variant: 'destructive' })
      return
    }

    const matchedCpt = postTypes.find(c => c.slug === selectedCptForPosts)
    if (!matchedCpt) return

    setSaving(true)
    try {
      const payload = {
        id: editingPostId || undefined,
        action: 'post',
        postTypeId: matchedCpt.id,
        title: postTitle,
        slug: postSlug,
        content: postContent,
        status: postStatus,
        terms: selectedTermIds,
        fieldValues: postFieldValues
      }

      const method = editingPostId ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/custom-posts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Post content saved.' })
        handleResetPostForm()
        
        // Force refresh post list
        const t = Date.now()
        const postsRes = await fetch(`/api/admin/custom-posts?type=post&postTypeId=${matchedCpt.id}&t=${t}`)
        if (postsRes.ok) {
          setPosts(await postsRes.json())
        }
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to save post.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to connect to backend.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditPost = (post: CustomPost) => {
    setEditingPostId(post.id)
    setPostTitle(post.title)
    setPostSlug(post.slug)
    setPostContent(post.content || '')
    setPostStatus(post.status)
    setSelectedTermIds((post.taxonomies || []).map(t => t.term.id))
    setPostFieldValues(post.fieldValues || {})
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const res = await fetch(`/api/admin/custom-posts?action=post&id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Post deleted.' })
        const matchedCpt = postTypes.find(c => c.slug === selectedCptForPosts)
        if (matchedCpt) {
          const t = Date.now()
          const postsRes = await fetch(`/api/admin/custom-posts?type=post&postTypeId=${matchedCpt.id}&t=${t}`)
          if (postsRes.ok) {
            setPosts(await postsRes.json())
          }
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Delete failed.' })
    }
  }

  const handleResetPostForm = () => {
    setEditingPostId(null)
    setPostTitle('')
    setPostSlug('')
    setPostContent('')
    setPostStatus('draft')
    setSelectedTermIds([])
    setPostFieldValues({})
  }

  // Helper: Find fields that apply to the current post type editor
  const getApplicableFields = () => {
    if (!selectedCptForPosts) return []
    return fieldGroups
      .filter(g => {
        try {
          const rules = typeof g.rules === 'string' ? JSON.parse(g.rules) : g.rules
          return rules.postType === 'any' || rules.postType === selectedCptForPosts
        } catch {
          return false
        }
      })
      .flatMap(g => g.fields)
  }

  const handleFieldValueChange = (key: string, val: string) => {
    setPostFieldValues({
      ...postFieldValues,
      [key]: val
    })
  }

  const toggleTermSelection = (termId: string) => {
    if (selectedTermIds.includes(termId)) {
      setSelectedTermIds(selectedTermIds.filter(id => id !== termId))
    } else {
      setSelectedTermIds([...selectedTermIds, termId])
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-400" />
            Custom Fields & Posts Builder
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Construct WordPress-like Custom Post Types, dynamic custom fields, conditional taxonomy bindings, and AI assisted structures.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-background border border-border/40 p-1.5 rounded-lg">
          <Button 
            variant={subTab === 'types' ? 'default' : 'ghost'} 
            size="sm" 
            className="text-xs"
            onClick={() => setSubTab('types')}
          >
            <FolderTree className="mr-1.5 h-3.5 w-3.5" />
            Post Types & Taxonomies
          </Button>
          <Button 
            variant={subTab === 'fields' ? 'default' : 'ghost'} 
            size="sm" 
            className="text-xs"
            onClick={() => setSubTab('fields')}
          >
            <Wrench className="mr-1.5 h-3.5 w-3.5" />
            Field Groups & AI
          </Button>
          <Button 
            variant={subTab === 'posts' ? 'default' : 'ghost'} 
            size="sm" 
            className="text-xs"
            onClick={() => setSubTab('posts')}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Content Entries
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-muted-foreground">Syncing schemas with database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          
          {/* TAB 1: POST TYPES & TAXONOMIES */}
          {subTab === 'types' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Creator Column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Post Type Creator */}
                <Card className="cyber-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-emerald-400" />
                      Add Post Type
                    </CardTitle>
                    <CardDescription className="text-[11px]">Define a new content entity.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Post Type Name</Label>
                      <Input 
                        placeholder="e.g. Signals" 
                        value={cptName} 
                        onChange={(e) => {
                          setCptName(e.target.value)
                          if (!cptSlug) {
                            setCptSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Slug (Unique ID)</Label>
                      <Input 
                        placeholder="e.g. signals" 
                        value={cptSlug} 
                        onChange={(e) => setCptSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <Input 
                        placeholder="e.g. High precision daily trading signals" 
                        value={cptDesc} 
                        onChange={(e) => setCptDesc(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1 text-xs" onClick={handleSavePostType} disabled={saving}>
                        <Save className="mr-1 h-3.5 w-3.5" />
                        Create Type
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={handleResetCptForm}>
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Taxonomy Creator */}
                <Card className="cyber-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <FolderTree className="h-4 w-4 text-emerald-400" />
                      Add Taxonomy
                    </CardTitle>
                    <CardDescription className="text-[11px]">Categorize post types.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Post Type</Label>
                      <select 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        value={selectedCptIdForTax}
                        onChange={(e) => setSelectedCptIdForTax(e.target.value)}
                      >
                        {postTypes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Taxonomy Name</Label>
                      <Input 
                        placeholder="e.g. Signal Risk" 
                        value={taxName} 
                        onChange={(e) => {
                          setTaxName(e.target.value)
                          if (!taxSlug) {
                            setTaxSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Slug</Label>
                      <Input 
                        placeholder="e.g. risk-level" 
                        value={taxSlug} 
                        onChange={(e) => setTaxSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                      />
                    </div>
                    <Button size="sm" className="w-full text-xs" onClick={handleSaveTaxonomy} disabled={saving}>
                      <Save className="mr-1 h-3.5 w-3.5" />
                      Add Taxonomy
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Display & Term Management Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="cyber-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-emerald-400" />
                      Registered Post Types & Taxonomies
                    </CardTitle>
                    <CardDescription className="text-[11px]">Database-backed schema layout.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {postTypes.length === 0 ? (
                      <div className="text-center py-10 text-xs text-muted-foreground">
                        No custom post types registered yet. Create one on the left.
                      </div>
                    ) : (
                      postTypes.map(type => (
                        <div key={type.id} className="border border-border/40 p-4 rounded-lg bg-background/50 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                {type.name}
                                <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-border/20 rounded">
                                  slug: {type.slug}
                                </span>
                              </h4>
                              {type.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePostType(type.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="pl-4 border-l-2 border-border space-y-2.5">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold block">Taxonomies</Label>
                            {(!type.taxonomies || type.taxonomies.length === 0) ? (
                              <p className="text-[11px] text-muted-foreground italic">No taxonomies associated yet.</p>
                            ) : (
                              type.taxonomies.map(tax => (
                                <div key={tax.id} className="bg-background border border-border/30 rounded p-2.5 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                      <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                                      {tax.name} <span className="text-[10px] text-muted-foreground italic">({tax.slug})</span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-6 text-[10px] px-2"
                                        onClick={() => setSelectedTaxIdForTerm(tax.id)}
                                      >
                                        Add Term
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteTaxonomy(tax.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Terms list */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {(!tax.terms || tax.terms.length === 0) ? (
                                      <span className="text-[10px] text-muted-foreground italic">No terms defined. Click Add Term.</span>
                                    ) : (
                                      tax.terms.map(term => (
                                        <span key={term.id} className="inline-flex items-center gap-1 text-[10px] bg-border/20 px-2 py-0.5 rounded text-foreground">
                                          {term.name} ({term.slug})
                                          <button className="hover:text-destructive text-muted-foreground" onClick={() => handleDeleteTerm(term.id)}>×</button>
                                        </span>
                                      ))
                                    )}
                                  </div>

                                  {/* Inline Term Creator */}
                                  {selectedTaxIdForTerm === tax.id && (
                                    <div className="border-t border-border/30 pt-2.5 mt-2.5 space-y-2">
                                      <Label className="text-[10px] font-bold block">New Term Creator</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input 
                                          placeholder="Term Name (e.g. High Risk)" 
                                          className="h-7 text-xs"
                                          value={termName}
                                          onChange={(e) => {
                                            setTermName(e.target.value)
                                            if (!termSlug) {
                                              setTermSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                                            }
                                          }}
                                        />
                                        <Input 
                                          placeholder="Term Slug (e.g. high-risk)" 
                                          className="h-7 text-xs"
                                          value={termSlug}
                                          onChange={(e) => setTermSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                                        />
                                      </div>
                                      <div className="flex justify-end gap-1">
                                        <Button size="sm" className="h-6 text-[10px]" onClick={handleSaveTerm} disabled={saving}>
                                          Save Term
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setSelectedTaxIdForTerm('')}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

          {/* TAB 2: FIELD GROUPS & AI BUILDER */}
          {subTab === 'fields' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Field Group Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="cyber-card">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Wrench className="h-4 w-4 text-emerald-400" />
                        {editingGroupId ? 'Edit Field Group' : 'Create Custom Field Group'}
                      </CardTitle>
                      <CardDescription className="text-[11px]">Define field rules & meta inputs.</CardDescription>
                    </div>
                    {editingGroupId && (
                      <Button size="sm" variant="ghost" onClick={handleResetFieldGroupForm} className="text-xs h-7 text-destructive">
                        Cancel Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Basic details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Group Name</Label>
                        <Input 
                          placeholder="e.g. Signal Metadata" 
                          value={groupName} 
                          onChange={(e) => setGroupName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Target Rule (Render target)</Label>
                        <select 
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          value={groupRulesPostType}
                          onChange={(e) => setGroupRulesPostType(e.target.value)}
                        >
                          <option value="any">Show on ALL content post types</option>
                          {postTypes.map(c => (
                            <option key={c.id} value={c.slug}>Show only on: {c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Fields List */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Fields Schema Definitions</Label>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleAddFieldRow}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add Field
                        </Button>
                      </div>

                      {groupFields.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-md">
                          No fields defined in this group. Use the AI Assistant on the right or click "Add Field".
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groupFields.map((field, idx) => (
                            <div key={idx} className="border border-border/40 p-3 rounded-lg bg-background/50 space-y-3">
                              <div className="flex items-center gap-2 justify-between">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase">Field #{idx + 1}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveFieldRow(idx)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Field Label</Label>
                                  <Input 
                                    placeholder="e.g. Stop Loss Price" 
                                    className="h-8 text-xs"
                                    value={field.label}
                                    onChange={(e) => {
                                      const label = e.target.value
                                      const key = field.key || label.toLowerCase().replace(/[^a-z0-9]/g, '_')
                                      handleUpdateFieldRow(idx, { label, key })
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Key (unique code)</Label>
                                  <Input 
                                    placeholder="e.g. stop_loss_price" 
                                    className="h-8 text-xs"
                                    value={field.key}
                                    onChange={(e) => handleUpdateFieldRow(idx, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Input Type</Label>
                                  <select 
                                    className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs h-8 focus:outline-none"
                                    value={field.type}
                                    onChange={(e) => handleUpdateFieldRow(idx, { type: e.target.value })}
                                  >
                                    <option value="text">Text Input</option>
                                    <option value="number">Number Input</option>
                                    <option value="select">Dropdown Select</option>
                                    <option value="date">Date picker</option>
                                    <option value="boolean">Toggle / Checkbox</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Placeholder / Note</Label>
                                  <Input 
                                    placeholder="e.g. Enter value" 
                                    className="h-8 text-xs"
                                    value={field.placeholder || ''}
                                    onChange={(e) => handleUpdateFieldRow(idx, { placeholder: e.target.value })}
                                  />
                                </div>
                              </div>

                              {field.type === 'select' && (
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Options (comma separated list)</Label>
                                  <Input 
                                    placeholder="e.g. Low Risk,Medium Risk,High Risk" 
                                    className="h-8 text-xs"
                                    value={field.options || ''}
                                    onChange={(e) => handleUpdateFieldRow(idx, { options: e.target.value })}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-border/30">
                      <Button size="sm" onClick={handleSaveFieldGroup} disabled={saving}>
                        <Save className="mr-1 h-3.5 w-3.5" />
                        Save Field Group
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleResetFieldGroupForm}>
                        Clear / Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI & Registered Groups list */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* AI Suggestion Box */}
                <Card className="cyber-card bg-emerald-500/5 border-emerald-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      AI Fields Generator
                    </CardTitle>
                    <CardDescription className="text-[11px]">Generate schema layout from prompt.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Describe your fields in plain English:</Label>
                      <textarea 
                        className="w-full min-h-[80px] bg-background border border-border/60 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. Generate fields for signals, including coin, signal direction (BUY/SELL), entry zone, target, and volatility rating."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                      />
                    </div>
                    <Button size="sm" className="w-full text-xs" onClick={handleAiGenerateFields} disabled={aiGenerating}>
                      {aiGenerating ? (
                        <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                      )}
                      Generate Schema
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Groups */}
                <Card className="cyber-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-emerald-400" />
                      Existing Field Groups
                    </CardTitle>
                    <CardDescription className="text-[11px]">Registered groups in database.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fieldGroups.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-4 text-center">No field groups registered.</p>
                    ) : (
                      fieldGroups.map(group => {
                        let parsedRules: any = {}
                        try { parsedRules = JSON.parse(group.rules) } catch {}
                        return (
                          <div key={group.id} className="border border-border/40 rounded p-3 bg-background/30 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-semibold text-emerald-400">{group.name}</h4>
                                <span className="text-[9px] text-muted-foreground block">
                                  Applies to: {parsedRules.postType || 'any'}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleEditFieldGroup(group)}>
                                  <Settings className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteFieldGroup(group.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="text-[10px] text-muted-foreground bg-background p-1.5 rounded">
                              Fields: {(group.fields || []).map(f => f.label).join(', ') || 'none'}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {/* TAB 3: CONTENT ENTRIES (CUSTOM POSTS) */}
          {subTab === 'posts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Post Editor */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="cyber-card">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-emerald-400" />
                        {editingPostId ? 'Edit Content Entry' : 'Create Content Entry'}
                      </CardTitle>
                      <CardDescription className="text-[11px]">Write entries and input custom metadata values.</CardDescription>
                    </div>
                    {editingPostId && (
                      <Button size="sm" variant="ghost" onClick={handleResetPostForm} className="text-xs h-7 text-destructive">
                        Cancel Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Post Title</Label>
                        <Input 
                          placeholder="e.g. BTC Bullish Signal" 
                          value={postTitle} 
                          onChange={(e) => {
                            setPostTitle(e.target.value)
                            if (!postSlug) {
                              setPostSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Slug</Label>
                        <Input 
                          placeholder="e.g. btc-bullish-signal" 
                          value={postSlug} 
                          onChange={(e) => setPostSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Content Text</Label>
                      <textarea 
                        className="w-full min-h-[100px] bg-background border border-border rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Content body goes here..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                      />
                    </div>

                    {/* Taxonomies & Terms selector */}
                    {(() => {
                      const matchedCpt = postTypes.find(c => c.slug === selectedCptForPosts)
                      if (!matchedCpt || !matchedCpt.taxonomies || matchedCpt.taxonomies.length === 0) return null
                      return (
                        <div className="border border-border/40 p-3 rounded bg-background/50 space-y-2">
                          <Label className="text-xs font-semibold text-emerald-400">Taxonomies / Categories</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {matchedCpt.taxonomies.map(tax => (
                              <div key={tax.id} className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground font-bold">{tax.name}</Label>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {(!tax.terms || tax.terms.length === 0) ? (
                                    <span className="text-[10px] text-muted-foreground italic">No terms available. Create terms under Post Types tab.</span>
                                  ) : (
                                    tax.terms.map(term => {
                                      const isSelected = selectedTermIds.includes(term.id)
                                      return (
                                        <button
                                          key={term.id}
                                          onClick={() => toggleTermSelection(term.id)}
                                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                            isSelected 
                                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                              : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                          }`}
                                        >
                                          {term.name}
                                        </button>
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Dynamic Custom Fields Box */}
                    {(() => {
                      const applicableFields = getApplicableFields()
                      if (applicableFields.length === 0) return null
                      return (
                        <div className="border border-border/40 p-4 rounded bg-background/30 space-y-4">
                          <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Wrench className="h-4 w-4" />
                            Dynamic Custom Fields Meta values
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {applicableFields.map(field => {
                              const value = postFieldValues[field.key] || ''
                              return (
                                <div key={field.key} className="space-y-1.5">
                                  <Label className="text-xs flex items-center gap-1">
                                    {field.label}
                                    {field.required && <span className="text-destructive font-bold">*</span>}
                                  </Label>
                                  {field.type === 'select' ? (
                                    <select
                                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none"
                                      value={value}
                                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                                    >
                                      <option value="">Select option</option>
                                      {(field.options || '').split(',').map(opt => (
                                        <option key={opt} value={opt}>{opt.trim()}</option>
                                      ))}
                                    </select>
                                  ) : field.type === 'boolean' ? (
                                    <div className="flex items-center gap-2 h-9">
                                      <input 
                                        type="checkbox"
                                        checked={value === 'true'}
                                        onChange={(e) => handleFieldValueChange(field.key, e.target.checked ? 'true' : 'false')}
                                        className="h-4 w-4 bg-background border border-border rounded accent-emerald-500"
                                      />
                                      <span className="text-xs text-muted-foreground">Enabled</span>
                                    </div>
                                  ) : (
                                    <Input 
                                      type={field.type === 'number' ? 'number' : 'text'}
                                      placeholder={field.placeholder || ''}
                                      value={value}
                                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    <div className="flex gap-2 justify-end pt-2">
                      <Button size="sm" onClick={handleSavePost} disabled={saving}>
                        <Save className="mr-1 h-3.5 w-3.5" />
                        Save Content
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleResetPostForm}>
                        Reset Editor
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Selector & Posts List */}
              <div className="lg:col-span-1 space-y-6">
                {/* Post Type Selector */}
                <Card className="cyber-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Select Active Post Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none"
                      value={selectedCptForPosts}
                      onChange={(e) => {
                        setSelectedCptForPosts(e.target.value)
                        handleResetPostForm()
                      }}
                    >
                      {postTypes.map(c => (
                        <option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>
                      ))}
                    </select>
                  </CardContent>
                </Card>

                {/* Posts List */}
                <Card className="cyber-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      Content List
                    </CardTitle>
                    <CardDescription className="text-[11px]">Database entries for this type.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {posts.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">No content entries found.</p>
                    ) : (
                      posts.map(post => (
                        <div key={post.id} className="border border-border/40 rounded p-3 bg-background/30 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-semibold text-foreground">{post.title}</h4>
                              <span className="text-[9px] text-muted-foreground block">
                                slug: {post.slug} | Status: <span className={post.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}>{post.status}</span>
                              </span>
                            </div>
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleEditPost(post)}>
                                <Settings className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeletePost(post.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}
