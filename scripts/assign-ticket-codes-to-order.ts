/**
 * Assign ticket codes to an order that was manually marked as paid.
 * Use when you updated payment status to COMPLETED but ticket codes were never assigned.
 *
 * Usage: npx tsx scripts/assign-ticket-codes-to-order.ts <orderId-or-orderNumber>
 * Example: npx tsx scripts/assign-ticket-codes-to-order.ts clxyz123abc
 * Example: npx tsx scripts/assign-ticket-codes-to-order.ts JCI-MM474FZ7-L1UT
 */

import { prisma } from '@/lib/prisma'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'
import { getGoogleSheetsService } from '@/lib/google-sheets'

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npx tsx scripts/assign-ticket-codes-to-order.ts <orderId-or-orderNumber>')
    process.exit(1)
  }

  // Try by ID first, then by order number (e.g. JCI-MM474FZ7-L1UT)
  let order = await prisma.order.findUnique({
    where: { id: input },
    include: { ticketType: true, ticketCodes: true },
  })
  if (!order) {
    order = await prisma.order.findUnique({
      where: { orderNumber: input },
      include: { ticketType: true, ticketCodes: true },
    })
  }

  if (!order) {
    console.error('Order not found:', input)
    process.exit(1)
  }

  if (order.paymentStatus !== 'COMPLETED') {
    console.error('Order payment status is not COMPLETED. Current:', order.paymentStatus)
    process.exit(1)
  }

  const existingCount = order.ticketCodes.length
  let assignedTickets = order.ticketCodes.map((tc) => ({ ticketNumber: tc.ticketNumber, ticketCode: tc.ticketCode }))

  if (existingCount >= order.quantity) {
    console.log('Order already has enough ticket codes assigned:')
    assignedTickets.forEach((t) => console.log(`  ${t.ticketNumber} -> ${t.ticketCode}`))
    // Still update Google Sheets in case it was missing the ticket codes
    await logToGoogleSheets(order, assignedTickets)
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

  assignedTickets = result.assigned
  console.log('Assigned ticket codes:')
  assignedTickets.forEach((t) => console.log(`  ${t.ticketNumber} -> ${t.ticketCode}`))

  await logToGoogleSheets(order, assignedTickets)
  console.log('Done. You can now resend the confirmation email to the customer.')
}

async function logToGoogleSheets(
  order: { orderNumber: string; customerName: string; customerEmail: string; customerPhone: string; ticketType: { name: string }; quantity: number; totalAmount: number },
  tickets: Array<{ ticketNumber: string; ticketCode: string }>
) {
  try {
    await getGoogleSheetsService().logOrder({
      timestamp: new Date().toISOString(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      ticketType: order.ticketType.name,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      action: 'PAYMENT_COMPLETED',
      ticketNumbers: tickets.map((t) => t.ticketNumber).join('\n') || undefined,
      ticketCodes: tickets.map((t) => t.ticketCode).join('\n') || undefined,
      notes: 'Ticket codes assigned via script (order was manually marked paid)',
    })
    console.log('Google Sheets updated.')
  } catch (err) {
    console.warn('Could not update Google Sheets:', err)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
