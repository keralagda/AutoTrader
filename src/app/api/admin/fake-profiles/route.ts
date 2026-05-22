import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Indian first names (male & female)
const INDIAN_FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith',
  'Dhruv', 'Kabir', 'Ritvik', 'Aarush', 'Kayaan', 'Darsh', 'Veer', 'Sahil',
  'Rohan', 'Arnav', 'Laksh', 'Daksh', 'Rishi', 'Ansh', 'Nikhil',
  'Rahul', 'Amit', 'Vikram', 'Suresh', 'Rajesh', 'Deepak', 'Manish',
  'Karan', 'Gaurav', 'Harsh', 'Yash', 'Prateek', 'Akash', 'Varun',
  'Siddharth', 'Kunal', 'Mohit', 'Neeraj', 'Pankaj', 'Tushar',
]

const INDIAN_FIRST_NAMES_FEMALE = [
  'Aadhya', 'Diya', 'Saanvi', 'Ananya', 'Isha', 'Aanya', 'Pari', 'Myra',
  'Sara', 'Anika', 'Navya', 'Kiara', 'Avni', 'Prisha', 'Riya', 'Aarohi',
  'Anvi', 'Kavya', 'Siya', 'Tara', 'Meera', 'Zara', 'Nisha', 'Pooja',
  'Shreya', 'Neha', 'Priya', 'Divya', 'Anjali', 'Swati', 'Komal',
  'Sneha', 'Tanvi', 'Pallavi', 'Ritika', 'Simran', 'Aishwarya', 'Deepika',
  'Sakshi', 'Nikita', 'Megha', 'Jyoti', 'Kriti', 'Bhavna', 'Rashmi',
]

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair',
  'Joshi', 'Mehta', 'Shah', 'Iyer', 'Rao', 'Pillai', 'Menon', 'Chopra',
  'Malhotra', 'Kapoor', 'Bhatia', 'Agarwal', 'Mishra', 'Pandey', 'Tiwari',
  'Chauhan', 'Yadav', 'Thakur', 'Saxena', 'Srivastava', 'Banerjee', 'Mukherjee',
  'Das', 'Ghosh', 'Bose', 'Sen', 'Dutta', 'Chatterjee', 'Roy', 'Patil',
  'Deshmukh', 'Kulkarni', 'Jain', 'Goyal', 'Mittal', 'Arora', 'Khanna',
  'Sethi', 'Bajaj', 'Dhawan', 'Gill', 'Kaur',
]

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Surat', 'Chandigarh', 'Indore', 'Nagpur',
  'Kochi', 'Coimbatore', 'Vadodara', 'Bhopal', 'Noida', 'Gurgaon',
]

function generateIndianName(): { name: string; gender: 'male' | 'female' } {
  const gender = Math.random() > 0.5 ? 'male' : 'female'
  const firstNames = gender === 'male' ? INDIAN_FIRST_NAMES_MALE : INDIAN_FIRST_NAMES_FEMALE
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)]
  return { name: `${firstName} ${lastName}`, gender }
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'rediffmail.com']
  const clean = name.toLowerCase().replace(/\s+/g, '.')
  const num = Math.floor(Math.random() * 999)
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${clean}${num}@${domain}`
}

function generatePhone(): string {
  const prefixes = ['91', '92', '93', '94', '95', '96', '97', '98', '99', '70', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const rest = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return `+91 ${prefix}${rest}`
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'FK'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateAvatar(name: string, gender: string): string {
  // Return initials-based avatar identifier with skin tone
  const skinTones = ['🏽', '🏾', '🏻', '🏼']
  const tone = skinTones[Math.floor(Math.random() * skinTones.length)]
  const emoji = gender === 'male' ? `👨${tone}` : `👩${tone}`
  return emoji
}

// GET - List all fake profiles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [profiles, total] = await Promise.all([
      db.user.findMany({
        where: { isFake: true },
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where: { isFake: true } }),
    ])

    return NextResponse.json({ profiles, total, page, limit })
  } catch (error) {
    console.error('Get fake profiles error:', error)
    return NextResponse.json({ error: 'Failed to get fake profiles' }, { status: 500 })
  }
}

// POST - Mass generate fake profiles
export async function POST(request: Request) {
  try {
    const { count, minBalance, maxBalance, minEarnings, maxEarnings, minDeposited, maxDeposited } = await request.json()

    const numProfiles = Math.min(Math.max(count || 10, 1), 500) // 1-500 at a time
    const balMin = minBalance || 100
    const balMax = maxBalance || 50000
    const earnMin = minEarnings || 50
    const earnMax = maxEarnings || 25000
    const depMin = minDeposited || 100
    const depMax = maxDeposited || 100000

    const created: any[] = []

    for (let i = 0; i < numProfiles; i++) {
      const { name, gender } = generateIndianName()
      const email = generateEmail(name)
      const phone = generatePhone()
      const avatar = generateAvatar(name, gender)

      // Generate unique referral code
      let referralCode = generateReferralCode()
      let attempts = 0
      while (attempts < 10) {
        const existing = await db.user.findUnique({ where: { referralCode } })
        if (!existing) break
        referralCode = generateReferralCode()
        attempts++
      }

      // Check email uniqueness
      const existingEmail = await db.user.findUnique({ where: { email } })
      if (existingEmail) continue // Skip duplicates

      const tradingBalance = balMin + Math.random() * (balMax - balMin)
      const withdrawalBalance = Math.random() * tradingBalance * 0.3
      const totalEarnings = earnMin + Math.random() * (earnMax - earnMin)
      const totalDeposited = depMin + Math.random() * (depMax - depMin)

      const user = await db.user.create({
        data: {
          email,
          name,
          password: 'fake_' + Math.random().toString(36).slice(2), // Random unusable password
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
        },
      })

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
    const { id, name, email, phone, tradingBalance, withdrawalBalance, totalEarnings, totalDeposited, isActive } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    }

    const profile = await db.user.findUnique({ where: { id } })
    if (!profile || !profile.isFake) {
      return NextResponse.json({ error: 'Fake profile not found' }, { status: 404 })
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
