import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_ROLES, hasPermission, canManageRole, type RoleDefinition, type Role } from '@/lib/permissions'

// Helper: Load roles from DB or use defaults
async function loadRoles(): Promise<RoleDefinition[]> {
  const setting = await db.setting.findUnique({ where: { key: 'roles_permissions' } })
  if (setting) {
    try { return JSON.parse(setting.value) } catch { /* fall through */ }
  }
  return DEFAULT_ROLES
}

// GET - Get roles, permissions matrix, and staff users
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')
    const roles = await loadRoles()

    if (action === 'matrix') {
      // Return full permission matrix
      return NextResponse.json({ roles })
    }

    if (action === 'staff') {
      // Get all staff members (non-user roles)
      const staff = await db.user.findMany({
        where: { role: { not: 'user' } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { referrals: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json({ staff, roles })
    }

    if (action === 'check') {
      // Check permission for a specific user
      const userId = req.nextUrl.searchParams.get('userId')
      const module = req.nextUrl.searchParams.get('module')
      const actionType = req.nextUrl.searchParams.get('actionType')

      if (!userId || !module || !actionType) {
        return NextResponse.json({ error: 'userId, module, actionType required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const allowed = hasPermission(roles, user.role, module as any, actionType as any)
      return NextResponse.json({ allowed, role: user.role })
    }

    // Default: return roles + staff count
    const staffCount = await db.user.groupBy({
      by: ['role'],
      where: { role: { not: 'user' } },
      _count: true,
    })

    return NextResponse.json({ roles, staffCount })
  } catch (error) {
    console.error('Roles GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new custom role
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, label, description, color, level, permissions } = body

    if (!id || !label) {
      return NextResponse.json({ error: 'id and label required' }, { status: 400 })
    }

    // Validate role id format
    if (!/^[a-z_]+$/.test(id)) {
      return NextResponse.json({ error: 'Role id must be lowercase with underscores only' }, { status: 400 })
    }

    const roles = await loadRoles()

    // Check if role already exists
    if (roles.find(r => r.id === id)) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 409 })
    }

    // Cannot create role with level >= 100 (super_admin only)
    if ((level || 0) >= 100) {
      return NextResponse.json({ error: 'Cannot create role with level >= 100' }, { status: 400 })
    }

    const newRole: RoleDefinition = {
      id: id as Role,
      label,
      description: description || '',
      color: color || '#6b7280',
      level: level || 10,
      permissions: permissions || [],
    }

    roles.push(newRole)

    await db.setting.upsert({
      where: { key: 'roles_permissions' },
      update: { value: JSON.stringify(roles) },
      create: { key: 'roles_permissions', value: JSON.stringify(roles) },
    })

    await db.activityLog.create({
      data: { action: 'role_created', details: JSON.stringify({ roleId: id, label }) },
    })

    return NextResponse.json({ success: true, role: newRole })
  } catch (error) {
    console.error('Roles POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update role permissions or assign role to user
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    // Assign role to user
    if (body.userId && body.role) {
      const roles = await loadRoles()
      const targetRole = roles.find(r => r.id === body.role)
      if (!targetRole) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: body.userId } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      // Cannot change super_admin role
      if (user.role === 'super_admin' && body.role !== 'super_admin') {
        return NextResponse.json({ error: 'Cannot demote super_admin' }, { status: 403 })
      }

      await db.user.update({
        where: { id: body.userId },
        data: { role: body.role },
      })

      await db.activityLog.create({
        data: {
          userId: body.userId,
          action: 'role_assigned',
          details: JSON.stringify({ previousRole: user.role, newRole: body.role }),
        },
      })

      return NextResponse.json({ success: true })
    }

    // Update role permissions
    if (body.roleId && body.permissions !== undefined) {
      const roles = await loadRoles()
      const roleIndex = roles.findIndex(r => r.id === body.roleId)

      if (roleIndex === -1) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 })
      }

      // Cannot modify super_admin permissions
      if (body.roleId === 'super_admin') {
        return NextResponse.json({ error: 'Cannot modify super_admin permissions' }, { status: 403 })
      }

      // Update permissions
      roles[roleIndex].permissions = body.permissions
      if (body.label) roles[roleIndex].label = body.label
      if (body.description) roles[roleIndex].description = body.description
      if (body.color) roles[roleIndex].color = body.color
      if (body.level !== undefined && body.level < 100) roles[roleIndex].level = body.level

      await db.setting.upsert({
        where: { key: 'roles_permissions' },
        update: { value: JSON.stringify(roles) },
        create: { key: 'roles_permissions', value: JSON.stringify(roles) },
      })

      await db.activityLog.create({
        data: { action: 'role_updated', details: JSON.stringify({ roleId: body.roleId }) },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Roles PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a custom role (reassign users to 'user')
export async function DELETE(req: NextRequest) {
  try {
    const { roleId } = await req.json()
    if (!roleId) return NextResponse.json({ error: 'roleId required' }, { status: 400 })

    // Cannot delete built-in roles
    const protectedRoles = ['super_admin', 'admin', 'user']
    if (protectedRoles.includes(roleId)) {
      return NextResponse.json({ error: 'Cannot delete built-in roles' }, { status: 403 })
    }

    const roles = await loadRoles()
    const filtered = roles.filter(r => r.id !== roleId)

    if (filtered.length === roles.length) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Reassign all users with this role to 'user'
    const reassigned = await db.user.updateMany({
      where: { role: roleId },
      data: { role: 'user' },
    })

    await db.setting.upsert({
      where: { key: 'roles_permissions' },
      update: { value: JSON.stringify(filtered) },
      create: { key: 'roles_permissions', value: JSON.stringify(filtered) },
    })

    await db.activityLog.create({
      data: { action: 'role_deleted', details: JSON.stringify({ roleId, usersReassigned: reassigned.count }) },
    })

    return NextResponse.json({ success: true, usersReassigned: reassigned.count })
  } catch (error) {
    console.error('Roles DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
