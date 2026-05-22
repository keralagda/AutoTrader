import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get all sections for editing
export async function GET() {
  try {
    const sections = await db.landingSection.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(sections)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get sections' }, { status: 500 })
  }
}

// PUT - Update a section
export async function PUT(request: Request) {
  try {
    const { sectionKey, title, subtitle, content, isVisible, sortOrder } = await request.json()
    if (!sectionKey) return NextResponse.json({ error: 'Section key required' }, { status: 400 })

    const section = await db.landingSection.upsert({
      where: { sectionKey },
      create: {
        sectionKey,
        title: title || null,
        subtitle: subtitle || null,
        content: typeof content === 'string' ? content : JSON.stringify(content || {}),
        isVisible: isVisible !== false,
        sortOrder: sortOrder || 0,
      },
      update: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(content !== undefined && { content: typeof content === 'string' ? content : JSON.stringify(content) }),
        ...(isVisible !== undefined && { isVisible }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Update landing section error:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

// POST - Upload media
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = formData.get('alt') as string || ''
    const uploadedBy = formData.get('uploadedBy') as string || ''

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Read file as base64 data URL (for SQLite storage - in production use S3/Cloudinary)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'application/octet-stream'
    const dataUrl = `data:${mimeType};base64,${base64}`

    const fileType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'document'

    const media = await db.mediaUpload.create({
      data: {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        url: dataUrl,
        alt,
        uploadedBy,
      },
    })

    return NextResponse.json({ id: media.id, url: media.url, fileName: media.fileName }, { status: 201 })
  } catch (error) {
    console.error('Upload media error:', error)
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 })
  }
}

// DELETE - Delete media
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.mediaUpload.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
