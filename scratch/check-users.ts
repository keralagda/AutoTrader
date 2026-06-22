import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      referredById: true,
      binaryTreeParentId: true,
      binaryTreeLeftChildId: true,
      binaryTreeRightChildId: true,
      binaryTreePosition: true,
      role: true,
    }
  })

  console.log('=== USERS IN DATABASE ===')
  console.dir(users, { depth: null })
  
  const settings = await prisma.setting.findMany()
  console.log('=== SETTINGS ===')
  console.dir(settings, { depth: null })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
