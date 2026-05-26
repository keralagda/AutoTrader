import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default category settings
const DEFAULT_CATEGORIES = {
  low: { label: 'Low Risk (Conservative)', minPercent: 0.5, maxPercent: 2.0, description: 'Stable, lower returns' },
  medium: { label: 'Medium Risk (Balanced)', minPercent: 2.0, maxPercent: 5.0, description: 'Moderate risk and returns' },
  high: { label: 'High Risk (Aggressive)', minPercent: 5.0, maxPercent: 15.0, description: 'Higher risk, higher potential' },
}

// GET - Get risk category settings and user assignments
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    if (action === 'settings') {
      // Get category percentage settings
      const setting = await db.setting.findUnique({ where: { key: 'risk_categories' } })
      const categories = setting ? JSON.parse(setting.value) : DEFAULT_CATEGORIES
      return NextResponse.json(categories)
    }

    // Get all users with their risk categories
    const users = await db.user.findMany({
      where: { isFake: false, role: 'user' },
      select: {
        id: true,
        name: true,
        email: true,
        riskCategory: true,
        customWinMin: true,
        customWinMax: true,
        totalDeposited: true,
        totalEarnings: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const setting = await db.setting.findUnique({ where: { key: 'risk_categories' } })
    const categories = setting ? JSON.parse(setting.value) : DEFAULT_CATEGORIES

    // Count per category
    const counts = { low: 0, medium: 0, high: 0 }
    users.forEach(u => { counts[u.riskCategory as keyof typeof counts]++ })

    return NextResponse.json({ users, categories, counts })
  } catch (error) {
    console.error('Risk categories GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update category settings or assign user to category
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    // Update category percentage ranges
    if (body.categories) {
      await db.setting.upsert({
        where: { key: 'risk_categories' },
        update: { value: JSON.stringify(body.categories) },
        create: { key: 'risk_categories', value: JSON.stringify(body.categories) },
      })
      return NextResponse.json({ success: true })
    }

    // Assign user to category
    if (body.userId && body.riskCategory) {
      const validCategories = ['low', 'medium', 'high']
      if (!validCategories.includes(body.riskCategory)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }

      const updateData: any = { riskCategory: body.riskCategory }

      // Optional: set custom win percentages for this specific user
      if (body.customWinMin !== undefined) updateData.customWinMin = body.customWinMin
      if (body.customWinMax !== undefined) updateData.customWinMax = body.customWinMax

      await db.user.update({ where: { id: body.userId }, data: updateData })

      // Log activity
      await db.activityLog.create({
        data: {
          userId: body.userId,
          action: 'risk_category_changed',
          details: JSON.stringify({
            category: body.riskCategory,
            customWinMin: body.customWinMin,
            customWinMax: body.customWinMax,
          }),
        },
      })

      return NextResponse.json({ success: true })
    }

    // Bulk assign
    if (body.userIds && body.riskCategory) {
      await db.user.updateMany({
        where: { id: { in: body.userIds } },
        data: { riskCategory: body.riskCategory },
      })
      return NextResponse.json({ success: true, updated: body.userIds.length })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Risk categories PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
