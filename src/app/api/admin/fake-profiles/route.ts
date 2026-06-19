import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// International name pools by region
const NAMES_BY_REGION: Record<string, { male: string[]; female: string[]; lastNames: string[] }> = {
  'Middle East': {
    male: ['Mohammed', 'Ahmed', 'Ali', 'Omar', 'Khalid', 'Hassan', 'Ibrahim', 'Youssef', 'Faisal', 'Tariq', 'Saeed', 'Rashid', 'Hamad', 'Sultan', 'Nasser'],
    female: ['Fatima', 'Aisha', 'Maryam', 'Noura', 'Layla', 'Sara', 'Hana', 'Reem', 'Dana', 'Lina', 'Amira', 'Yasmin', 'Salma', 'Noor', 'Huda'],
    lastNames: ['Al-Rashid', 'Al-Maktoum', 'Al-Saud', 'Al-Thani', 'Al-Nahyan', 'Al-Sabah', 'Bin Zayed', 'Al-Falasi', 'Al-Mansouri', 'Al-Hashimi', 'Al-Qasimi', 'Al-Shamsi'],
  },
  'Europe': {
    male: ['James', 'Oliver', 'William', 'Lucas', 'Thomas', 'Alexander', 'Daniel', 'Sebastian', 'Maximilian', 'Felix', 'Hugo', 'Arthur', 'Leo', 'Oscar', 'Noah'],
    female: ['Emma', 'Olivia', 'Sophie', 'Isabella', 'Charlotte', 'Amelia', 'Mia', 'Elena', 'Clara', 'Victoria', 'Alice', 'Julia', 'Anna', 'Marie', 'Lena'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Mueller', 'Schmidt', 'Fischer', 'Weber', 'Dubois', 'Martin', 'Bernard', 'Rossi'],
  },
  'Americas': {
    male: ['Liam', 'Ethan', 'Mason', 'Logan', 'Jackson', 'Mateo', 'Santiago', 'Diego', 'Carlos', 'Miguel', 'Rafael', 'Gabriel', 'Andre', 'Marcus', 'Tyler'],
    female: ['Sophia', 'Ava', 'Luna', 'Camila', 'Valentina', 'Gabriela', 'Mariana', 'Isabella', 'Nicole', 'Ashley', 'Brianna', 'Madison', 'Taylor', 'Aaliyah', 'Jade'],
    lastNames: ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Hernandez', 'Davis', 'Miller', 'Moore', 'Jackson', 'White', 'Harris', 'Thompson', 'Clark', 'Lewis', 'Walker'],
  },
  'Africa': {
    male: ['Kwame', 'Chidi', 'Amara', 'Kofi', 'Tendai', 'Oluwaseun', 'Emeka', 'Jabari', 'Mandla', 'Thabo', 'Sipho', 'Adebayo', 'Chibueze', 'Nnamdi', 'Obinna'],
    female: ['Amina', 'Zainab', 'Chioma', 'Adaeze', 'Ngozi', 'Thandiwe', 'Naledi', 'Aisha', 'Fatou', 'Nneka', 'Oluchi', 'Blessing', 'Grace', 'Precious', 'Favour'],
    lastNames: ['Okafor', 'Adeyemi', 'Mensah', 'Nkosi', 'Dlamini', 'Osei', 'Kamau', 'Mwangi', 'Banda', 'Moyo', 'Diallo', 'Toure', 'Traore', 'Kone', 'Sow'],
  },
  'South Asia': {
    male: ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Krishna', 'Ishaan', 'Dhruv', 'Kabir', 'Rohan', 'Arnav', 'Rahul', 'Vikram', 'Karan', 'Yash', 'Siddharth'],
    female: ['Aadhya', 'Diya', 'Saanvi', 'Ananya', 'Isha', 'Kiara', 'Riya', 'Meera', 'Priya', 'Shreya', 'Neha', 'Divya', 'Anjali', 'Sakshi', 'Aishwarya'],
    lastNames: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Shah', 'Mehta', 'Joshi', 'Rao', 'Pillai', 'Chopra', 'Malhotra', 'Kapoor'],
  },
  'East Asia': {
    male: ['Wei', 'Hiroshi', 'Joon', 'Takeshi', 'Min-jun', 'Yuki', 'Kenji', 'Ryu', 'Hao', 'Jun', 'Tao', 'Kai', 'Ren', 'Shin', 'Akira'],
    female: ['Yuki', 'Sakura', 'Mei', 'Hana', 'Soo-jin', 'Aiko', 'Ling', 'Xia', 'Yuna', 'Mina', 'Haruka', 'Nanami', 'Jia', 'Zhi', 'Emi'],
    lastNames: ['Wang', 'Li', 'Zhang', 'Chen', 'Tanaka', 'Suzuki', 'Kim', 'Park', 'Lee', 'Nguyen', 'Tran', 'Yamamoto', 'Sato', 'Watanabe', 'Nakamura'],
  },
  'Southeast Asia': {
    male: ['Arif', 'Rizky', 'Budi', 'Dimas', 'Fajar', 'Gilang', 'Hendra', 'Irfan', 'Joko', 'Rafi', 'Surya', 'Wira', 'Andi', 'Bayu', 'Cahya'],
    female: ['Siti', 'Dewi', 'Putri', 'Ayu', 'Bunga', 'Citra', 'Dian', 'Eka', 'Fitri', 'Indah', 'Kartika', 'Lestari', 'Maya', 'Nadia', 'Ratna'],
    lastNames: ['Wijaya', 'Susanto', 'Pratama', 'Hidayat', 'Santoso', 'Kurniawan', 'Saputra', 'Nugroho', 'Wibowo', 'Setiawan', 'Putra', 'Utama', 'Rahman', 'Hakim', 'Siregar'],
  },
}

const ALL_REGIONS = Object.keys(NAMES_BY_REGION)

function generateName(region?: string): { name: string; gender: 'male' | 'female'; region: string } {
  const selectedRegion = region || ALL_REGIONS[Math.floor(Math.random() * ALL_REGIONS.length)]
  const pool = NAMES_BY_REGION[selectedRegion] || NAMES_BY_REGION['Europe']
  const gender = Math.random() > 0.5 ? 'male' : 'female'
  const firstNames = gender === 'male' ? pool.male : pool.female
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = pool.lastNames[Math.floor(Math.random() * pool.lastNames.length)]
  return { name: `${firstName} ${lastName}`, gender, region: selectedRegion }
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'icloud.com']
  const clean = name.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.')
  const num = Math.floor(Math.random() * 999)
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${clean}${num}@${domain}`
}

function generatePhone(region: string): string {
  const codes: Record<string, string> = {
    'Middle East': '+971', 'Europe': '+44', 'Americas': '+1', 'Africa': '+234',
    'South Asia': '+91', 'East Asia': '+86', 'Southeast Asia': '+62',
  }
  const code = codes[region] || '+1'
  const num = Math.floor(Math.random() * 9000000000 + 1000000000)
  return `${code} ${num}`
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'FK'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function generateAvatar(gender: string, region: string): string {
  const maleEmojis: Record<string, string[]> = {
    'Middle East': ['👨🏽', '👨🏾'], 'Europe': ['👨🏻', '👨🏼'], 'Americas': ['👨🏽', '👨🏻', '👨🏿'],
    'Africa': ['👨🏿', '👨🏾'], 'South Asia': ['👨🏽', '👨🏾'], 'East Asia': ['👨🏻', '👨🏼'], 'Southeast Asia': ['👨🏽', '👨🏼'],
  }
  const femaleEmojis: Record<string, string[]> = {
    'Middle East': ['👩🏽', '👩🏾'], 'Europe': ['👩🏻', '👩🏼'], 'Americas': ['👩🏽', '👩🏻', '👩🏿'],
    'Africa': ['👩🏿', '👩🏾'], 'South Asia': ['👩🏽', '👩🏾'], 'East Asia': ['👩🏻', '👩🏼'], 'Southeast Asia': ['👩🏽', '👩🏼'],
  }
  const pool = gender === 'male' ? (maleEmojis[region] || ['👨']) : (femaleEmojis[region] || ['👩'])
  return pool[Math.floor(Math.random() * pool.length)]
}

// GET - List all fake profiles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const typeFilter = searchParams.get('type') || 'all' // 'all' | 'standard' | 'binary'

    let whereClause: any = { isFake: true }

    if (typeFilter === 'standard') {
      whereClause.binaryTreePosition = ''
      whereClause.binaryTreeParentId = null
    } else if (typeFilter === 'binary') {
      whereClause.OR = [
        { binaryTreePosition: { not: '' } },
        { binaryTreeParentId: { not: null } }
      ]
    }

    const [profiles, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          fakeAvatar: true,
          tradingBalance: true,
          withdrawalBalance: true,
          totalEarnings: true,
          totalDeposited: true,
          isActive: true,
          createdAt: true,
          binaryTreePosition: true,
          binaryTreeParentId: true,
          personalVolume: true,
          businessVolume: true,
          teamVolume: true,
          mlmRank: true,
          mlmLevel: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
    ])

    const processedProfiles = profiles.map(p => {
      const isBinary = p.binaryTreePosition !== '' || p.binaryTreeParentId !== null || p.personalVolume > 0 || p.teamVolume > 0
      return {
        ...p,
        isBinary
      }
    })

    return NextResponse.json({ profiles: processedProfiles, total, page, limit })
  } catch (error) {
    console.error('Get fake profiles error:', error)
    return NextResponse.json({ error: 'Failed to get fake profiles' }, { status: 500 })
  }
}

// POST - Mass generate fake profiles
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      count,
      minBalance,
      maxBalance,
      minEarnings,
      maxEarnings,
      minDeposited,
      maxDeposited,
      region,
      profileType = 'standard', // 'standard' or 'binary'
      binaryPlanId,
      binaryPlacementStrategy,
      binaryActivateDeposit,
      binaryDepositAmount,
    } = body

    // Fetch settings for Binary MLM fake profiles
    const settings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => { settingsMap[s.key] = s.value })

    const isBinaryType = profileType === 'binary'

    // Resolve binary plan ID
    let activePlanId = binaryPlanId
    if (isBinaryType && !activePlanId) {
      activePlanId = settingsMap['binaryMlmFakeProfilesPlanId']
      if (!activePlanId) {
        const fallbackPlan = await db.plan.findFirst({ where: { isBinaryMlmEnabled: true, isActive: true } })
        activePlanId = fallbackPlan?.id
      }
    }

    const placementStrategy = binaryPlacementStrategy || settingsMap['binaryMlmFakeProfilesPlacementStrategy'] || 'balanced'
    const activateDeposit = binaryActivateDeposit !== undefined ? binaryActivateDeposit : (settingsMap['binaryMlmFakeProfilesActivateDeposit'] === 'true')
    const depositAmount = binaryDepositAmount !== undefined ? parseFloat(binaryDepositAmount) : parseFloat(settingsMap['binaryMlmFakeProfilesDepositAmount'] || '100')

    const numProfiles = Math.min(Math.max(count || 10, 1), 500)
    const balMin = minBalance || 100
    const balMax = maxBalance || 50000
    const earnMin = minEarnings || 50
    const earnMax = maxEarnings || 25000
    const depMin = minDeposited || 100
    const depMax = maxDeposited || 100000

    const created: any[] = []
    const batchUsers: Array<{id: string, name: string}> = []

    for (let i = 0; i < numProfiles; i++) {
      const { name, gender, region: selectedRegion } = generateName(region || undefined)
      const email = generateEmail(name)
      const phone = generatePhone(selectedRegion)
      const avatar = generateAvatar(gender, selectedRegion)

      let referralCode = generateReferralCode()
      let attempts = 0
      while (attempts < 10) {
        const existing = await db.user.findUnique({ where: { referralCode } })
        if (!existing) break
        referralCode = generateReferralCode()
        attempts++
      }

      const existingEmail = await db.user.findUnique({ where: { email } })
      if (existingEmail) continue

      const tradingBalance = balMin + Math.random() * (balMax - balMin)
      const withdrawalBalance = Math.random() * tradingBalance * 0.3
      const totalEarnings = earnMin + Math.random() * (earnMax - earnMin)
      const totalDeposited = depMin + Math.random() * (depMax - depMin)

      // Prepare user data
      const userData: any = {
        email,
        name,
        phone,
        role: 'user',
        referralCode,
        tradingBalance: Math.round(tradingBalance * 100) / 100,
        withdrawalBalance: Math.round(withdrawalBalance * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalDeposited: Math.round(totalDeposited * 100) / 100,
        isActive: true,
        isFake: true,
        fakeAvatar: avatar,
      }

      // If Binary MLM is enabled for fake profiles, set up binary tree fields
      if (isBinaryType && activePlanId) {
        // Initialize binary tree fields
        userData.binaryTreePosition = ''
        userData.binaryTreeLeftVolume = 0
        userData.binaryTreeRightVolume = 0
        userData.binaryTreeLeftVolumeCarryForward = 0
        userData.binaryTreeRightVolumeCarryForward = 0
      }

      const user = await db.user.create({
        data: userData,
      })

      // If Binary MLM is enabled, set up binary tree relationships
      if (isBinaryType && activePlanId) {
        let parentId: string | null = null
        let position: 'left' | 'right' = 'left'

        // Determine placement based on strategy
        if (placementStrategy === 'balanced') {
          position = i % 2 === 0 ? 'left' : 'right'
          parentId = batchUsers.length > 0 ? batchUsers[0].id : null
        } else if (placementStrategy === 'left') {
          position = 'left'
          parentId = batchUsers.length > 0 ? batchUsers[0].id : null
        } else if (placementStrategy === 'right') {
          position = 'right'
          parentId = batchUsers.length > 0 ? batchUsers[0].id : null
        } else if (placementStrategy === 'random') {
          position = Math.random() > 0.5 ? 'left' : 'right'
          parentId = batchUsers.length > 0 ? batchUsers[Math.floor(Math.random() * batchUsers.length)].id : null
        } else {
          position = i % 2 === 0 ? 'left' : 'right'
          parentId = batchUsers.length > 0 ? batchUsers[0].id : null
        }

        // Update the user with binary tree parent and position
        await db.user.update({
          where: { id: user.id },
          data: {
            binaryTreeParentId: parentId,
            binaryTreePosition: position,
            ...(parentId && {
              [position === 'left' ? 'binaryTreeLeftChildId' : 'binaryTreeRightChildId']: user.id
            })
          }
        })

        // Create deposit to activate binary MLM participation if enabled
        if (activateDeposit && depositAmount > 0) {
          await db.deposit.create({
            data: {
              userId: user.id,
              planId: activePlanId,
              amount: depositAmount,
              status: 'active',
            }
          })

          await db.user.update({
            where: { id: user.id },
            data: {
              totalDeposited: depositAmount
            }
          })
        }
      }

      batchUsers.push({id: user.id, name: name})
      created.push(user)
    }

    return NextResponse.json({
      message: `${created.length} fake profiles generated`,
      count: created.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Generate fake profiles error:', error)
    return NextResponse.json({ error: 'Failed to generate fake profiles' }, { status: 500 })
  }
}

// PUT - Update a fake profile
export async function PUT(request: Request) {
  try {
    const {
      id,
      name,
      email,
      phone,
      tradingBalance,
      withdrawalBalance,
      totalEarnings,
      totalDeposited,
      isActive,
      referredById,
      binaryTreeParentId,
      binaryTreePositionLeg, // 'left' | 'right' | null
    } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    }

    const profile = await db.user.findUnique({ where: { id } })
    if (!profile || !profile.isFake) {
      return NextResponse.json({ error: 'Fake profile not found' }, { status: 404 })
    }

    let finalBinaryTreeParentId = undefined
    let finalBinaryTreePosition = undefined

    if (binaryTreeParentId !== undefined) {
      if (binaryTreeParentId === null) {
        finalBinaryTreeParentId = null
        finalBinaryTreePosition = ""

        if (profile.binaryTreeParentId) {
          const oldParent = await db.user.findUnique({ where: { id: profile.binaryTreeParentId } })
          if (oldParent) {
            if (oldParent.binaryTreeLeftChildId === id) {
              await db.user.update({ where: { id: oldParent.id }, data: { binaryTreeLeftChildId: null } })
            } else if (oldParent.binaryTreeRightChildId === id) {
              await db.user.update({ where: { id: oldParent.id }, data: { binaryTreeRightChildId: null } })
            }
          }
        }
      } else {
        const parentUser = await db.user.findUnique({ where: { id: binaryTreeParentId } })
        if (parentUser) {
          finalBinaryTreeParentId = binaryTreeParentId
          finalBinaryTreePosition = (parentUser.binaryTreePosition || "") + (binaryTreePositionLeg === "right" ? "R" : "L")

          if (profile.binaryTreeParentId && profile.binaryTreeParentId !== binaryTreeParentId) {
            const oldParent = await db.user.findUnique({ where: { id: profile.binaryTreeParentId } })
            if (oldParent) {
              if (oldParent.binaryTreeLeftChildId === id) {
                await db.user.update({ where: { id: oldParent.id }, data: { binaryTreeLeftChildId: null } })
              } else if (oldParent.binaryTreeRightChildId === id) {
                await db.user.update({ where: { id: oldParent.id }, data: { binaryTreeRightChildId: null } })
              }
            }
          }

          if (binaryTreePositionLeg === "right") {
            await db.user.update({ where: { id: binaryTreeParentId }, data: { binaryTreeRightChildId: id } })
          } else {
            await db.user.update({ where: { id: binaryTreeParentId }, data: { binaryTreeLeftChildId: id } })
          }
        }
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(tradingBalance !== undefined && { tradingBalance }),
        ...(withdrawalBalance !== undefined && { withdrawalBalance }),
        ...(totalEarnings !== undefined && { totalEarnings }),
        ...(totalDeposited !== undefined && { totalDeposited }),
        ...(isActive !== undefined && { isActive }),
        ...(referredById !== undefined && { referredById }),
        ...(finalBinaryTreeParentId !== undefined && { binaryTreeParentId: finalBinaryTreeParentId }),
        ...(finalBinaryTreePosition !== undefined && { binaryTreePosition: finalBinaryTreePosition }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update fake profile error:', error)
    return NextResponse.json({ error: 'Failed to update fake profile' }, { status: 500 })
  }
}

// DELETE - Delete fake profiles (single or bulk)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const deleteAll = searchParams.get('all')

    if (deleteAll === 'true') {
      const result = await db.user.deleteMany({ where: { isFake: true } })
      return NextResponse.json({ message: `${result.count} fake profiles deleted`, count: result.count })
    }

    if (!id) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    }

    const profile = await db.user.findUnique({ where: { id } })
    if (!profile || !profile.isFake) {
      return NextResponse.json({ error: 'Fake profile not found' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete fake profile error:', error)
    return NextResponse.json({ error: 'Failed to delete fake profile' }, { status: 500 })
  }
}
