/**
 * Resend confirmation email for a paid order (by order number or id).
 * Usage: npx tsx scripts/resend-order-email.ts JCI-MNDRJ43M-IMJR
 */

import { prisma } from '@/lib/prisma'
import { getEmailService } from '@/lib/email'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'

async function main() {
  const input = process.argv[2]?.trim()
  if (!input) {
    console.error('Usage: npx tsx scripts/resend-order-email.ts <orderNumber-or-id>')
    process.exit(1)
  }

  const order = await prisma.order.findFirst({
    where: { OR: [{ orderNumber: input }, { id: input }] },
    include: {
      ticketType: true,
      ticketCodes: {
        orderBy: { assignedAt: 'asc' },
        select: { ticketNumber: true, ticketCode: true },
      },
    },
  })

  if (!order) {
    console.error('Order not found:', input)
    process.exit(1)
  }

  if (order.paymentStatus !== 'COMPLETED') {
    console.error('Order is not paid (COMPLETED). Current:', order.paymentStatus)
    process.exit(1)
  }

  let assignedTickets = order.ticketCodes.map((tc) => ({
    ticketNumber: tc.ticketNumber,
    ticketCode: tc.ticketCode,
  }))
  let ticketAssignmentPending = false

  if (assignedTickets.length < order.quantity) {
    try {
      const result = await assignTicketCodesToOrder({
        orderId: order.id,
        quantity: order.quantity,
      })
      assignedTickets = result.assigned
      ticketAssignmentPending = result.insufficient
    } catch (err) {
      console.error('Assign codes failed:', err)
      ticketAssignmentPending = true
    }
  }

  await getEmailService().sendOrderConfirmation({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    ticketType: order.ticketType.name,
    quantity: order.quantity,
    totalAmount: order.totalAmount,
    tickets: assignedTickets.length ? assignedTickets : undefined,
    ticketAssignmentPending,
  })

  console.log('Email sent to:', order.customerEmail)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
