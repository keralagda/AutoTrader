import { db } from './db'

/**
 * Logs an audit event for binary tree operations.
 */
async function logBinaryTreeAudit(
  userId: string,
  actionType: string,
  actionDetails: any,
  performedBy: string | null = null
) {
  try {
    await db.binaryTreeAuditLog.create({
      data: {
        userId,
        actionType,
        actionDetails: JSON.parse(JSON.stringify(actionDetails)), // Ensure it's serializable
        performedBy: performedBy || 'SYSTEM',
      },
    })
  } catch (error) {
    // Don't let audit logging errors break the main operation
    console.error('Failed to log binary tree audit:', error)
  }
}

/**
 * Calculates the size of a user's binary subtree recursively.
 */
export async function getSubtreeSize(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { binaryTreeLeftChildId: true, binaryTreeRightChildId: true }
  })
  if (!user) return 0
  let count = 0
  if (user.binaryTreeLeftChildId) {
    count += 1 + await getSubtreeSize(user.binaryTreeLeftChildId)
  }
  if (user.binaryTreeRightChildId) {
    count += 1 + await getSubtreeSize(user.binaryTreeRightChildId)
  }
  return count
}

/**
 * Traverses down starting from startUserId to find the first node with an empty child slot.
 * Prefers left then right. (Level-by-level BFS search)
 */
async function findFirstEmptySlotBFS(startUserId: string): Promise<{ parentId: string; position: 'left' | 'right' }> {
  const startUser = await db.user.findUnique({ where: { id: startUserId } })
  if (!startUser) throw new Error('Start user not found')

  const queue: any[] = [startUser]

  while (queue.length > 0) {
    const node = queue.shift()!
    if (!node.binaryTreeLeftChildId) {
      return { parentId: node.id, position: 'left' }
    }
    if (!node.binaryTreeRightChildId) {
      return { parentId: node.id, position: 'right' }
    }

    const left = await db.user.findUnique({ where: { id: node.binaryTreeLeftChildId } })
    const right = await db.user.findUnique({ where: { id: node.binaryTreeRightChildId } })
    if (left) queue.push(left)
    if (right) queue.push(right)
  }

  return { parentId: startUserId, position: 'left' }
}

/**
 * Places a newly registered user into the binary MLM tree under the sponsor.
 * Utilizes the sponsor's active binary MLM plan spillover configuration.
 */
export async function placeUserInBinaryTree(newUserId: string, sponsorId: string) {
  const sponsor = await db.user.findUnique({ where: { id: sponsorId } })
  if (!sponsor) return

  // Find sponsor's active plan with binary MLM enabled
  const activeDeposits = await db.deposit.findMany({
    where: { userId: sponsorId, status: { in: ['active', 'locked'] } },
    include: { plan: true }
  })
  const binaryPlan = activeDeposits.map(d => d.plan).find(p => p.isBinaryMlmEnabled)
  const placement = binaryPlan?.binarySpilloverPlacement || 'balanced'

  let targetParentId = sponsorId
  let position: 'left' | 'right' = 'left'

  if (placement === 'left') {
    // Go down the extreme left leg of sponsor's tree
    let current = sponsor
    while (current.binaryTreeLeftChildId) {
      const next = await db.user.findUnique({ where: { id: current.binaryTreeLeftChildId } })
      if (!next) break
      current = next
    }
    targetParentId = current.id
    position = 'left'
  } else if (placement === 'right') {
    // Go down the extreme right leg of sponsor's tree
    let current = sponsor
    while (current.binaryTreeRightChildId) {
      const next = await db.user.findUnique({ where: { id: current.binaryTreeRightChildId } })
      if (!next) break
      current = next
    }
    targetParentId = current.id
    position = 'right'
  } else if (placement === 'balanced') {
    // Compare sponsor's left subtree vs right subtree size
    const leftSize = sponsor.binaryTreeLeftChildId ? (1 + await getSubtreeSize(sponsor.binaryTreeLeftChildId)) : 0
    const rightSize = sponsor.binaryTreeRightChildId ? (1 + await getSubtreeSize(sponsor.binaryTreeRightChildId)) : 0

    if (leftSize <= rightSize) {
      if (!sponsor.binaryTreeLeftChildId) {
        targetParentId = sponsor.id
        position = 'left'
      } else {
        // BFS under left child to find first empty slot
        const res = await findFirstEmptySlotBFS(sponsor.binaryTreeLeftChildId)
        targetParentId = res.parentId
        position = res.position
      }
    } else {
      if (!sponsor.binaryTreeRightChildId) {
        targetParentId = sponsor.id
        position = 'right'
      } else {
        // BFS under right child to find first empty slot
        const res = await findFirstEmptySlotBFS(sponsor.binaryTreeRightChildId)
        targetParentId = res.parentId
        position = res.position
      }
    }
  } else {
    // Default or 'cycle_fill': BFS starting from sponsor
    const res = await findFirstEmptySlotBFS(sponsorId)
    targetParentId = res.parentId
    position = res.position
  }

  // Fetch target parent
  const targetParent = await db.user.findUnique({ where: { id: targetParentId } })
  if (!targetParent) return

  const newPositionPath = (targetParent.binaryTreePosition || '') + (position === 'left' ? 'L' : 'R')

  // Update new user position
  await db.user.update({
    where: { id: newUserId },
    data: {
      binaryTreeParentId: targetParentId,
      binaryTreePosition: newPositionPath,
    }
  })

  // Update target parent's child pointer
  if (position === 'left') {
    await db.user.update({
      where: { id: targetParentId },
      data: { binaryTreeLeftChildId: newUserId }
    })
  } else {
    await db.user.update({
      where: { id: targetParentId },
      data: { binaryTreeRightChildId: newUserId }
    })
  }

  // Log the placement
  await logBinaryTreeAudit(
    newUserId,
    'PLACE',
    {
      sponsorId,
      targetParentId,
      position,
      placement,
      newPositionPath: (targetParent.binaryTreePosition || '') + (position === 'left' ? 'L' : 'R')
    },
    null // System performed the action
  )
}

/**
 * Updates the cumulative left/right volumes and carry forward volumes recursively upwards for all ancestors.
 */
export async function updateBinaryTreeVolumes(userId: string, amount: number) {
  let current = await db.user.findUnique({ where: { id: userId } })
  if (!current) return

  const volume = amount

  // Walk up the binary tree
  while (current && current.binaryTreeParentId) {
    const parent = await db.user.findUnique({ where: { id: current.binaryTreeParentId } })
    if (!parent) break

    if (parent.binaryTreeLeftChildId === current.id) {
      await db.user.update({
        where: { id: parent.id },
        data: {
          binaryTreeLeftVolume: { increment: volume },
          binaryTreeLeftVolumeCarryForward: { increment: volume },
        }
      })
    } else if (parent.binaryTreeRightChildId === current.id) {
      await db.user.update({
        where: { id: parent.id },
        data: {
          binaryTreeRightVolume: { increment: volume },
          binaryTreeRightVolumeCarryForward: { increment: volume },
        }
      })
    }

    current = parent
  }

  // Log the volume update
  await logBinaryTreeAudit(
    userId,
    'VOLUME_UPDATE',
    {
      amount: volume,
      note: 'Volume updated and propagated up the tree'
    },
    null // System performed the action
  )
}

/**
 * Calculates and distributes binary MLM pairing bonuses, flush bonuses, and cycle bonuses for a user.
 */
export async function distributeBinaryPairingBonusesForUser(userId: string, plan: any, now: Date) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return

  let leftCF = user.binaryTreeLeftVolumeCarryForward
  let rightCF = user.binaryTreeRightVolumeCarryForward
  let flushBonus = 0 // Initialize for audit logging

  if (leftCF <= 0 && rightCF <= 0) return

  const referenceValue = plan.minDeposit || 100

  // --- 1. Cycle Bonus (Executed first to allow coexistence) ---
  let cycleBonus = 0
  let cycles = 0
  let leftUnit = 0
  let rightUnit = 0

  if (plan.binaryCycleEnabled) {
    const [leftRatio, rightRatio] = (plan.binaryCycleRatio || '1:1').split(':').map(Number)
    const referenceValuePerCycle = plan.minDeposit || 100

    leftUnit = leftRatio * referenceValuePerCycle
    rightUnit = rightRatio * referenceValuePerCycle

    cycles = Math.min(
      Math.floor(leftCF / leftUnit),
      Math.floor(rightCF / rightUnit)
    )

    if (cycles > 0) {
      cycleBonus = cycles * ((plan.binaryCycleBonusPercent || 5) / 100) * referenceValuePerCycle
    }
  }

  // --- 2. Pairing Bonus (Executed on remaining volume) ---
  let matchedVolume = 0
  const matchingType = plan.binaryMatchingType || 'weaker_leg'

  // Remaining volume after cycle deduction
  const leftAfterCycle = Math.max(0, leftCF - cycles * leftUnit)
  const rightAfterCycle = Math.max(0, rightCF - cycles * rightUnit)

  if (matchingType === 'weaker_leg') {
    matchedVolume = Math.min(leftAfterCycle, rightAfterCycle)
  } else if (matchingType === 'both_legs') {
    matchedVolume = leftAfterCycle + rightAfterCycle
  } else if (matchingType === 'stronger_leg') {
    matchedVolume = Math.max(leftAfterCycle, rightAfterCycle)
  }

  let finalPairingBonus = 0
  if (matchedVolume > 0) {
    let bonusPerPair = 0
    if (plan.binaryPairingBonusType === 'fixed') {
      bonusPerPair = plan.binaryPairingBonusFixed || 0
    } else {
      bonusPerPair = referenceValue * ((plan.binaryPairingBonusPercent || 10) / 100)
    }

    // Daily & Weekly cap checks for pairing
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const [todayEarnings, weeklyEarnings] = await Promise.all([
      db.earning.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: 'binary_pairing_bonus',
          createdAt: { gte: startOfDay },
        }
      }),
      db.earning.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: 'binary_pairing_bonus',
          createdAt: { gte: startOfWeek },
        }
      })
    ])

    const dailyBonusPaid = todayEarnings._sum.amount || 0
    const weeklyBonusPaid = weeklyEarnings._sum.amount || 0

    const maxDailyBonus = plan.binaryDailyPairingCap > 0 ? plan.binaryDailyPairingCap * bonusPerPair : Infinity
    const maxWeeklyBonus = plan.binaryWeeklyPairingCap > 0 ? plan.binaryWeeklyPairingCap * bonusPerPair : Infinity

    const remainingDailyBonus = Math.max(0, maxDailyBonus - dailyBonusPaid)
    const remainingWeeklyBonus = Math.max(0, maxWeeklyBonus - weeklyBonusPaid)
    const allowedBonus = Math.min(remainingDailyBonus, remainingWeeklyBonus)

    if (allowedBonus > 0) {
      let proposedBonus = 0
      if (plan.binaryPairingBonusType === 'fixed') {
        const matchedPairs = matchedVolume / referenceValue
        proposedBonus = matchedPairs * plan.binaryPairingBonusFixed
      } else {
        proposedBonus = matchedVolume * ((plan.binaryPairingBonusPercent || 10) / 100)
      }

      finalPairingBonus = proposedBonus
      if (proposedBonus > allowedBonus) {
        matchedVolume = matchedVolume * (allowedBonus / proposedBonus)
        finalPairingBonus = allowedBonus
      }
    } else {
      matchedVolume = 0 // Cap reached, cannot match volume
    }
  }

  if (cycleBonus <= 0 && finalPairingBonus <= 0) return

  // Calculate final carry forwards
  let newLeftCF = leftAfterCycle
  let newRightCF = rightAfterCycle

  if (finalPairingBonus > 0) {
    if (plan.binaryCarryForward) {
      if (matchingType === 'weaker_leg') {
        newLeftCF = Math.max(0, leftAfterCycle - matchedVolume)
        newRightCF = Math.max(0, rightAfterCycle - matchedVolume)
      } else if (matchingType === 'both_legs') {
        newLeftCF = 0
        newRightCF = 0
      } else if (matchingType === 'stronger_leg') {
        const maxSide = leftAfterCycle >= rightAfterCycle ? 'left' : 'right'
        if (maxSide === 'left') {
          newLeftCF = Math.max(0, leftAfterCycle - matchedVolume)
          newRightCF = 0
        } else {
          newRightCF = Math.max(0, rightAfterCycle - matchedVolume)
          newLeftCF = 0
        }
      }
    } else {
      newLeftCF = 0
      newRightCF = 0
    }
  } else if (!plan.binaryCarryForward) {
    newLeftCF = 0
    newRightCF = 0
  }

  // --- 3. Execute Transaction for Pairing & Cycle Bonuses ---
  await db.$transaction(async (tx) => {
    const totalBonus = finalPairingBonus + cycleBonus

    await tx.user.update({
      where: { id: userId },
      data: {
        tradingBalance: { increment: totalBonus },
        totalEarnings: { increment: totalBonus },
        binaryTreeLeftVolumeCarryForward: newLeftCF,
        binaryTreeRightVolumeCarryForward: newRightCF,
      }
    })

    if (finalPairingBonus > 0) {
      await tx.earning.create({
        data: {
          userId,
          amount: finalPairingBonus,
          type: 'binary_pairing_bonus',
          walletTarget: 'trading',
        }
      })

      await tx.transactionLog.create({
        data: {
          userId,
          type: 'bonus',
          amount: finalPairingBonus,
          balanceBefore: user.tradingBalance,
          balanceAfter: user.tradingBalance + finalPairingBonus,
          wallet: 'trading',
          description: `Binary MLM Pairing Bonus (${matchingType} matching)`,
        }
      })

      await tx.notification.create({
        data: {
          userId,
          title: 'Binary Pairing Bonus! 💸',
          message: `You earned $${finalPairingBonus.toFixed(2)} from binary pairing bonus.`,
          type: 'earning',
        }
      })
    }

    if (cycleBonus > 0) {
      await tx.earning.create({
        data: {
          userId,
          amount: cycleBonus,
          type: 'binary_cycle_bonus',
          walletTarget: 'trading',
        }
      })

      await tx.transactionLog.create({
        data: {
          userId,
          type: 'bonus',
          amount: cycleBonus,
          balanceBefore: user.tradingBalance + finalPairingBonus,
          balanceAfter: user.tradingBalance + finalPairingBonus + cycleBonus,
          wallet: 'trading',
          description: `Binary MLM Cycle Bonus (${cycles} cycle(s) completed)`,
        }
      })

      await tx.notification.create({
        data: {
          userId,
          title: 'Binary Cycle Bonus! 🔄',
          message: `You earned $${cycleBonus.toFixed(2)} for completing ${cycles} binary cycles.`,
          type: 'earning',
        }
      })
    }
  })

  // --- 4. Process Flush Bonus ---
  if (plan.binaryFlushBonusEnabled) {
    const minVol = Math.min(newLeftCF, newRightCF)
    const maxVol = Math.max(newLeftCF, newRightCF)
    if (maxVol > 0) {
      const ratio = minVol > 0 ? maxVol / minVol : Infinity
      if (ratio >= (plan.binaryFlushBonusThreshold || 200) / 100) {
        const excessVolume = maxVol - minVol
        flushBonus = excessVolume * ((plan.binaryFlushBonusPercent || 5) / 100)

        if (flushBonus > 0) {
          const updatedUser = await db.user.findUnique({ where: { id: userId } })
          if (updatedUser) {
            const updatedLeftCF = newLeftCF === maxVol ? minVol : newLeftCF
            const updatedRightCF = newRightCF === maxVol ? minVol : newRightCF

            await db.$transaction(async (tx) => {
              await tx.user.update({
                where: { id: userId },
                data: {
                  tradingBalance: { increment: flushBonus },
                  totalEarnings: { increment: flushBonus },
                  binaryTreeLeftVolumeCarryForward: updatedLeftCF,
                  binaryTreeRightVolumeCarryForward: updatedRightCF,
                }
              })

              await tx.earning.create({
                data: {
                  userId,
                  amount: flushBonus,
                  type: 'binary_flush_bonus',
                  walletTarget: 'trading',
                }
              })

              await tx.transactionLog.create({
                data: {
                  userId,
                  type: 'bonus',
                  amount: flushBonus,
                  balanceBefore: updatedUser.tradingBalance,
                  balanceAfter: updatedUser.tradingBalance + flushBonus,
                  wallet: 'trading',
                  description: `Binary MLM Flush Bonus (imbalance ratio: ${ratio.toFixed(2)}x)`,
                }
              })

              await tx.notification.create({
                data: {
                  userId,
                  title: 'Binary Flush Bonus! 💥',
                  message: `You earned $${flushBonus.toFixed(2)} from binary flush bonus (excess volume flushed).`,
                  type: 'earning',
                }
              })
            })
          }
        }
      }
    }
  }

  // Log the bonus distribution
  await logBinaryTreeAudit(
    userId,
    'BONUS_DISTRIBUTION',
    {
      cycleBonus,
      finalPairingBonus,
      flushBonus: typeof flushBonus !== 'undefined' ? flushBonus : 0,
      planId: plan.id,
      planName: plan.name,
      matchingType: plan.binaryMatchingType || 'weaker_leg',
      binaryCarryForward: plan.binaryCarryForward
    },
    null // System performed the action
  )
}
