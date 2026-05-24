import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Find duplicate wallet addresses
    const users = await db.user.findMany({
      where: { isFake: false },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        phone: true,
        isActive: true,
        createdAt: true,
        kycStatus: true,
      },
    })

    // Find duplicate KYC documents
    const kycRecords = await db.kycVerification.findMany({
      select: {
        id: true,
        userId: true,
        documentType: true,
        documentNumber: true,
        status: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Find duplicate login IPs
    const loginHistory = await db.loginHistory.findMany({
      select: { userId: true, ipAddress: true },
      distinct: ['userId', 'ipAddress'],
    })

    // --- Detect duplicates ---

    // 1. Duplicate wallet addresses
    const walletMap: Record<string, typeof users> = {}
    users.forEach(u => {
      if (u.walletAddress && u.walletAddress.length > 5) {
        const addr = u.walletAddress.toLowerCase()
        if (!walletMap[addr]) walletMap[addr] = []
        walletMap[addr].push(u)
      }
    })
    const duplicateWallets = Object.entries(walletMap)
      .filter(([_, users]) => users.length > 1)
      .map(([address, users]) => ({ address, users, count: users.length }))

    // 2. Duplicate KYC document numbers
    const kycMap: Record<string, typeof kycRecords> = {}
    kycRecords.forEach(k => {
      if (k.documentNumber) {
        const key = `${k.documentType}:${k.documentNumber.toLowerCase()}`
        if (!kycMap[key]) kycMap[key] = []
        kycMap[key].push(k)
      }
    })
    const duplicateKYC = Object.entries(kycMap)
      .filter(([_, records]) => records.length > 1)
      .map(([key, records]) => {
        const [docType, docNumber] = key.split(':')
        return { documentType: docType, documentNumber: docNumber, records, count: records.length }
      })

    // 3. Duplicate phone numbers
    const phoneMap: Record<string, typeof users> = {}
    users.forEach(u => {
      if (u.phone && u.phone.length > 5) {
        const phone = u.phone.replace(/\s+/g, '')
        if (!phoneMap[phone]) phoneMap[phone] = []
        phoneMap[phone].push(u)
      }
    })
    const duplicatePhones = Object.entries(phoneMap)
      .filter(([_, users]) => users.length > 1)
      .map(([phone, users]) => ({ phone, users, count: users.length }))

    // 4. Duplicate IPs (users sharing same IP)
    const ipMap: Record<string, Set<string>> = {}
    loginHistory.forEach(l => {
      if (l.ipAddress && l.ipAddress !== 'unknown') {
        if (!ipMap[l.ipAddress]) ipMap[l.ipAddress] = new Set()
        ipMap[l.ipAddress].add(l.userId)
      }
    })
    const duplicateIPs = Object.entries(ipMap)
      .filter(([_, userIds]) => userIds.size > 1)
      .map(([ip, userIds]) => ({
        ip,
        userIds: Array.from(userIds),
        users: users.filter(u => userIds.has(u.id)),
        count: userIds.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return NextResponse.json({
      summary: {
        totalUsers: users.length,
        duplicateWallets: duplicateWallets.length,
        duplicateKYC: duplicateKYC.length,
        duplicatePhones: duplicatePhones.length,
        duplicateIPs: duplicateIPs.length,
        totalFlags: duplicateWallets.length + duplicateKYC.length + duplicatePhones.length + duplicateIPs.length,
      },
      duplicateWallets,
      duplicateKYC,
      duplicatePhones,
      duplicateIPs,
    })
  } catch (error) {
    console.error('Duplicates check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
