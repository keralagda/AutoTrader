import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Global background scheduler for profit distribution (runs every 5 minutes)
const globalForIntervals = globalThis as unknown as {
  profitInterval: any
}

if (!globalForIntervals.profitInterval) {
  const INTERVAL_TIME = 5 * 60 * 1000 // 5 minutes
  globalForIntervals.profitInterval = setInterval(async () => {
    try {
      const { runProfitDistribution } = await import('./profit-distributor')
      await runProfitDistribution()
    } catch (err) {
      console.error('Background profit distribution error:', err)
    }
  }, INTERVAL_TIME)
}