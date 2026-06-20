import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      leftVolumeDelta = 0,
      rightVolumeDelta = 0,
      leftCarryForwardDelta = 0,
      rightCarryForwardDelta = 0,
      personalVolumeDelta = 0,
      businessVolumeDelta = 0,
      teamVolumeDelta = 0,
      reason = 'Administrative adjustment',
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        binaryTreeLeftVolume: true,
        binaryTreeRightVolume: true,
        binaryTreeLeftVolumeCarryForward: true,
        binaryTreeRightVolumeCarryForward: true,
        personalVolume: true,
        businessVolume: true,
        teamVolume: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Apply adjustments using a transaction to maintain integrity
    const updatedUser = await db.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: userId },
        data: {
          binaryTreeLeftVolume: { increment: leftVolumeDelta },
          binaryTreeRightVolume: { increment: rightVolumeDelta },
          binaryTreeLeftVolumeCarryForward: { increment: leftCarryForwardDelta },
          binaryTreeRightVolumeCarryForward: { increment: rightCarryForwardDelta },
          personalVolume: { increment: personalVolumeDelta },
          businessVolume: { increment: businessVolumeDelta },
          teamVolume: { increment: teamVolumeDelta },
        },
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          title: '⚙️ Binary Volume Adjusted',
          message: `An administrator has adjusted your binary leg volumes. Reason: ${reason}`,
          type: 'info',
        },
      })

      // Log the adjustment in the audit log
      await tx.binaryTreeAuditLog.create({
        data: {
          userId,
          actionType: 'ADMIN_ADJUSTMENT',
          actionDetails: {
            leftVolumeDelta,
            rightVolumeDelta,
            leftCarryForwardDelta,
            rightCarryForwardDelta,
            personalVolumeDelta,
            businessVolumeDelta,
            teamVolumeDelta,
            reason,
            before: {
              leftVolume: user.binaryTreeLeftVolume,
              rightVolume: user.binaryTreeRightVolume,
              leftCarryForward: user.binaryTreeLeftVolumeCarryForward,
              rightCarryForward: user.binaryTreeRightVolumeCarryForward,
              personalVolume: user.personalVolume,
              businessVolume: user.businessVolume,
              teamVolume: user.teamVolume,
            },
            after: {
              leftVolume: result.binaryTreeLeftVolume,
              rightVolume: result.binaryTreeRightVolume,
              leftCarryForward: result.binaryTreeLeftVolumeCarryForward,
              rightCarryForward: result.binaryTreeRightVolumeCarryForward,
              personalVolume: result.personalVolume,
              businessVolume: result.businessVolume,
              teamVolume: result.teamVolume,
            },
          },
          performedBy: 'ADMIN',
        },
      })

      return result
    })

    return NextResponse.json({
      success: true,
      message: 'Volume adjustment completed successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        binaryTreeLeftVolume: updatedUser.binaryTreeLeftVolume,
        binaryTreeRightVolume: updatedUser.binaryTreeRightVolume,
        binaryTreeLeftVolumeCarryForward: updatedUser.binaryTreeLeftVolumeCarryForward,
        binaryTreeRightVolumeCarryForward: updatedUser.binaryTreeRightVolumeCarryForward,
        personalVolume: updatedUser.personalVolume,
        businessVolume: updatedUser.businessVolume,
        teamVolume: updatedUser.teamVolume,
      },
    })
  } catch (error) {
    console.error('Failed to adjust volume:', error)
    return NextResponse.json({ error: 'Failed to apply volume adjustment' }, { status: 500 })
  }
}
