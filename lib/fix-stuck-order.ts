import { prisma } from '@/lib/prisma'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'
import { getGoogleSheetsService } from '@/lib/google-sheets'
import { getEmailService } from '@/lib/email'

export type FixStuckOrderResult = {
  ok: true
  orderNumber: string
  customerName: string
  paymentWasPending: boolean
  ticketsAssigned: number
  needed: number
  insufficient: boolean
  ticketPreview: string[]
  googleSheetsUpdated: boolean
  emailSent: boolean
  emailError?: string
} | { ok: false; error: string }

/**
 * Mark a paid-but-stuck order as COMPLETED, assign ticket codes, log to Sheets, optionally email.
 */
export async function fixStuckPaidOrder(
  orderNumberOrId: string,
  options: { sendEmail: boolean; notesSuffix?: string }
): Promise<FixStuckOrderResult> {
  const input = orderNumberOrId.trim()
  if (!input) {
    return { ok: false, error: 'Order number is required' }
  }

  let order = await prisma.order.findFirst({
    where: { OR: [{ id: input }, { orderNumber: input }] },
    include: { ticketType: true, ticketCodes: true, paymentTransaction: true },
  })

  if (!order) {
    return { ok: false, error: 'Order not found' }
  }

  const paymentWasPending = order.paymentStatus !== 'COMPLETED'

  if (paymentWasPending) {
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
  }

  order = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { ticketType: true, ticketCodes: true, paymentTransaction: true },
  })

  const existingCount = order.ticketCodes.length
  let assignedTickets = order.ticketCodes.map((tc) => ({
    ticketNumber: tc.ticketNumber,
    ticketCode: tc.ticketCode,
  }))

  let insufficient = false

  if (existingCount < order.quantity) {
    const result = await assignTicketCodesToOrder({
      orderId: order.id,
      quantity: order.quantity,
    })
    assignedTickets = result.assigned
    insufficient = result.insufficient
  }

  let googleSheetsUpdated = false
  try {
    const noteExtra = options.notesSuffix || ''
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
      notes: `Fixed stuck paid order${noteExtra ? ` (${noteExtra})` : ''}`,
    })
    googleSheetsUpdated = true
  } catch {
    // non-fatal
  }

  let emailSent = false
  let emailError: string | undefined

  if (options.sendEmail && assignedTickets.length > 0) {
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
      emailSent = true
    } catch (e) {
      emailError = e instanceof Error ? e.message : 'Email failed'
    }
  }

  const ticketPreview = assignedTickets.map((t) => `${t.ticketNumber} → ${t.ticketCode}`)

  return {
    ok: true,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    paymentWasPending,
    ticketsAssigned: assignedTickets.length,
    needed: order.quantity,
    insufficient,
    ticketPreview,
    googleSheetsUpdated,
    emailSent,
    emailError,
  }
}
