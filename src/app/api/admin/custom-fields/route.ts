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

export async function GET() {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const groups = await db.customFieldGroup.findMany({
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Failed to fetch custom field groups:', error)
    return NextResponse.json({ error: 'Failed to fetch custom field groups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const body = await request.json()
    const { name, rules, conditionalLogic, fields } = body

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    const rulesStr = typeof rules === 'string' ? rules : JSON.stringify(rules || {})
    const condStr = typeof conditionalLogic === 'string' ? conditionalLogic : JSON.stringify(conditionalLogic || null)

    const group = await db.customFieldGroup.create({
      data: {
        name,
        rules: rulesStr,
        conditionalLogic: condStr,
        fields: {
          create: (fields || []).map((f: any, idx: number) => ({
            key: f.key,
            label: f.label,
            type: f.type || 'text',
            options: typeof f.options === 'string' ? f.options : JSON.stringify(f.options || null),
            placeholder: f.placeholder || '',
            required: !!f.required,
            conditionalLogic: typeof f.conditionalLogic === 'string' ? f.conditionalLogic : JSON.stringify(f.conditionalLogic || null),
            sortOrder: f.sortOrder !== undefined ? f.sortOrder : idx
          }))
        }
      },
      include: {
        fields: true
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to create custom field group:', error)
    return NextResponse.json({ error: 'Failed to create custom field group' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const body = await request.json()
    const { id, name, rules, conditionalLogic, fields } = body

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required for update' }, { status: 400 })
    }

    const rulesStr = typeof rules === 'string' ? rules : JSON.stringify(rules || {})
    const condStr = typeof conditionalLogic === 'string' ? conditionalLogic : JSON.stringify(conditionalLogic || null)

    // Update group details
    await db.customFieldGroup.update({
      where: { id },
      data: {
        name,
        rules: rulesStr,
        conditionalLogic: condStr
      }
    })

    // Sync fields: delete old fields, and re-create them, or update
    // Let's do it simply by deleting existing and creating new fields to maintain order and structure
    await db.customFieldDefinition.deleteMany({
      where: { groupId: id }
    })

    if (fields && Array.isArray(fields)) {
      await db.customFieldDefinition.createMany({
        data: fields.map((f: any, idx: number) => ({
          groupId: id,
          key: f.key,
          label: f.label,
          type: f.type || 'text',
          options: typeof f.options === 'string' ? f.options : JSON.stringify(f.options || null),
          placeholder: f.placeholder || '',
          required: !!f.required,
          conditionalLogic: typeof f.conditionalLogic === 'string' ? f.conditionalLogic : JSON.stringify(f.conditionalLogic || null),
          sortOrder: f.sortOrder !== undefined ? f.sortOrder : idx
        }))
      })
    }

    const updatedGroup = await db.customFieldGroup.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Failed to update custom field group:', error)
    return NextResponse.json({ error: 'Failed to update custom field group' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await checkDbConnection())) return dbErrorResponse()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    await db.customFieldGroup.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Custom field group deleted successfully' })
  } catch (error) {
    console.error('Failed to delete custom field group:', error)
    return NextResponse.json({ error: 'Failed to delete custom field group' }, { status: 500 })
  }
}
