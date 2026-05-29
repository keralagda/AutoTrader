'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  ShoppingBag, Plus, Pencil, Trash2, Save, Loader2,
  Package, DollarSign, Image, Tag,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  category: string
  price: number
  image: string
  description: string
  colors: string[]
  inStock: boolean
  stock: number
  type: 'paid' | 'free'
}

export function AdminEcommerceTab() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/admin/ecommerce')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!editProduct?.name) { toast({ title: 'Name required', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const isNew = !products.find(p => p.id === editProduct.id)
      const res = await fetch('/api/admin/ecommerce', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProduct),
      })
      if (res.ok) {
        toast({ title: isNew ? 'Product added' : 'Product updated' })
        // Refresh
        const data = await (await fetch('/api/admin/ecommerce')).json()
        if (Array.isArray(data)) setProducts(data)
        setShowForm(false)
        setEditProduct(null)
      }
    } catch { toast({ title: 'Failed', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    const res = await fetch('/api/admin/ecommerce', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }),
    })
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Product deleted' })
    }
  }

  const openNew = () => {
    setEditProduct({ id: `prod_${Date.now()}`, name: '', category: 'merch', price: 0, image: '', description: '', colors: [], inStock: true, stock: 0, type: 'paid' })
    setShowForm(true)
  }

  const openEdit = (p: Product) => { setEditProduct({ ...p }); setShowForm(true) }

  const filtered = filter === 'all' ? products : products.filter(p => p.type === filter || p.category === filter)
  const paidCount = products.filter(p => p.type === 'paid').length
  const freeCount = products.filter(p => p.type === 'free').length

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="size-5 text-amber-400" />Ecommerce Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage promotional materials and branded merchandise</p>
        </div>
        <Button onClick={openNew} className="gap-1.5"><Plus className="size-4" />Add Product</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-500/20 bg-amber-500/5"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{products.length}</p><p className="text-[10px] text-muted-foreground">Total Products</p>
        </CardContent></Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{paidCount}</p><p className="text-[10px] text-muted-foreground">Paid Items</p>
        </CardContent></Card>
        <Card className="border-cyan-500/20 bg-cyan-500/5"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{freeCount}</p><p className="text-[10px] text-muted-foreground">Free Resources</p>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'paid', 'free', 'merch', 'banner', 'pdf', 'emblem'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize shrink-0">
            {f === 'all' ? `All (${products.length})` : f}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(product => (
          <Card key={product.id} className="border-border/50 overflow-hidden group hover:border-amber-500/30 transition-colors">
            <CardContent className="p-0">
              <div className="relative h-36 bg-muted/30">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="size-10 text-muted-foreground/30" /></div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className={product.type === 'paid' ? 'bg-amber-500 text-black border-0 text-[9px]' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]'}>
                    {product.type === 'paid' ? `$${product.price}` : 'Free'}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-black/50 backdrop-blur-sm border-white/20 text-white capitalize">{product.category}</Badge>
                </div>
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge className="bg-rose-500/80 text-white border-0">Out of Stock</Badge>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <h4 className="text-sm font-semibold truncate">{product.name}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {product.stock === -1 ? 'Unlimited' : `Stock: ${product.stock}`}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => openEdit(product)}><Pencil className="size-3" /></Button>
                    <Button size="icon" variant="ghost" className="size-7 text-rose-400" onClick={() => handleDelete(product.id)}><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); setEditProduct(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editProduct && products.find(p => p.id === editProduct.id) ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>Configure product details</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Name</Label>
                  <Input value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Category</Label>
                  <select value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
                    <option value="merch">Merchandise</option>
                    <option value="banner">Banner</option>
                    <option value="pdf">PDF</option>
                    <option value="emblem">Emblem/Logo</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Price ($0 = Free)</Label>
                  <Input type="number" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0, type: parseFloat(e.target.value) > 0 ? 'paid' : 'free' })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Stock (-1 = Unlimited)</Label>
                  <Input type="number" value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) })} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Image URL</Label>
                <Input value={editProduct.image} onChange={e => setEditProduct({ ...editProduct, image: e.target.value })} placeholder="https://..." />
                {editProduct.image && <img src={editProduct.image} alt="" className="h-20 rounded-md object-cover mt-1" />}
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Description</Label>
                <Input value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Colors (comma separated)</Label>
                <Input value={editProduct.colors.join(', ')} onChange={e => setEditProduct({ ...editProduct, colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })} placeholder="Black, Gold" /></div>
              <div className="flex items-center gap-2">
                <Switch checked={editProduct.inStock} onCheckedChange={v => setEditProduct({ ...editProduct, inStock: v })} />
                <Label className="text-xs">In Stock</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditProduct(null) }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
