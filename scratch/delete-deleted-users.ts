import { db } from '../src/lib/db'

async function purgeDeletedUsers() {
  try {
    // Find all soft-deleted users
    const deletedUsers = await db.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'deleted_' } },
          { email: { contains: '@removed.local' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    console.log(`Starting purge of ${deletedUsers.length} soft-deleted users...`)

    for (const user of deletedUsers) {
      const userId = user.id
      console.log(`Purging user: ${user.name} (${user.email}) [ID: ${userId}]`)

      // Delete all related records in correct order to respect foreign key constraints
      await db.ticketReply.deleteMany({ where: { ticket: { userId } } })
      await db.supportTicket.deleteMany({ where: { userId } })
      await db.dailyCheckIn.deleteMany({ where: { userId } })
      await db.userBadge.deleteMany({ where: { userId } })
      await db.userChallenge.deleteMany({ where: { userId } })
      await db.loginHistory.deleteMany({ where: { userId } })
      await db.p2PTransfer.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } })
      await db.notification.deleteMany({ where: { userId } })
      await db.message.deleteMany({ where: { userId } })
      await db.profitDistribution.deleteMany({ where: { deposit: { userId } } })
      await db.earning.deleteMany({ where: { userId } })
      await db.transactionLog.deleteMany({ where: { userId } })
      await db.payment.deleteMany({ where: { userId } })
      await db.withdrawal.deleteMany({ where: { userId } })
      await db.deposit.deleteMany({ where: { userId } })
      await db.leaderboardEntry.deleteMany({ where: { userId } })
      await db.userStats.deleteMany({ where: { userId } })
      await db.kycVerification.deleteMany({ where: { userId } })
      await db.affiliateApplication.deleteMany({ where: { userId } })

      // Unlink referrals
      await db.user.updateMany({ where: { referredById: userId }, data: { referredById: null } })

      // Delete the user itself
      await db.user.delete({ where: { id: userId } })

      console.log(`Successfully purged user: ${userId}`)
    }

    console.log('Purge completed successfully!')
  } catch (error) {
    console.error('Error during purge:', error)
  } finally {
    process.exit(0)
  }
}

purgeDeletedUsers()
