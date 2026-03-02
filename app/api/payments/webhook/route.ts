import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailService } from '@/lib/email'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'

// PayMaya webhook handler
// PayMaya will send webhooks to this endpoint when payment status changes
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // PayMaya webhook payload structure (CHECKOUT_SUCCESS, PAYMENT_SUCCESS, etc.)
    const invoiceId = body.invoiceId || body.id
    const paymentStatus = (body.status || body.paymentStatus || '').toUpperCase()

    // Maya sends PAYMENT_SUCCESS, CAPTURED, DONE, or isPaid for successful payments
    const isPaymentSuccess =
      paymentStatus === 'PAYMENT_SUCCESS' ||
      paymentStatus === 'CAPTURED' ||
      paymentStatus === 'PAID' ||
      paymentStatus === 'DONE' ||
      body.isPaid === true

    if (!invoiceId || !isPaymentSuccess) {
      console.log('[PayMaya webhook] Ignored – no invoiceId or not success:', { invoiceId, paymentStatus, isPaid: body.isPaid })
      return NextResponse.json({ received: true })
    }

    // Find payment transaction by invoice/checkout ID
    let transaction = await prisma.paymentTransaction.findFirst({
      where: {
        providerTransactionId: invoiceId,
        provider: 'paymaya',
      },
      include: {
        order: {
          include: { ticketType: true },
        },
      },
    })

    // Fallback: try requestReferenceNumber (orderNumber) if id doesn't match
    if (!transaction && body.requestReferenceNumber) {
      const orderWithTx = await prisma.order.findFirst({
        where: { orderNumber: body.requestReferenceNumber },
        include: { ticketType: true, paymentTransaction: true },
      })
      if (orderWithTx?.paymentTransaction) {
        const { paymentTransaction, ...order } = orderWithTx
        transaction = { ...paymentTransaction, order } as NonNullable<typeof transaction>
      }
    }

    if (!transaction || transaction.status === 'COMPLETED') {
      return NextResponse.json({ received: true })
    }

    // Update payment transaction and order
    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' },
      }),
      prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
        },
      }),
    ])

    // Assign physical ticket number + code(s) (never repeats)
    let assignedTickets: Array<{ ticketNumber: string; ticketCode: string }> = []
    let ticketAssignmentPending = false
    try {
      const result = await assignTicketCodesToOrder({
        orderId: transaction.orderId,
        quantity: transaction.order.quantity,
      })
      assignedTickets = result.assigned
      ticketAssignmentPending = result.insufficient
      if (ticketAssignmentPending) {
        console.warn(
          '[TicketCodes] Not enough available codes to fully assign order:',
          transaction.order.orderNumber,
          'needed',
          transaction.order.quantity,
          'assigned',
          assignedTickets.length
        )
      }
    } catch (err) {
      ticketAssignmentPending = true
      console.error('[TicketCodes] Failed assigning ticket codes:', err)
    }

    // Webhook doesn't know "test mode" reliably; keep behavior real-only here.

    // Send confirmation email
    try {
      await getEmailService().sendOrderConfirmation({
        orderNumber: transaction.order.orderNumber,
        customerName: transaction.order.customerName,
        customerEmail: transaction.order.customerEmail,
        ticketType: transaction.order.ticketType.name,
        quantity: transaction.order.quantity,
        totalAmount: transaction.order.totalAmount,
        tickets: assignedTickets.length ? assignedTickets : undefined,
        ticketAssignmentPending,
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('PayMaya webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 })
  }
}

