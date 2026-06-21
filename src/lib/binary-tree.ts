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
  const user = await db.user.findUnique({
    where: { id: newUserId },
    select: { binaryTreeParentId: true, binaryTreePosition: true }
  })
  if (user?.binaryTreeParentId || (user?.binaryTreePosition && user.binaryTreePosition !== '')) {
    // Already placed in binary tree
    return
  }

  const sponsor = await db.user.findUnique({ where: { id: sponsorId } })
  if (!sponsor) return

  // Find sponsor's active plan with binary MLM enabled
  const activeDeposits = await db.deposit.findMany({
    where: { userId: sponsorId, status: { in: ['active', 'locked'] } },
    include: { plan: true }
  })
  let binaryPlan = activeDeposits.map(d => d.plan).find(p => p.isBinaryMlmEnabled)

  if (!binaryPlan) {
    const setting = await db.setting.findUnique({ where: { key: `activated_plans_${sponsorId}` } })
    const activatedPlanIds: string[] = setting ? JSON.parse(setting.value) : []
    if (activatedPlanIds.length > 0) {
      binaryPlan = await db.plan.findFirst({
        where: { id: { in: activatedPlanIds }, isBinaryMlmEnabled: true, isActive: true }
      })
    }
  }

  if (!binaryPlan) {
    binaryPlan = await db.plan.findFirst({
      where: { isBinaryMlmEnabled: true, isActive: true },
      orderBy: { sortOrder: 'asc' }
    })
  }

  // Check sponsor's custom placement preference, fallback to plan config
  const prefSetting = await db.setting.findUnique({ where: { key: `binary_placement_pref_${sponsorId}` } })
  const placement = prefSetting?.value || binaryPlan?.binarySpilloverPlacement || 'balanced'

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
 * Also increments the PV for the user, BV for the sponsor, and TV recursively for ancestors, then runs rank checks.
 */
export async function updateBinaryTreeVolumes(userId: string, amount: number, planId?: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, referredById: true }
  })
  if (!user) return

  let plan: any = null
  if (planId) {
    plan = await db.plan.findUnique({ where: { id: planId } })
  }
  if (!plan) {
    // Find user's active plan with binary MLM enabled or fallback
    const activeDeposits = await db.deposit.findMany({
      where: { userId, status: { in: ['active', 'locked'] } },
      include: { plan: true }
    })
    plan = activeDeposits.map(d => d.plan).find(p => p.isBinaryMlmEnabled)
  }
  if (!plan) {
    plan = await db.plan.findFirst({
      where: { isBinaryMlmEnabled: true }
    })
  }

  const pvRatio = plan?.binaryPvRatio ?? 1.0
  const bvRatio = plan?.binaryBvRatio ?? 1.0
  const tvRatio = plan?.binaryTvRatio ?? 1.0

  const userIdsToUpgrade = new Set<string>()

  // 1. Personal Volume increment
  const pvIncrement = amount * pvRatio
  if (pvIncrement > 0) {
    await db.user.update({
      where: { id: userId },
      data: { personalVolume: { increment: pvIncrement } }
    })
    userIdsToUpgrade.add(userId)
  }

  // 2. Business Volume increment (sponsor)
  const bvIncrement = amount * bvRatio
  if (user.referredById && bvIncrement > 0) {
    await db.user.update({
      where: { id: user.referredById },
      data: { businessVolume: { increment: bvIncrement } }
    })
    userIdsToUpgrade.add(user.referredById)
  }

  // 3. Team Volume and Leg volume updates recursively for ancestors
  const tvIncrement = amount * tvRatio
  let current = await db.user.findUnique({ where: { id: userId } })
  
  while (current && current.binaryTreeParentId) {
    const parent = await db.user.findUnique({ where: { id: current.binaryTreeParentId } })
    if (!parent) break

    const dataToUpdate: any = {}
    if (parent.binaryTreeLeftChildId === current.id) {
      dataToUpdate.binaryTreeLeftVolume = { increment: amount }
      dataToUpdate.binaryTreeLeftVolumeCarryForward = { increment: amount }
    } else if (parent.binaryTreeRightChildId === current.id) {
      dataToUpdate.binaryTreeRightVolume = { increment: amount }
      dataToUpdate.binaryTreeRightVolumeCarryForward = { increment: amount }
    }

    if (tvIncrement > 0) {
      dataToUpdate.teamVolume = { increment: tvIncrement }
    }

    await db.user.update({
      where: { id: parent.id },
      data: dataToUpdate
    })

    userIdsToUpgrade.add(parent.id)
    current = parent
  }

  // Log the volume update
  await logBinaryTreeAudit(
    userId,
    'VOLUME_UPDATE',
    {
      amount,
      pvIncrement,
      bvIncrement,
      tvIncrement,
      note: 'Volumes (PV, BV, TV) updated and team volume/legs propagated'
    },
    null // System performed the action
  )

  // Run rank checks for all affected users
  for (const id of userIdsToUpgrade) {
    try {
      await checkMlmRankUpgrade(id, plan)
    } catch (e) {
      console.error(`Failed rank upgrade check for user ${id}:`, e)
    }
  }
}

export interface MlmRankConfig {
  level: number
  name: string
  reqPv: number
  reqBv: number
  reqTv: number
  bonus: number
  perks: string
  reqMinPersonalInvestment?: number
  reqRequiredPlanId?: string
  reqLeftVolume?: number
  reqRightVolume?: number
  reqWeakerLegVolume?: number
  reqDirectReferrals?: number
  reqActiveDirects?: number
  reqDirectsWithMinRankLevel?: number
  reqDirectsWithMinRankCount?: number
}

export function getDefaultRanks(): MlmRankConfig[] {
  return [
    { level: 0, name: 'Member', reqPv: 0, reqBv: 0, reqTv: 0, bonus: 0, perks: 'Access to basic plan' },
    { level: 1, name: 'Executive', reqPv: 100, reqBv: 500, reqTv: 1000, bonus: 50, perks: 'Executive Badge, 5% pairing limit increase', reqMinPersonalInvestment: 100, reqLeftVolume: 500, reqRightVolume: 500 },
    { level: 2, name: 'Manager', reqPv: 500, reqBv: 2500, reqTv: 5000, bonus: 250, perks: 'Manager Badge, 10% pairing limit increase', reqMinPersonalInvestment: 250, reqLeftVolume: 2000, reqRightVolume: 2000, reqActiveDirects: 2 },
    { level: 3, name: 'Director', reqPv: 2000, reqBv: 10000, reqTv: 20000, bonus: 1000, perks: 'Director Badge, Retreat invite, 15% pairing limit increase', reqMinPersonalInvestment: 1000, reqLeftVolume: 10000, reqRightVolume: 10000, reqActiveDirects: 4, reqDirectsWithMinRankLevel: 1, reqDirectsWithMinRankCount: 2 },
    { level: 4, name: 'President', reqPv: 10000, reqBv: 50000, reqTv: 100000, bonus: 5000, perks: 'President Ring, Luxury car program, 20% pairing limit increase', reqMinPersonalInvestment: 2500, reqLeftVolume: 50000, reqRightVolume: 50000, reqActiveDirects: 6, reqDirectsWithMinRankLevel: 2, reqDirectsWithMinRankCount: 2 },
  ]
}

export async function checkMlmRankUpgrade(userId: string, plan?: any) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      personalVolume: true,
      businessVolume: true,
      teamVolume: true,
      mlmRank: true,
      mlmLevel: true,
      tradingBalance: true,
      binaryTreeLeftVolume: true,
      binaryTreeRightVolume: true
    }
  })
  if (!user) return

  let resolvedPlan = plan
  if (!resolvedPlan) {
    // Find active plan with binary MLM enabled
    const activeDeposits = await db.deposit.findMany({
      where: { userId, status: { in: ['active', 'locked'] } },
      include: { plan: true }
    })
    resolvedPlan = activeDeposits.map(d => d.plan).find(p => p.isBinaryMlmEnabled)
    if (!resolvedPlan) {
      resolvedPlan = await db.plan.findFirst({
        where: { isBinaryMlmEnabled: true }
      })
    }
  }

  let ranks = getDefaultRanks()
  if (resolvedPlan?.mlmRewardsConfig) {
    try {
      const parsed = JSON.parse(resolvedPlan.mlmRewardsConfig)
      if (Array.isArray(parsed) && parsed.length > 0) {
        ranks = parsed
      }
    } catch (e) {
      console.error('Failed to parse mlmRewardsConfig', e)
    }
  }

  // Load all active deposits for the user
  const deposits = await db.deposit.findMany({
    where: { userId, status: { in: ['active', 'locked'] } },
    select: { amount: true, planId: true }
  })
  const totalActiveInvestment = deposits.reduce((sum, d) => sum + d.amount, 0)
  const activePlanIds = deposits.map(d => d.planId)

  // Load direct referrals
  const directReferrals = await db.user.findMany({
    where: { referredById: userId },
    select: { id: true, isActive: true, mlmLevel: true }
  })
  const directReferralsCount = directReferrals.length
  const activeDirectReferralsCount = directReferrals.filter(d => d.isActive).length

  const leftVolume = user.binaryTreeLeftVolume ?? 0
  const rightVolume = user.binaryTreeRightVolume ?? 0
  const weakerVolume = Math.min(leftVolume, rightVolume)

  // Sort ranks descending by level so we find the highest matching rank first
  const sortedRanks = [...ranks].sort((a, b) => b.level - a.level)

  const qualifiedRank = sortedRanks.find(r => {
    // Basic criteria
    if ((user.personalVolume ?? 0) < (r.reqPv ?? 0)) return false
    if ((user.businessVolume ?? 0) < (r.reqBv ?? 0)) return false
    if ((user.teamVolume ?? 0) < (r.reqTv ?? 0)) return false

    // Left/Right Leg volumes
    if (r.reqLeftVolume !== undefined && r.reqLeftVolume > 0 && leftVolume < r.reqLeftVolume) return false
    if (r.reqRightVolume !== undefined && r.reqRightVolume > 0 && rightVolume < r.reqRightVolume) return false
    if (r.reqWeakerLegVolume !== undefined && r.reqWeakerLegVolume > 0 && weakerVolume < r.reqWeakerLegVolume) return false

    // Personal Active Investment
    if (r.reqMinPersonalInvestment !== undefined && r.reqMinPersonalInvestment > 0 && totalActiveInvestment < r.reqMinPersonalInvestment) return false
    if (r.reqRequiredPlanId && !activePlanIds.includes(r.reqRequiredPlanId)) return false

    // Referrals count
    if (r.reqDirectReferrals !== undefined && r.reqDirectReferrals > 0 && directReferralsCount < r.reqDirectReferrals) return false
    if (r.reqActiveDirects !== undefined && r.reqActiveDirects > 0 && activeDirectReferralsCount < r.reqActiveDirects) return false

    // Direct referrals with min rank requirements
    if (r.reqDirectsWithMinRankLevel !== undefined && r.reqDirectsWithMinRankLevel > 0 && r.reqDirectsWithMinRankCount !== undefined && r.reqDirectsWithMinRankCount > 0) {
      const qualifyingDirects = directReferrals.filter(d => (d.mlmLevel ?? 0) >= r.reqDirectsWithMinRankLevel!).length
      if (qualifyingDirects < r.reqDirectsWithMinRankCount) return false
    }

    return true
  })

  if (qualifiedRank && qualifiedRank.level > (user.mlmLevel ?? 0)) {
    const oldRank = user.mlmRank || 'Member'
    const newRank = qualifiedRank.name
    const newLevel = qualifiedRank.level
    const bonus = qualifiedRank.bonus ?? 0

    await db.$transaction(async (tx) => {
      // 1. Update User Rank, Level, role and tradingBalance
      const newRole = user.role === 'user' && newLevel >= 1 ? 'leader' : undefined

      await tx.user.update({
        where: { id: userId },
        data: {
          mlmRank: newRank,
          mlmLevel: newLevel,
          role: newRole || undefined,
          tradingBalance: bonus > 0 ? { increment: bonus } : undefined
        }
      })

      // 2. Log Earning if bonus > 0
      if (bonus > 0) {
        await tx.earning.create({
          data: {
            userId,
            amount: bonus,
            type: 'rank_promotion_bonus',
            walletTarget: 'trading',
          }
        })

        // 3. Log Transaction
        await tx.transactionLog.create({
          data: {
            userId,
            type: 'bonus',
            amount: bonus,
            balanceBefore: user.tradingBalance,
            balanceAfter: user.tradingBalance + bonus,
            wallet: 'trading',
            description: `Leadership promotion bonus for rank: ${newRank}`,
            status: 'completed',
          }
        })
      }

      // 4. Create notification
      await tx.notification.create({
        data: {
          userId,
          title: '🎉 Leadership Rank Promoted!',
          message: `Congratulations! You have been promoted from ${oldRank} to ${newRank}. ${bonus > 0 ? `A cash bonus of $${bonus.toFixed(2)} has been credited to your trading wallet.` : ''}`,
          type: 'info',
        }
      })

      // 5. Audit Log
      await tx.binaryTreeAuditLog.create({
        data: {
          userId,
          actionType: 'RANK_UPGRADE',
          actionDetails: JSON.parse(JSON.stringify({
            oldRank,
            newRank,
            newLevel,
            bonusAwarded: bonus,
            reqPv: qualifiedRank.reqPv,
            reqBv: qualifiedRank.reqBv,
            reqTv: qualifiedRank.reqTv,
          })),
          performedBy: 'SYSTEM'
        }
      })
    })
  }
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
  let leftAfterCycle = Math.max(0, leftCF - cycles * leftUnit)
  let rightAfterCycle = Math.max(0, rightCF - cycles * rightUnit)

  // First Pair Check (1:2 or 2:1 ratio from registration amount)
  const firstPairSettingKey = `binary_first_pair_matched_${userId}`
  const firstPairSetting = await db.setting.findUnique({ where: { key: firstPairSettingKey } })
  const hasMatchedFirstPair = firstPairSetting?.value === 'true'

  let firstPairBonus = 0
  let isFirstPairMatch = false
  let firstPairLeftDeduct = 0
  let firstPairRightDeduct = 0

  if (!hasMatchedFirstPair) {
    if (leftAfterCycle >= 100 && rightAfterCycle >= 200) {
      isFirstPairMatch = true
      firstPairLeftDeduct = 100
      firstPairRightDeduct = 200
    } else if (leftAfterCycle >= 200 && rightAfterCycle >= 100) {
      isFirstPairMatch = true
      firstPairLeftDeduct = 200
      firstPairRightDeduct = 100
    }

    if (isFirstPairMatch) {
      // First pair pairing bonus is 10% of weaker side (100 BV), which is $10.
      firstPairBonus = 100 * ((plan.binaryPairingBonusPercent || 10) / 100)
      leftAfterCycle -= firstPairLeftDeduct
      rightAfterCycle -= firstPairRightDeduct
      
      // Save setting that first pair has been matched
      await db.setting.upsert({
        where: { key: firstPairSettingKey },
        update: { value: 'true' },
        create: { key: firstPairSettingKey, value: 'true' },
      })
    }
  }

  // Only allow standard pairing if first pair is matched (or matched in this run)
  if (hasMatchedFirstPair || isFirstPairMatch) {
    if (matchingType === 'weaker_leg') {
      matchedVolume = Math.min(leftAfterCycle, rightAfterCycle)
    } else if (matchingType === 'both_legs') {
      matchedVolume = leftAfterCycle + rightAfterCycle
    } else if (matchingType === 'stronger_leg') {
      matchedVolume = Math.max(leftAfterCycle, rightAfterCycle)
    }
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

  if (cycleBonus <= 0 && finalPairingBonus <= 0 && firstPairBonus <= 0) return

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
    const totalBonus = finalPairingBonus + cycleBonus + firstPairBonus

    await tx.user.update({
      where: { id: userId },
      data: {
        tradingBalance: { increment: totalBonus },
        totalEarnings: { increment: totalBonus },
        binaryTreeLeftVolumeCarryForward: newLeftCF,
        binaryTreeRightVolumeCarryForward: newRightCF,
      }
    })

    let currentBalance = user.tradingBalance

    if (firstPairBonus > 0) {
      await tx.earning.create({
        data: {
          userId,
          amount: firstPairBonus,
          type: 'binary_pairing_bonus',
          walletTarget: 'trading',
        }
      })

      await tx.transactionLog.create({
        data: {
          userId,
          type: 'bonus',
          amount: firstPairBonus,
          balanceBefore: currentBalance,
          balanceAfter: currentBalance + firstPairBonus,
          wallet: 'trading',
          description: `Binary MLM First Pair Bonus (1:2 or 2:1 ratio)`,
        }
      })

      await tx.notification.create({
        data: {
          userId,
          title: 'First Binary Pair Matched! 🚀',
          message: `Congratulations! You earned $${firstPairBonus.toFixed(2)} from matching your first binary pair.`,
          type: 'earning',
        }
      })

      currentBalance += firstPairBonus
    }

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
          balanceBefore: currentBalance,
          balanceAfter: currentBalance + finalPairingBonus,
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

      currentBalance += finalPairingBonus
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
          balanceBefore: currentBalance,
          balanceAfter: currentBalance + cycleBonus,
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
      firstPairBonus,
      flushBonus: typeof flushBonus !== 'undefined' ? flushBonus : 0,
      planId: plan.id,
      planName: plan.name,
      matchingType: plan.binaryMatchingType || 'weaker_leg',
      binaryCarryForward: plan.binaryCarryForward
    },
    null // System performed the action
  )
}
