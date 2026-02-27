/**
 * Assign ticket codes to an order that was manually marked as paid.
 * Use when you updated payment status to COMPLETED but ticket codes were never assigned.
 *
 * Usage: npx tsx scripts/assign-ticket-codes-to-order.ts <orderId>
 * Example: npx tsx scripts/assign-ticket-codes-to-order.ts clxyz123abc
 */

import { prisma } from '@/lib/prisma'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'

async function main() {
  const orderId = process.argv[2]
  if (!orderId) {
    console.error('Usage: npx tsx scripts/assign-ticket-codes-to-order.ts <orderId>')
    process.exit(1)
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { ticketType: true, ticketCodes: true },
  })

  if (!order) {
    console.error('Order not found:', orderId)
    process.exit(1)
  }

  if (order.paymentStatus !== 'COMPLETED') {
    console.error('Order payment status is not COMPLETED. Current:', order.paymentStatus)
    process.exit(1)
  }

  const existingCount = order.ticketCodes.length
  if (existingCount >= order.quantity) {
    console.log('Order already has enough ticket codes assigned:')
    order.ticketCodes.forEach((tc) => console.log(`  ${tc.ticketNumber} -> ${tc.ticketCode}`))
    return
  }

  console.log(`Order #${order.orderNumber}: assigning ${order.quantity - existingCount} more ticket code(s)...`)

  const result = await assignTicketCodesToOrder({
    orderId: order.id,
    quantity: order.quantity,
  })

  if (result.insufficient) {
    console.warn(
      'Warning: Not enough unassigned ticket codes in the pool. Assigned',
      result.assigned.length,
      'of',
      order.quantity
    )
  }

  if (result.assigned.length === 0) {
    console.error(
      'No ticket codes could be assigned. Ensure you have unassigned codes in the ticket_codes table.'
    )
    console.error('Run tickets:import to import codes from Google Sheets, or add them manually.')
    process.exit(1)
  }

  console.log('Assigned ticket codes:')
  result.assigned.forEach((t) => console.log(`  ${t.ticketNumber} -> ${t.ticketCode}`))
  console.log('Done. You can now resend the confirmation email to the customer.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
