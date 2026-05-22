import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - List all pages or get a specific page
export async function GET(req: NextRequest) {
  try {
    const pageId = req.nextUrl.searchParams.get('id')

    if (pageId) {
      const setting = await prisma.setting.findUnique({ where: { key: `page_${pageId}` } })
      if (!setting) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
      return NextResponse.json(JSON.parse(setting.value))
    }

    // List all pages
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'page_' } },
    })

    const pages = settings.map(s => {
      const data = JSON.parse(s.value)
      return { id: s.key.replace('page_', ''), name: data.name, slug: data.slug, updatedAt: data.updatedAt, published: data.published }
    })

    // Always include default pages
    const defaultPages = [
      { id: 'landing', name: 'Landing Page', slug: '/', isDefault: true },
      { id: 'dashboard', name: 'User Dashboard', slug: '/dashboard', isDefault: true },
      { id: 'admin', name: 'Admin Panel', slug: '/admin', isDefault: true },
    ]

    return NextResponse.json({ pages, defaultPages })
  } catch (error) {
    console.error('Page builder GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new page
export async function POST(req: NextRequest) {
  try {
    const { name, slug, blocks, published } = await req.json()

    if (!name) return NextResponse.json({ error: 'Page name required' }, { status: 400 })

    const pageId = slug ? slug.replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '') : name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const pageData = {
      name,
      slug: slug || `/${pageId}`,
      blocks: blocks || [],
      published: published !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await prisma.setting.upsert({
      where: { key: `page_${pageId}` },
      update: { value: JSON.stringify(pageData) },
      create: { key: `page_${pageId}`, value: JSON.stringify(pageData) },
    })

    return NextResponse.json({ success: true, id: pageId, ...pageData })
  } catch (error) {
    console.error('Page builder POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update page blocks
export async function PUT(req: NextRequest) {
  try {
    const { id, name, slug, blocks, published, settings } = await req.json()

    if (!id) return NextResponse.json({ error: 'Page ID required' }, { status: 400 })

    const existing = await prisma.setting.findUnique({ where: { key: `page_${id}` } })
    const existingData = existing ? JSON.parse(existing.value) : {}

    const pageData = {
      ...existingData,
      name: name || existingData.name,
      slug: slug || existingData.slug,
      blocks: blocks !== undefined ? blocks : existingData.blocks,
      published: published !== undefined ? published : existingData.published,
      settings: settings || existingData.settings,
      updatedAt: new Date().toISOString(),
    }

    await prisma.setting.upsert({
      where: { key: `page_${id}` },
      update: { value: JSON.stringify(pageData) },
      create: { key: `page_${id}`, value: JSON.stringify(pageData) },
    })

    return NextResponse.json({ success: true, ...pageData })
  } catch (error) {
    console.error('Page builder PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a page
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Page ID required' }, { status: 400 })

    await prisma.setting.delete({ where: { key: `page_${id}` } }).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Page builder DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
