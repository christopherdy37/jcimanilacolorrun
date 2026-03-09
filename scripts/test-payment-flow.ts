/**
 * Test script: simulates payment success, assigns test tickets, sends confirmation email.
 * Does NOT consume real ticket codes - uses dummy TEST codes.
 *
 * Usage: npx tsx scripts/test-payment-flow.ts
 * Sends to: christopherdy37@gmail.com
 */

import { prisma } from '@/lib/prisma'
import { getEmailService } from '@/lib/email'
import { generateOrderNumber } from '@/lib/utils'
import { applyPromoDiscount } from '@/lib/promo'

const TEST_EMAIL = 'christopherdy37@gmail.com'
const PROMO_CODE = 'JCIMNLLB26'

async function main() {
  console.log('=== Payment Flow Test ===\n')

  // 1. Get a ticket type
  const ticketType = await prisma.ticketType.findFirst({
    where: { isActive: true },
  })
  if (!ticketType) {
    console.error('No active ticket type found. Run seed first.')
    process.exit(1)
  }
  console.log('Ticket type:', ticketType.name, '₱' + ticketType.price)

  // 2. Create test order (with promo code)
  const orderNumber = generateOrderNumber()
  const quantity = 2
  const baseTotal = ticketType.price * quantity
  const { totalAmount, discountAmount } = applyPromoDiscount(baseTotal, quantity, PROMO_CODE)

  console.log('Promo code:', PROMO_CODE, discountAmount > 0 ? `(-₱${discountAmount})` : '(not applied)')
  console.log('Base:', baseTotal, '→ Total:', totalAmount)

  const order = await prisma.order.create({
    data: {
      orderNumber,
      ticketTypeId: ticketType.id,
      quantity,
      totalAmount,
      customerName: 'Test Customer',
      customerEmail: TEST_EMAIL,
      customerPhone: '+639123456789',
      shirtSize: 'M',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+639123456789',
      paymentStatus: 'PENDING',
      status: 'PENDING',
    },
    include: { ticketType: true },
  })
  console.log('Created order:', order.orderNumber)

  // 3. Create payment transaction
  await prisma.paymentTransaction.create({
    data: {
      orderId: order.id,
      provider: 'paymaya',
      providerTransactionId: `test-${Date.now()}`,
      amount: totalAmount,
      status: 'PENDING',
    },
  })

  // 4. Mark as COMPLETED
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'COMPLETED', status: 'CONFIRMED' },
    }),
    prisma.paymentTransaction.updateMany({
      where: { orderId: order.id },
      data: { status: 'COMPLETED' },
    }),
  ])
  console.log('Marked order as COMPLETED')

  // 5. Assign dummy test tickets (do NOT consume real codes)
  const assignedTickets = Array.from({ length: quantity }).map((_, i) => ({
    ticketNumber: `TEST-${String(i + 1).padStart(4, '0')}`,
    ticketCode: `DUMMY-${orderNumber}-${i + 1}`,
  }))
  console.log('Assigned test tickets:', assignedTickets.map((t) => t.ticketNumber).join(', '))

  // 6. Send confirmation email
  try {
    await getEmailService().sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      ticketType: order.ticketType.name,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      tickets: assignedTickets,
      ticketAssignmentPending: false,
    })
    console.log('Email sent to:', TEST_EMAIL)
  } catch (err) {
    console.error('Failed to send email:', err)
    process.exit(1)
  }

  console.log('\n=== Test complete ===')
  console.log('Order:', order.orderNumber)
  console.log('Check', TEST_EMAIL, 'for the confirmation email.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
