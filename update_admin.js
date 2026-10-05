const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'DuylniEdu' }
  })
  
  if (user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' }
    })
    console.log("Updated user to admin:", updated)
  } else {
    console.log("User not found!")
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
