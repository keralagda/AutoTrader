import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_PRODUCTS = [
  { id: 'tshirt-black', name: 'Black Nova FX T-Shirt', category: 'merch', price: 35, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop&q=80', description: 'Premium cotton tee with gold embroidered BN logo. S-3XL.', colors: ['Black', 'Navy'], inStock: true, stock: 100, type: 'paid' },
  { id: 'diary-leather', name: 'Executive Diary', category: 'merch', price: 25, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=300&fit=crop&q=80', description: 'Leather-bound diary with gold foil BN logo, 200 pages.', colors: ['Black', 'Brown'], inStock: true, stock: 50, type: 'paid' },
  { id: 'pen-gold', name: 'Gold Signature Pen', category: 'merch', price: 15, image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300&h=300&fit=crop&q=80', description: 'Metal ballpoint pen with gold trim and engraved branding.', colors: ['Gold/Black'], inStock: true, stock: 200, type: 'paid' },
  { id: 'cap-snapback', name: 'BN Snapback Cap', category: 'merch', price: 20, image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=300&h=300&fit=crop&q=80', description: 'Structured snapback with embroidered BN logo.', colors: ['Black/Gold', 'Navy/Gold'], inStock: true, stock: 75, type: 'paid' },
  { id: 'keychain-metal', name: 'Metal Keychain', category: 'merch', price: 10, image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=300&h=300&fit=crop&q=80', description: 'Die-cast metal keychain with 3D BN emblem.', colors: ['Gold'], inStock: true, stock: 300, type: 'paid' },
  { id: 'watch-classic', name: 'BN Classic Watch', category: 'merch', price: 120, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop&q=80', description: 'Stainless steel watch with BN dial, leather strap.', colors: ['Black/Gold', 'Silver/Black'], inStock: false, stock: 0, type: 'paid' },
  { id: 'banner-dark-1', name: 'Dark Banner (1200x628)', category: 'banner', price: 0, image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=210&fit=crop&q=80', description: 'Social media banner with gold logo on black.', colors: [], inStock: true, stock: -1, type: 'free' },
  { id: 'banner-story-1', name: 'Story Banner (1080x1920)', category: 'banner', price: 0, image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=200&h=356&fit=crop&q=80', description: 'Instagram/WhatsApp story format.', colors: [], inStock: true, stock: -1, type: 'free' },
  { id: 'banner-square-1', name: 'Square Post (1080x1080)', category: 'banner', price: 0, image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=300&fit=crop&q=80', description: 'Square format for Instagram/Facebook.', colors: [], inStock: true, stock: -1, type: 'free' },
  { id: 'pdf-overview', name: 'Platform Overview PDF', category: 'pdf', price: 0, image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&h=200&fit=crop&q=80', description: 'Complete platform guide with plans and FAQ.', colors: [], inStock: true, stock: -1, type: 'free' },
  { id: 'pdf-referral', name: 'Referral Guide PDF', category: 'pdf', price: 0, image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop&q=80', description: '7-level referral system explained.', colors: [], inStock: true, stock: -1, type: 'free' },
  { id: 'emblem-gold', name: 'Gold Emblem (PNG)', category: 'emblem', price: 0, image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=300&fit=crop&q=80', description: 'High-res BN logo with transparent background.', colors: [], inStock: true, stock: -1, type: 'free' },
]

async function loadProducts() {
  const setting = await db.setting.findUnique({ where: { key: 'ecommerce_products' } })
  if (setting) {
    try { return JSON.parse(setting.value) } catch {}
  }
  return DEFAULT_PRODUCTS
}

// GET - List all products + orders
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    if (action === 'orders') {
      const setting = await db.setting.findUnique({ where: { key: 'ecommerce_orders' } })
      return NextResponse.json(setting ? JSON.parse(setting.value) : [])
    }

    const products = await loadProducts()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST - Add new product
export async function POST(req: NextRequest) {
  try {
    const product = await req.json()
    if (!product.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const products = await loadProducts()
    const newProduct = {
      id: product.id || `prod_${Date.now()}`,
      name: product.name,
      category: product.category || 'merch',
      price: product.price || 0,
      image: product.image || '',
      description: product.description || '',
      colors: product.colors || [],
      inStock: product.inStock !== false,
      stock: product.stock || 0,
      type: product.price > 0 ? 'paid' : 'free',
    }
    products.push(newProduct)

    await db.setting.upsert({
      where: { key: 'ecommerce_products' },
      update: { value: JSON.stringify(products) },
      create: { key: 'ecommerce_products', value: JSON.stringify(products) },
    })

    return NextResponse.json({ success: true, product: newProduct })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT - Update product
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

    const products = await loadProducts()
    const idx = products.findIndex((p: any) => p.id === body.id)
    if (idx === -1) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    products[idx] = { ...products[idx], ...body }

    await db.setting.upsert({
      where: { key: 'ecommerce_products' },
      update: { value: JSON.stringify(products) },
      create: { key: 'ecommerce_products', value: JSON.stringify(products) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE - Remove product
export async function DELETE(req: NextRequest) {
  try {
    const { productId } = await req.json()
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    const products = await loadProducts()
    const filtered = products.filter((p: any) => p.id !== productId)

    await db.setting.upsert({
      where: { key: 'ecommerce_products' },
      update: { value: JSON.stringify(filtered) },
      create: { key: 'ecommerce_products', value: JSON.stringify(filtered) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

