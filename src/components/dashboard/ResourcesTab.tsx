'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Download, ShoppingCart, Image, FileText, Award,
  Shirt, BookOpen, PenTool, Crown, Key, Watch,
  ExternalLink, Sparkles, Gift,
} from 'lucide-react'

const LOGO_URL = '/logo-bnfx-gold.png'

interface FreeResource {
  id: string
  name: string
  type: 'banner' | 'pdf' | 'emblem' | 'logo'
  description: string
  preview: string
  downloadUrl: string
  size: string
}

interface PaidMerch {
  id: string
  name: string
  description: string
  price: number
  image: string
  icon: React.ComponentType<{ className?: string }>
  colors: string[]
  inStock: boolean
}

const FREE_RESOURCES: FreeResource[] = [
  {
    id: 'banner-dark-1',
    name: 'Dark Banner (1200x628)',
    type: 'banner',
    description: 'Social media banner with gold logo on black background',
    preview: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=210&fit=crop&q=80',
    downloadUrl: '#',
    size: '1200 × 628px',
  },
  {
    id: 'banner-story-1',
    name: 'Story Banner (1080x1920)',
    type: 'banner',
    description: 'Instagram/WhatsApp story format with referral code space',
    preview: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=200&h=356&fit=crop&q=80',
    downloadUrl: '#',
    size: '1080 × 1920px',
  },
  {
    id: 'banner-square-1',
    name: 'Square Post (1080x1080)',
    type: 'banner',
    description: 'Square format for Instagram/Facebook posts',
    preview: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=300&fit=crop&q=80',
    downloadUrl: '#',
    size: '1080 × 1080px',
  },
  {
    id: 'banner-cover-1',
    name: 'Facebook Cover (820x312)',
    type: 'banner',
    description: 'Facebook page cover with Black Nova FX branding',
    preview: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=152&fit=crop&q=80',
    downloadUrl: '#',
    size: '820 × 312px',
  },
  {
    id: 'pdf-overview',
    name: 'Platform Overview PDF',
    type: 'pdf',
    description: 'Complete platform guide with plans, referral system, and FAQ',
    preview: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&h=200&fit=crop&q=80',
    downloadUrl: '#',
    size: 'PDF • 2.4 MB',
  },
  {
    id: 'pdf-referral',
    name: 'Referral Guide PDF',
    type: 'pdf',
    description: '7-level referral system explained with earning examples',
    preview: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop&q=80',
    downloadUrl: '#',
    size: 'PDF • 1.8 MB',
  },
  {
    id: 'pdf-plans',
    name: 'Investment Plans Brochure',
    type: 'pdf',
    description: 'All plans with risk levels, returns, and comparison table',
    preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop&q=80',
    downloadUrl: '#',
    size: 'PDF • 3.1 MB',
  },
  {
    id: 'emblem-gold',
    name: 'Gold Emblem (PNG)',
    type: 'emblem',
    description: 'High-res BN logo emblem with transparent background',
    preview: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=300&fit=crop&q=80',
    downloadUrl: '#',
    size: 'PNG • 2048px',
  },
  {
    id: 'emblem-dark',
    name: 'Dark Logo Pack',
    type: 'emblem',
    description: 'Logo in SVG, PNG, ICO formats for dark backgrounds',
    preview: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=300&h=300&fit=crop&q=80',
    downloadUrl: '#',
    size: 'ZIP • 5.2 MB',
  },
  {
    id: 'logo-watermark',
    name: 'Watermark Logo',
    type: 'logo',
    description: 'Semi-transparent logo for video/image watermarking',
    preview: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=300&h=200&fit=crop&q=80',
    downloadUrl: '#',
    size: 'PNG • 512px',
  },
]

const PAID_MERCH: PaidMerch[] = [
  {
    id: 'tshirt-black',
    name: 'Black Nova FX T-Shirt',
    description: 'Premium cotton tee with gold embroidered BN logo. Available in S-3XL.',
    price: 35,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop&q=80',
    icon: Shirt,
    colors: ['Black', 'Navy'],
    inStock: true,
  },
  {
    id: 'diary-leather',
    name: 'Executive Diary',
    description: 'Leather-bound diary with gold foil BN logo, 200 pages, ribbon bookmark.',
    price: 25,
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=300&fit=crop&q=80',
    icon: BookOpen,
    colors: ['Black', 'Brown'],
    inStock: true,
  },
  {
    id: 'pen-gold',
    name: 'Gold Signature Pen',
    description: 'Metal ballpoint pen with gold trim and engraved Black Nova FX branding.',
    price: 15,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300&h=300&fit=crop&q=80',
    icon: PenTool,
    colors: ['Gold/Black'],
    inStock: true,
  },
  {
    id: 'cap-snapback',
    name: 'BN Snapback Cap',
    description: 'Structured snapback with embroidered BN logo. One size fits all.',
    price: 20,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=300&h=300&fit=crop&q=80',
    icon: Crown,
    colors: ['Black/Gold', 'Navy/Gold'],
    inStock: true,
  },
  {
    id: 'keychain-metal',
    name: 'Metal Keychain',
    description: 'Die-cast metal keychain with 3D BN emblem and gold plating.',
    price: 10,
    image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=300&h=300&fit=crop&q=80',
    icon: Key,
    colors: ['Gold'],
    inStock: true,
  },
  {
    id: 'watch-classic',
    name: 'BN Classic Watch',
    description: 'Stainless steel watch with Black Nova FX dial, leather strap, water resistant.',
    price: 120,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop&q=80',
    icon: Watch,
    colors: ['Black/Gold', 'Silver/Black'],
    inStock: false,
  },
]

export function ResourcesTab() {
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState<string>('all')

  const filteredResources = selectedType === 'all'
    ? FREE_RESOURCES
    : FREE_RESOURCES.filter(r => r.type === selectedType)

  const handleDownload = (resource: FreeResource) => {
    toast({ title: `Downloading ${resource.name}`, description: 'Your file will be ready shortly' })
    // In production, this would trigger actual file download
  }

  const handleOrder = (item: PaidMerch) => {
    if (!item.inStock) {
      toast({ title: 'Out of Stock', description: 'This item is currently unavailable', variant: 'destructive' })
      return
    }
    toast({ title: `Added to Cart: ${item.name}`, description: `$${item.price} — Contact support to complete your order` })
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="size-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">Promotional Resources</span>
        </div>
        <h2 className="text-2xl font-bold">Black Nova FX Resources</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Download free promotional materials or order branded merchandise to grow your network
        </p>
      </div>

      {/* Logo Display */}
      <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-card to-amber-500/5 overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-32 bg-black rounded-xl flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <div className="text-center">
              <p className="text-3xl font-black text-amber-400" style={{ fontFamily: 'serif' }}>BN</p>
              <p className="text-[10px] text-amber-400/80 tracking-[0.2em] uppercase">Black Nova FX</p>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold">Official Brand Assets</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use these materials to promote Black Nova FX. All assets feature our gold-on-black branding.
              Include your referral code on banners for tracking.
            </p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Gold Logo</Badge>
              <Badge className="bg-muted text-muted-foreground border-border/50">Black Background</Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Free to Use</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="free" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="free" className="gap-1.5">
            <Download className="size-4" />
            Free Resources
          </TabsTrigger>
          <TabsTrigger value="merch" className="gap-1.5">
            <ShoppingCart className="size-4" />
            Branded Merchandise
          </TabsTrigger>
        </TabsList>

        {/* Free Resources */}
        <TabsContent value="free" className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'banner', 'pdf', 'emblem', 'logo'].map(type => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="capitalize shrink-0"
              >
                {type === 'all' ? '🎯 All' : type === 'banner' ? '🖼️ Banners' : type === 'pdf' ? '📄 PDFs' : type === 'emblem' ? '🏅 Emblems' : '💧 Logos'}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(resource => (
              <Card key={resource.id} className="border-border/50 hover:border-amber-500/30 transition-colors group overflow-hidden">
                <CardContent className="p-0">
                  {/* Image Preview */}
                  <div className="relative h-36 overflow-hidden bg-black">
                    <img
                      src={resource.preview}
                      alt={resource.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <Badge variant="outline" className="text-[9px] capitalize bg-black/50 backdrop-blur-sm border-white/20 text-white">{resource.type}</Badge>
                      <span className="text-[10px] text-white/70">{resource.size}</span>
                    </div>
                    {/* Gold BN watermark overlay */}
                    <div className="absolute top-2 right-2 text-amber-400/40 text-xs font-black">BN</div>
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <h4 className="text-sm font-semibold">{resource.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs gap-1.5 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 group-hover:text-amber-400"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="size-3" />
                      Download Free
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Paid Merchandise */}
        <TabsContent value="merch" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAID_MERCH.map(item => {
              const Icon = item.icon
              return (
                <Card key={item.id} className={`border-border/50 transition-all ${item.inStock ? 'hover:border-amber-500/30' : 'opacity-60'}`}>
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-amber-500/5 to-card">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-sm">Out of Stock</Badge>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-black border-0 font-bold" dir="ltr">${item.price}</Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>

                    {/* Colors */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Colors:</span>
                      {item.colors.map(color => (
                        <Badge key={color} variant="outline" className="text-[9px] px-1.5">{color}</Badge>
                      ))}
                    </div>

                    {/* Action */}
                    <Button
                      className={`w-full gap-1.5 ${item.inStock ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}`}
                      disabled={!item.inStock}
                      onClick={() => handleOrder(item)}
                      size="sm"
                    >
                      <ShoppingCart className="size-3.5" />
                      {item.inStock ? 'Order Now' : 'Notify Me'}
                    </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Gift className="size-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">How to Order</p>
                <p className="text-xs text-muted-foreground">
                  Contact support with your order details. Payment via USDC or trading wallet balance.
                  Shipping worldwide within 7-14 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
