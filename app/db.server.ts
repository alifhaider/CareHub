import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  transactionOptions: {
    timeout: 20000,
  }
})

async function main() {
  const allUsers = await prisma.user.findMany()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
