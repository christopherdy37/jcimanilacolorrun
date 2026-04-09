/**
 * Send a sample order confirmation for template preview (no database writes).
 * Usage: node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/send-sample-confirmation-email.ts you@example.com
 * (Load .env so SMTP/Brevo keys are set; plain `npx tsx` may skip sending if env is empty.)
 */

import { getEmailService } from '@/lib/email'

async function main() {
  const to = process.argv[2]?.trim()
  if (!to) {
    console.error('Usage: npx tsx scripts/send-sample-confirmation-email.ts <email>')
    process.exit(1)
  }

  await getEmailService().sendOrderConfirmation({
    orderNumber: 'JCI-SAMPLE-ORDER',
    customerName: 'Sample Runner',
    customerEmail: to,
    ticketType: 'Early Bird (sample)',
    quantity: 2,
    totalAmount: 999,
    tickets: [
      { ticketNumber: 'SAMPLE-0001', ticketCode: 'JCIxPM-SAMPLE01' },
      { ticketNumber: 'SAMPLE-0002', ticketCode: 'JCIxPM-SAMPLE02' },
    ],
    ticketAssignmentPending: false,
  })

  console.log('Sample confirmation sent to:', to)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
