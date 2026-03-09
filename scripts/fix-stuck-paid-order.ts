/**
 * Fix a paid order that is stuck in PENDING.
 * Marks the order as COMPLETED, assigns ticket codes, updates Google Sheets,
 * and optionally sends the confirmation email.
 *
 * Usage: npx tsx scripts/fix-stuck-paid-order.ts <orderNumber>
 * Example: npx tsx scripts/fix-stuck-paid-order.ts JCI-MMITW0LP-EDXS
 */

import { prisma } from '@/lib/prisma'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'
import { getGoogleSheetsService } from '@/lib/google-sheets'
import { getEmailService } from '@/lib/email'

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npx tsx scripts/fix-stuck-paid-order.ts <orderNumber>')
    process.exit(1)
  }

  let order = await prisma.order.findFirst({
    where: {
      OR: [{ id: input }, { orderNumber: input }],
    },
    include: { ticketType: true, ticketCodes: true, paymentTransaction: true },
  })

  if (!order) {
    console.error('Order not found:', input)
    process.exit(1)
  }

  console.log(`Found order #${order.orderNumber} (${order.customerName})`)
  console.log(`  Payment status: ${order.paymentStatus}`)
  console.log(`  Order status: ${order.status}`)

  if (order.paymentStatus === 'COMPLETED') {
    console.log('Order is already marked as COMPLETED. Running assign-ticket-codes only...')
  } else {
    console.log('Marking order as COMPLETED...')
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'COMPLETED', status: 'CONFIRMED' },
      }),
      ...(order.paymentTransaction
        ? [
            prisma.paymentTransaction.update({
              where: { id: order.paymentTransaction.id },
              data: { status: 'COMPLETED' },
            }),
          ]
        : []),
    ])
    console.log('Order and payment transaction updated.')
  }

  // Refresh order
  order = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { ticketType: true, ticketCodes: true },
  })

  // Step 1: Assign ticket codes FIRST (must complete before sending email)
  const existingCount = order.ticketCodes.length
  let assignedTickets = order.ticketCodes.map((tc) => ({
    ticketNumber: tc.ticketNumber,
    ticketCode: tc.ticketCode,
  }))

  if (existingCount < order.quantity) {
    console.log(`Assigning ${order.quantity - existingCount} ticket code(s)...`)
    const result = await assignTicketCodesToOrder({
      orderId: order.id,
      quantity: order.quantity,
    })
    assignedTickets = result.assigned
    if (result.insufficient) {
      console.warn('Warning: Not enough codes in pool. Assigned', result.assigned.length, 'of', order.quantity)
    }
    result.assigned.forEach((t) => console.log(`  ${t.ticketNumber} -> ${t.ticketCode}`))
  } else {
    console.log('Order already has ticket codes assigned.')
  }

  // Step 2: Update Google Sheets
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
      ticketNumbers: assignedTickets.map((t) => t.ticketNumber).join('\n') || undefined,
      ticketCodes: assignedTickets.map((t) => t.ticketCode).join('\n') || undefined,
      notes: 'Fixed via fix-stuck-paid-order script (payment was completed but order stayed PENDING)',
    })
    console.log('Google Sheets updated.')
  } catch (err) {
    console.warn('Could not update Google Sheets:', err)
  }

  // Step 3: Send confirmation email ONLY after ticket codes are assigned
  const shouldSendEmail = process.argv.includes('--send-email')
  if (shouldSendEmail && assignedTickets.length > 0) {
    try {
      await getEmailService().sendOrderConfirmation({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        ticketType: order.ticketType.name,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        tickets: assignedTickets,
        ticketAssignmentPending: assignedTickets.length < order.quantity,
      })
      console.log('Confirmation email sent.')
    } catch (err) {
      console.error('Failed to send email:', err)
    }
  } else {
    console.log('Skipping email (use --send-email to send confirmation). Use Admin → Resend Email if needed.')
  }

  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
