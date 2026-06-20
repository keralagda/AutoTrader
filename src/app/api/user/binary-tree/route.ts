import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TreeNode {
  id: string
  name: string
  email: string
  mlmRank: string
  isActive: boolean
  binaryTreeLeftChildId: string | null
  binaryTreeRightChildId: string | null
  binaryTreeLeftVolume: number
  binaryTreeRightVolume: number
  binaryTreeLeftVolumeCarryForward: number
  binaryTreeRightVolumeCarryForward: number
  personalVolume: number
  teamVolume: number
  binaryTreePosition: string
  leftLegCount?: number
  rightLegCount?: number
  leftChild?: TreeNode | null
  rightChild?: TreeNode | null
}

async function fetchTreeNode(userId: string, currentDepth: number, maxDepth: number): Promise<TreeNode | null> {
  if (currentDepth > maxDepth) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      mlmRank: true,
      isActive: true,
      binaryTreeLeftChildId: true,
      binaryTreeRightChildId: true,
      binaryTreeLeftVolume: true,
      binaryTreeRightVolume: true,
      binaryTreeLeftVolumeCarryForward: true,
      binaryTreeRightVolumeCarryForward: true,
      personalVolume: true,
      teamVolume: true,
      binaryTreePosition: true,
    }
  })

  if (!user) return null

  // Calculate total children in left and right legs using startsWith index search
  const [leftLegCount, rightLegCount] = await Promise.all([
    db.user.count({
      where: {
        binaryTreePosition: {
          startsWith: (user.binaryTreePosition || '') + 'L'
        }
      }
    }),
    db.user.count({
      where: {
        binaryTreePosition: {
          startsWith: (user.binaryTreePosition || '') + 'R'
        }
      }
    })
  ])

  const node: TreeNode = {
    ...user,
    leftLegCount,
    rightLegCount,
    leftChild: null,
    rightChild: null,
  }

  if (user.binaryTreeLeftChildId) {
    node.leftChild = await fetchTreeNode(user.binaryTreeLeftChildId, currentDepth + 1, maxDepth)
  }
  if (user.binaryTreeRightChildId) {
    node.rightChild = await fetchTreeNode(user.binaryTreeRightChildId, currentDepth + 1, maxDepth)
  }

  return node
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const rootId = req.nextUrl.searchParams.get('rootId') || userId
    const searchQuery = req.nextUrl.searchParams.get('search')
    const resolvePathUserId = req.nextUrl.searchParams.get('resolvePath')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // 1. Resolve path from target downline user back to sponsor
    if (resolvePathUserId) {
      const targetUser = await db.user.findUnique({
        where: { id: resolvePathUserId },
        select: { id: true, name: true, binaryTreePosition: true }
      })
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
      }

      const sponsor = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, binaryTreePosition: true }
      })
      if (!sponsor) {
        return NextResponse.json({ error: 'Sponsor user not found' }, { status: 404 })
      }

      // Verify that target user is indeed in sponsor's downline (prefix match)
      if (!targetUser.binaryTreePosition.startsWith(sponsor.binaryTreePosition || '')) {
        return NextResponse.json({ error: 'User is not in your downline' }, { status: 403 })
      }

      // Build path upwards from target to sponsor
      const path: { id: string; name: string }[] = []
      let currentId: string | null = targetUser.id

      while (currentId && currentId !== sponsor.id) {
        const u = await db.user.findUnique({
          where: { id: currentId },
          select: { id: true, name: true, binaryTreeParentId: true }
        })
        if (!u) break
        path.unshift({ id: u.id, name: u.name })
        currentId = u.binaryTreeParentId
      }

      // Add sponsor at the root of this path
      path.unshift({ id: sponsor.id, name: sponsor.name })

      return NextResponse.json({ path })
    }

    // 2. Downline search
    if (searchQuery) {
      const sponsor = await db.user.findUnique({
        where: { id: userId },
        select: { binaryTreePosition: true }
      })
      if (!sponsor) {
        return NextResponse.json({ error: 'Sponsor user not found' }, { status: 404 })
      }

      const results = await db.user.findMany({
        where: {
          binaryTreePosition: {
            startsWith: sponsor.binaryTreePosition || ''
          },
          AND: [
            { id: { not: userId } },
            {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          binaryTreePosition: true,
          mlmRank: true
        },
        take: 10
      })

      return NextResponse.json({ results })
    }

    if (!rootId) {
      return NextResponse.json({ error: 'rootId required' }, { status: 400 })
    }

    // Load tree structure down to 3 levels
    const tree = await fetchTreeNode(rootId, 1, 3)

    // Also get sponsor placement preference if they are checking their own tree
    let placementPreference = 'balanced'
    let hasMatchedFirstPair = false
    if (userId) {
      const [prefSetting, firstPairSetting] = await Promise.all([
        db.setting.findUnique({ where: { key: `binary_placement_pref_${userId}` } }),
        db.setting.findUnique({ where: { key: `binary_first_pair_matched_${rootId}` } })
      ])
      placementPreference = prefSetting?.value || 'balanced'
      hasMatchedFirstPair = firstPairSetting?.value === 'true'
    }

    return NextResponse.json({
      tree,
      placementPreference,
      hasMatchedFirstPair,
    })
  } catch (error) {
    console.error('Failed to fetch user binary tree:', error)
    return NextResponse.json({ error: 'Failed to fetch binary tree' }, { status: 500 })
  }
}

// Update sponsor placement preference
export async function POST(req: NextRequest) {
  try {
    const { userId, preference } = await req.json()
    if (!userId || !preference) {
      return NextResponse.json({ error: 'userId and preference required' }, { status: 400 })
    }

    if (!['left', 'right', 'balanced', 'cycle_fill'].includes(preference)) {
      return NextResponse.json({ error: 'Invalid placement preference' }, { status: 400 })
    }

    await db.setting.upsert({
      where: { key: `binary_placement_pref_${userId}` },
      update: { value: preference },
      create: { key: `binary_placement_pref_${userId}`, value: preference },
    })

    return NextResponse.json({ success: true, preference })
  } catch (error) {
    console.error('Failed to update placement preference:', error)
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 })
  }
}
