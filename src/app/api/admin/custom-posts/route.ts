import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function checkDbConnection() {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

const dbErrorResponse = () => NextResponse.json({
  error: 'Database connection failed',
  diagnosticTrace: {
    message: 'Failed to connect to the database container or host.',
    actions: [
      'Check DB Container Status (running/healthy)',
      'Verify Network Bridge / port mappings',
      'Validate .env mapping (DATABASE_URL)'
    ]
  }
}, { status: 503 })

// GET Handler
export async function GET(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // "cpt", "taxonomy", "post", "values"

    if (type === 'cpt') {
      const cpts = await db.customPostType.findMany({
        include: {
          taxonomies: {
            include: { terms: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(cpts)
    }

    if (type === 'taxonomy') {
      const postTypeId = searchParams.get('postTypeId')
      if (!postTypeId) {
        return NextResponse.json({ error: 'postTypeId is required' }, { status: 400 })
      }
      const taxonomies = await db.customTaxonomy.findMany({
        where: { postTypeId },
        include: { terms: true },
        orderBy: { createdAt: 'asc' }
      })
      return NextResponse.json(taxonomies)
    }

    if (type === 'post') {
      const postTypeId = searchParams.get('postTypeId')
      if (!postTypeId) {
        return NextResponse.json({ error: 'postTypeId is required' }, { status: 400 })
      }
      const posts = await db.customPost.findMany({
        where: { postTypeId },
        include: {
          taxonomies: {
            include: { term: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Fetch all custom field values for these posts
      const postIds = posts.map(p => p.id)
      const fieldValues = await db.customFieldValue.findMany({
        where: {
          entityType: 'post',
          entityId: { in: postIds }
        }
      })

      // Attach values to posts
      const postsWithValues = posts.map(post => {
        const values = fieldValues
          .filter(v => v.entityId === post.id)
          .reduce((acc: any, curr) => {
            acc[curr.fieldKey] = curr.value
            return acc
          }, {})
        return {
          ...post,
          fieldValues: values
        }
      })

      return NextResponse.json(postsWithValues)
    }

    if (type === 'values') {
      const entityType = searchParams.get('entityType')
      const entityId = searchParams.get('entityId')
      if (!entityType || !entityId) {
        return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 })
      }
      const values = await db.customFieldValue.findMany({
        where: { entityType, entityId }
      })
      return NextResponse.json(values)
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Failed to get custom posts data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST Handler
export async function POST(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const body = await request.json()
    const { action } = body // "cpt", "taxonomy", "term", "post", "field-values"

    if (action === 'cpt') {
      const { slug, name, description } = body
      if (!slug || !name) {
        return NextResponse.json({ error: 'Slug and Name are required' }, { status: 400 })
      }
      const cpt = await db.customPostType.create({
        data: { slug, name, description, isActive: true }
      })
      return NextResponse.json(cpt)
    }

    if (action === 'taxonomy') {
      const { postTypeId, slug, name } = body
      if (!postTypeId || !slug || !name) {
        return NextResponse.json({ error: 'postTypeId, slug, and name are required' }, { status: 400 })
      }
      const taxonomy = await db.customTaxonomy.create({
        data: { postTypeId, slug, name }
      })
      return NextResponse.json(taxonomy)
    }

    if (action === 'term') {
      const { taxonomyId, name, slug } = body
      if (!taxonomyId || !name || !slug) {
        return NextResponse.json({ error: 'taxonomyId, name, and slug are required' }, { status: 400 })
      }
      const term = await db.customTaxonomyTerm.create({
        data: { taxonomyId, name, slug }
      })
      return NextResponse.json(term)
    }

    if (action === 'post') {
      const { postTypeId, title, slug, content, status, terms, fieldValues } = body
      if (!postTypeId || !title || !slug) {
        return NextResponse.json({ error: 'postTypeId, title, and slug are required' }, { status: 400 })
      }

      // Create Custom Post
      const post = await db.customPost.create({
        data: {
          postTypeId,
          title,
          slug,
          content,
          status: status || 'draft'
        }
      })

      // Sync Taxonomies (terms)
      if (terms && Array.isArray(terms)) {
        await db.customPostTaxonomyTerm.createMany({
          data: terms.map((termId: string) => ({
            postId: post.id,
            termId
          }))
        })
      }

      // Sync Custom Field Values
      if (fieldValues && typeof fieldValues === 'object') {
        const valueData = Object.entries(fieldValues).map(([fieldKey, val]) => ({
          fieldKey,
          value: typeof val === 'string' ? val : JSON.stringify(val),
          entityType: 'post',
          entityId: post.id
        }))
        if (valueData.length > 0) {
          await db.customFieldValue.createMany({
            data: valueData
          })
        }
      }

      return NextResponse.json(post)
    }

    if (action === 'field-values') {
      const { entityType, entityId, values } = body
      if (!entityType || !entityId || !values || typeof values !== 'object') {
        return NextResponse.json({ error: 'entityType, entityId, and values object are required' }, { status: 400 })
      }

      // Update / Upsert field values
      for (const [fieldKey, val] of Object.entries(values)) {
        const valStr = typeof val === 'string' ? val : JSON.stringify(val)
        await db.customFieldValue.upsert({
          where: {
            entityType_entityId_fieldKey: {
              entityType,
              entityId,
              fieldKey
            }
          },
          update: { value: valStr },
          create: {
            entityType,
            entityId,
            fieldKey,
            value: valStr
          }
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error) {
    console.error('Failed to create custom post data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT Handler
export async function PUT(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const body = await request.json()
    const { action, id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required for updates' }, { status: 400 })
    }

    if (action === 'cpt') {
      const { slug, name, description, isActive } = body
      const cpt = await db.customPostType.update({
        where: { id },
        data: { slug, name, description, isActive }
      })
      return NextResponse.json(cpt)
    }

    if (action === 'taxonomy') {
      const { slug, name } = body
      const taxonomy = await db.customTaxonomy.update({
        where: { id },
        data: { slug, name }
      })
      return NextResponse.json(taxonomy)
    }

    if (action === 'term') {
      const { name, slug } = body
      const term = await db.customTaxonomyTerm.update({
        where: { id },
        data: { name, slug }
      })
      return NextResponse.json(term)
    }

    if (action === 'post') {
      const { title, slug, content, status, terms, fieldValues } = body

      // Update Post
      const post = await db.customPost.update({
        where: { id },
        data: { title, slug, content, status }
      })

      // Sync Taxonomies (terms)
      if (terms && Array.isArray(terms)) {
        await db.customPostTaxonomyTerm.deleteMany({
          where: { postId: id }
        })
        await db.customPostTaxonomyTerm.createMany({
          data: terms.map((termId: string) => ({
            postId: id,
            termId
          }))
        })
      }

      // Sync Custom Field Values
      if (fieldValues && typeof fieldValues === 'object') {
        for (const [fieldKey, val] of Object.entries(fieldValues)) {
          const valStr = typeof val === 'string' ? val : JSON.stringify(val)
          await db.customFieldValue.upsert({
            where: {
              entityType_entityId_fieldKey: {
                entityType: 'post',
                entityId: id,
                fieldKey
              }
            },
            update: { value: valStr },
            create: {
              entityType: 'post',
              entityId: id,
              fieldKey,
              value: valStr
            }
          })
        }
      }

      return NextResponse.json(post)
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update custom post data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE Handler
export async function DELETE(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // "cpt", "taxonomy", "term", "post"
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (action === 'cpt') {
      await db.customPostType.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Custom post type deleted' })
    }

    if (action === 'taxonomy') {
      await db.customTaxonomy.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Custom taxonomy deleted' })
    }

    if (action === 'term') {
      await db.customTaxonomyTerm.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Custom taxonomy term deleted' })
    }

    if (action === 'post') {
      // Deleting custom post cascade-deletes CustomPostTaxonomyTerm. Custom field values should be deleted as well.
      await db.customFieldValue.deleteMany({
        where: { entityType: 'post', entityId: id }
      })
      await db.customPost.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Custom post deleted' })
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error) {
    console.error('Failed to delete custom post data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
