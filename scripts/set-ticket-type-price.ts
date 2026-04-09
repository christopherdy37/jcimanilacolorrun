/**
 * Update ticket type price in the connected database (set DATABASE_URL to production if needed).
 *
 * Examples:
 *   npx tsx scripts/set-ticket-type-price.ts
 *   npx tsx scripts/set-ticket-type-price.ts Premium 1500
 *
 * Railway: railway run npx tsx scripts/set-ticket-type-price.ts
 */

import { prisma } from '@/lib/prisma'

async function main() {
  const name = process.argv[2]?.trim() || 'Premium'
  const priceArg = process.argv[3]?.trim()
  const price = priceArg ? parseFloat(priceArg) : 1500

  if (Number.isNaN(price) || price <= 0) {
    console.error('Invalid price. Usage: npx tsx scripts/set-ticket-type-price.ts [TicketName] [price]')
    process.exit(1)
  }

  const updated = await prisma.ticketType.updateMany({
    where: { name },
    data: { price },
  })

  if (updated.count === 0) {
    const rows = await prisma.ticketType.findMany({ select: { name: true, price: true } })
    console.error(`No ticket type named "${name}". Current types:`, rows)
    process.exit(1)
  }

  const row = await prisma.ticketType.findUnique({ where: { name } })
  console.log(`Updated "${name}" → ₱${row!.price}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
