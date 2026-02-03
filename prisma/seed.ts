import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@jcimanilacolorrun.com'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      name: 'Admin User',
    },
  })

  console.log('Created admin user:', admin.email)

  // Create ticket types
  const ticketTypes = [
    {
      name: 'Premium',
      description: 'Premium ticket for the JCI Manila Color Run - includes all event benefits',
      price: 1500.0,
      maxQuantity: null,
      isActive: true,
    },
  ]

  for (const ticketType of ticketTypes) {
    const created = await prisma.ticketType.upsert({
      where: { name: ticketType.name },
      update: ticketType,
      create: ticketType,
    })
    console.log('Created ticket type:', created.name)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

