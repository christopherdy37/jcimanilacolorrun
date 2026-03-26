/**
 * Fix a paid order that is stuck in PENDING.
 *
 * Usage: npx tsx scripts/fix-stuck-paid-order.ts <orderNumber> [--send-email]
 */

import { fixStuckPaidOrder } from '@/lib/fix-stuck-order'
import { prisma } from '@/lib/prisma'

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npx tsx scripts/fix-stuck-paid-order.ts <orderNumber> [--send-email]')
    process.exit(1)
  }

  const sendEmail = process.argv.includes('--send-email')

  const result = await fixStuckPaidOrder(input, {
    sendEmail,
    notesSuffix: 'fix-stuck-paid-order script',
  })

  if (!result.ok) {
    console.error(result.error)
    process.exit(1)
  }

  console.log(`Found order #${result.orderNumber} (${result.customerName})`)
  console.log(`  Tickets: ${result.ticketsAssigned} / ${result.needed}${result.insufficient ? ' (insufficient pool)' : ''}`)
  result.ticketPreview.forEach((line) => console.log(' ', line))
  console.log('  Google Sheets:', result.googleSheetsUpdated ? 'updated' : 'skipped/failed')
  if (sendEmail) {
    console.log('  Email:', result.emailSent ? 'sent' : result.emailError || 'skipped (no tickets)')
  } else {
    console.log('  Email: skipped (use --send-email)')
  }
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
