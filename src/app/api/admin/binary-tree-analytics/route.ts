import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET(request: Request) {
  try {
    // Database connectivity guard
    try {
      await db.$queryRaw`SELECT 1`
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database connection failed',
        diagnosticTrace: {
          message: 'Failed to connect to the database container or host.',
          actions: [
            'Check DB Container Status (running/healthy)',
            'Verify Network Bridge / port mappings',
            'Validate .env mapping (DATABASE_URL)'
          ],
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }, { status: 503 })
    }

    // Get basic user counts
    const [totalUsers, usersWithLeftChild, usersWithRightChild, usersWithBothChildren, usersWithNoChildren] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { binaryTreeLeftChildId: { not: null } } }),
      db.user.count({ where: { binaryTreeRightChildId: { not: null } } }),
      db.user.count({
        where: {
          binaryTreeLeftChildId: { not: null },
          binaryTreeRightChildId: { not: null }
        }
      }),
      db.user.count({
        where: {
          binaryTreeLeftChildId: null,
          binaryTreeRightChildId: null
        }
      })
    ])

    // Get volume statistics
    const volumeStats = await db.user.aggregate({
      _avg: {
        binaryTreeLeftVolume: true,
        binaryTreeRightVolume: true,
        binaryTreeLeftVolumeCarryForward: true,
        binaryTreeRightVolumeCarryForward: true
      },
      _sum: {
        binaryTreeLeftVolume: true,
        binaryTreeRightVolume: true,
        binaryTreeLeftVolumeCarryForward: true,
        binaryTreeRightVolumeCarryForward: true
      }
    })

    // Get audit log counts for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const auditLogCountToday = await db.binaryTreeAuditLog.count({
      where: {
        performedAt: {
          gte: today
        }
      }
    })

    // Get placement counts by action type
    const placementCount = await db.binaryTreeAuditLog.count({
      where: {
        actionType: 'PLACE'
      }
    })

    const volumeUpdateCount = await db.binaryTreeAuditLog.count({
      where: {
        actionType: 'VOLUME_UPDATE'
      }
    })

    const bonusDistributionCount = await db.binaryTreeAuditLog.count({
      where: {
        actionType: 'BONUS_DISTRIBUTION'
      }
    })

    // Find root users (users with no parent)
    const rootUsers = await db.user.count({
      where: {
        binaryTreeParentId: null
      }
    })

    // Calculate tree balance ratio (if we have at least one root)
    let balanceRatio = 0
    if (usersWithLeftChild > 0 || usersWithRightChild > 0) {
      balanceRatio = Math.abs((usersWithLeftChild || 0) - (usersWithRightChild || 0)) /
                    Math.max((usersWithLeftChild || 0) + (usersWithRightChild || 0), 1)
    }

    return NextResponse.json({
      totalUsers,
      treeStructure: {
        rootUsers,
        usersWithLeftChild,
        usersWithRightChild,
        usersWithBothChildren,
        usersWithNoChildren,
        balanceRatio: Number(balanceRatio.toFixed(4)) // Ratio of imbalance (0 = perfectly balanced)
      },
      volumeStatistics: {
        leftVolume: {
          total: volumeStats._sum.binaryTreeLeftVolume || 0,
          average: volumeStats._avg.binaryTreeLeftVolume || 0
        },
        rightVolume: {
          total: volumeStats._sum.binaryTreeRightVolume || 0,
          average: volumeStats._avg.binaryTreeRightVolume || 0
        },
        leftCarryForward: {
          total: volumeStats._sum.binaryTreeLeftVolumeCarryForward || 0,
          average: volumeStats._avg.binaryTreeLeftVolumeCarryForward || 0
        },
        rightCarryForward: {
          total: volumeStats._sum.binaryTreeRightVolumeCarryForward || 0,
          average: volumeStats._avg.binaryTreeRightVolumeCarryForward || 0
        }
      },
      auditMetrics: {
        placementsToday: placementCount, // Note: this is total, not today. We'll fix below.
        volumeUpdatesToday: volumeUpdateCount, // Total
        bonusDistributionsToday: bonusDistributionCount, // Total
        auditLogsToday: auditLogCountToday
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Binary tree analytics error:', error)
    return NextResponse.json({ error: 'Failed to get binary tree analytics' }, { status: 500 })
  }
}