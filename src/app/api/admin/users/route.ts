import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Single user detail view
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          deposits: {
            include: { plan: { select: { name: true, dailyEarningPercent: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          earnings: { orderBy: { createdAt: 'desc' }, take: 20 },
          withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 },
          referrals: { select: { id: true, name: true, email: true, totalDeposited: true } },
          _count: { select: { deposits: true, referrals: true, withdrawals: true } },
        },
      })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      
      const phoneVerifiedSetting = await db.setting.findUnique({
        where: { key: `phone_verified_${userId}` }
      })
      const isPhoneVerified = phoneVerifiedSetting?.value === 'true'

      return NextResponse.json({
        ...user,
        isPhoneVerified,
      })
    }

    // List all users (exclude fake profiles - they have their own management tab)
    // List all users (exclude fake profiles and soft-deleted users)
    const users = await db.user.findMany({
      where: {
        role: 'user',
        isFake: false,
        NOT: { email: { contains: '@removed.local' } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        tradingBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
        totalDeposited: true,
        isActive: true,
        isFake: true,
        isEmailVerified: true,
        createdAt: true,
        referredById: true,
        riskCategory: true,
        personalVolume: true,
        businessVolume: true,
        teamVolume: true,
        mlmRank: true,
        mlmLevel: true,
        _count: {
          select: {
            deposits: true,
            referrals: true,
            withdrawals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const phoneSettings = await db.setting.findMany({
      where: { key: { startsWith: 'phone_verified_' } }
    })
    const phoneMap = new Map<string, boolean>()
    phoneSettings.forEach(s => {
      const uId = s.key.replace('phone_verified_', '')
      phoneMap.set(uId, s.value === 'true')
    })

    const usersMapped = users.map(u => ({
      ...u,
      isPhoneVerified: phoneMap.get(u.id) || false
    }))

    return NextResponse.json(usersMapped)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, isActive, tradingBalance, withdrawalBalance, name, adjustBalance, amount, wallet, remarks, resetEarnings, editProfile, resetPassword, newPassword } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // ─── Edit user profile fields ───
    if (editProfile) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const updateData: any = {}
      if (editProfile.name !== undefined) updateData.name = editProfile.name
      if (editProfile.email !== undefined) updateData.email = editProfile.email
      if (editProfile.phone !== undefined) updateData.phone = editProfile.phone || null
      if (editProfile.walletAddress !== undefined) updateData.walletAddress = editProfile.walletAddress || null
      if (editProfile.riskCategory !== undefined) updateData.riskCategory = editProfile.riskCategory
      if (editProfile.customWinMin !== undefined) updateData.customWinMin = editProfile.customWinMin
      if (editProfile.customWinMax !== undefined) updateData.customWinMax = editProfile.customWinMax
      if (editProfile.referralCode !== undefined) updateData.referralCode = editProfile.referralCode
      if (editProfile.isActive !== undefined) updateData.isActive = editProfile.isActive
      if (editProfile.kycStatus !== undefined) updateData.kycStatus = editProfile.kycStatus
      if (editProfile.isEmailVerified !== undefined) updateData.isEmailVerified = editProfile.isEmailVerified

      const updated = await db.user.update({ where: { id: userId }, data: updateData })

      if (editProfile.isPhoneVerified !== undefined) {
        await db.setting.upsert({
          where: { key: `phone_verified_${userId}` },
          update: { value: editProfile.isPhoneVerified ? 'true' : 'false' },
          create: { key: `phone_verified_${userId}`, value: editProfile.isPhoneVerified ? 'true' : 'false' }
        })
      }

      await db.activityLog.create({
        data: { userId, action: 'admin_edit_profile', details: JSON.stringify({ fields: Object.keys(updateData), isPhoneVerified: editProfile.isPhoneVerified }) },
      })

      return NextResponse.json({ success: true, user: updated })
    }

    // ─── Reset password ───
    if (resetPassword) {
      const password = newPassword || 'Bnfx@2026'
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(password, 10)

      await db.user.update({ where: { id: userId }, data: { password: hashedPassword } })

      await db.activityLog.create({
        data: { userId, action: 'admin_reset_password', details: JSON.stringify({ resetAt: new Date().toISOString() }) },
      })

      await db.notification.create({
        data: { userId, title: 'Password Reset', message: 'Your password has been reset by admin. Please change it after logging in.', type: 'warning' },
      })

      return NextResponse.json({ success: true, message: `Password reset to: ${password}` })
    }

    // Reset earnings to zero
    if (resetEarnings) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      await db.user.update({
        where: { id: userId },
        data: { totalEarnings: 0, tradingBalance: 0, withdrawalBalance: 0 },
      })

      await db.activityLog.create({
        data: {
          userId,
          action: 'admin_reset_earnings',
          details: JSON.stringify({ previousEarnings: user.totalEarnings, previousTrading: user.tradingBalance, previousWithdrawal: user.withdrawalBalance }),
        },
      })

      await db.notification.create({
        data: { userId, title: 'Account Reset', message: 'Your earnings and balances have been reset by admin.', type: 'warning' },
      })

      return NextResponse.json({ success: true, message: 'Earnings reset to zero' })
    }

    // Handle balance adjustment with remarks and transaction logging
    if (adjustBalance) {
      const adjustAmount = parseFloat(amount)
      if (isNaN(adjustAmount) || adjustAmount === 0) {
        return NextResponse.json({ error: 'Valid amount required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const isVolumeAdjust = ['pv', 'bv', 'tv'].includes(wallet)
      let currentBalance = 0
      let targetWallet = wallet

      if (wallet === 'withdrawal') {
        currentBalance = user.withdrawalBalance
        targetWallet = 'withdrawal'
      } else if (wallet === 'pv') {
        currentBalance = user.personalVolume || 0
        targetWallet = 'pv'
      } else if (wallet === 'bv') {
        currentBalance = user.businessVolume || 0
        targetWallet = 'bv'
      } else if (wallet === 'tv') {
        currentBalance = user.teamVolume || 0
        targetWallet = 'tv'
      } else {
        currentBalance = user.tradingBalance
        targetWallet = 'trading'
      }

      // Check if subtracting more than available
      if (adjustAmount < 0 && currentBalance + adjustAmount < 0) {
        return NextResponse.json({
          error: isVolumeAdjust
            ? `Insufficient volume. Current: ${currentBalance.toFixed(2)}`
            : `Insufficient ${targetWallet} balance. Current: $${currentBalance.toFixed(2)}`
        }, { status: 400 })
      }

      const newBalance = currentBalance + adjustAmount

      // Update user balance or volume
      const updateData: any = {}
      if (targetWallet === 'withdrawal') {
        updateData.withdrawalBalance = newBalance
      } else if (targetWallet === 'pv') {
        updateData.personalVolume = newBalance
      } else if (targetWallet === 'bv') {
        updateData.businessVolume = newBalance
      } else if (targetWallet === 'tv') {
        updateData.teamVolume = newBalance
      } else {
        updateData.tradingBalance = newBalance
      }

      await db.user.update({ where: { id: userId }, data: updateData })

      // Create transaction log
      await db.transactionLog.create({
        data: {
          userId,
          type: adjustAmount > 0 ? 'bonus' : 'fee',
          amount: adjustAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          wallet: targetWallet,
          description: remarks || `Admin ${isVolumeAdjust ? 'volume' : 'balance'} ${adjustAmount > 0 ? 'addition' : 'deduction'}`,
          status: 'completed',
        },
      })

      // Log admin activity
      await db.activityLog.create({
        data: {
          userId,
          action: adjustAmount > 0
            ? (isVolumeAdjust ? 'admin_add_volume' : 'admin_add_balance')
            : (isVolumeAdjust ? 'admin_subtract_volume' : 'admin_subtract_balance'),
          details: JSON.stringify({
            amount: adjustAmount,
            wallet: targetWallet,
            remarks: remarks || '',
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
          }),
        },
      })

      // Send notification to user
      const formattedAmount = isVolumeAdjust
        ? `${adjustAmount.toFixed(2)} Vol`
        : `$${Math.abs(adjustAmount).toFixed(2)}`

      await db.notification.create({
        data: {
          userId,
          title: adjustAmount > 0
            ? (isVolumeAdjust ? 'Volume Credited' : 'Balance Credited')
            : (isVolumeAdjust ? 'Volume Adjusted' : 'Balance Adjusted'),
          message: adjustAmount > 0
            ? `${formattedAmount} has been added to your ${targetWallet.toUpperCase()} parameter. ${remarks ? `Reason: ${remarks}` : ''}`
            : `${formattedAmount} has been deducted from your ${targetWallet.toUpperCase()} parameter. ${remarks ? `Reason: ${remarks}` : ''}`,
          type: adjustAmount > 0 ? 'success' : 'warning',
        },
      })

      // Also trigger rank upgrade checks in case adding PV/BV/TV pushes them to a new rank
      if (isVolumeAdjust) {
        try {
          const activeDeposits = await db.deposit.findMany({
            where: { userId, status: { in: ['active', 'locked'] } },
            include: { plan: true }
          })
          let binaryPlan = activeDeposits.map(d => d.plan).find(p => p.isBinaryMlmEnabled)
          if (!binaryPlan) {
            binaryPlan = await db.plan.findFirst({
              where: { isBinaryMlmEnabled: true, isActive: true },
              orderBy: { sortOrder: 'asc' }
            })
          }
          if (binaryPlan) {
            const { checkMlmRankUpgrade } = await import('@/lib/binary-tree')
            await checkMlmRankUpgrade(userId, binaryPlan)
          }
        } catch (e) {
          console.error('Failed to trigger rank check after volume adjustment:', e)
        }
      }

      return NextResponse.json({ success: true, newBalance, wallet: targetWallet })
    }

    // Standard user update (toggle active, change name, etc.)
    const data: any = {}
    if (isActive !== undefined) data.isActive = isActive
    if (tradingBalance !== undefined) data.tradingBalance = tradingBalance
    if (withdrawalBalance !== undefined) data.withdrawalBalance = withdrawalBalance
    if (name !== undefined) data.name = name

    const user = await db.user.update({
      where: { id: userId },
      data,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE - Hard delete user and all their data
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin' || user.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 403 })
    }

    // Delete all related records (FK constraints)
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

    // Unlink referrals (set referredById to null for users referred by this user)
    await db.user.updateMany({ where: { referredById: userId }, data: { referredById: null } })

    // Delete the user
    await db.user.delete({ where: { id: userId } })

    // Log the deletion
    await db.activityLog.create({
      data: {
        action: 'admin_delete_user',
        details: JSON.stringify({ deletedEmail: user.email, deletedName: user.name, deletedAt: new Date().toISOString() }),
      },
    })

    return NextResponse.json({ success: true, message: 'User permanently deleted' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

// POST - Manually create a user with optional back-date and sponsor
export async function POST(request: Request) {
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

    const { name, email, password, referredById, createdAt } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const userRefCode = `AT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    const userCreationDate = createdAt ? new Date(createdAt) : new Date()

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        referralCode: userRefCode,
        referredById: referredById || null,
        isActive: true, // Directly activate admin-created users
        tradingBalance: 0,
        withdrawalBalance: 0,
        totalEarnings: 0,
        totalDeposited: 0,
        isEmailVerified: true, // Skip verification for admin-created users
        createdAt: userCreationDate,
      },
    })

    // Notify sponsor if referred (binary tree placement happens upon plan activation)
    if (referredById) {
      const referrer = await db.user.findUnique({ where: { id: referredById } })
      if (referrer) {
        await db.notification.create({
          data: {
            userId: referrer.id,
            title: 'New Referral! 🎉',
            message: `${user.name} joined using your referral link. They will be placed in your binary network upon plan activation.`,
            type: 'referral',
            createdAt: userCreationDate,
          },
        })
      }
    }

    // Log admin activity
    await db.activityLog.create({
      data: {
        action: 'admin_create_user',
        details: JSON.stringify({
          userId: user.id,
          email: user.email,
          createdAt: userCreationDate.toISOString(),
        }),
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

