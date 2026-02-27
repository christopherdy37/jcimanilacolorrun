import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEmailService } from '@/lib/email'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/orders/[id]/resend-email
 * Resend the order confirmation email (with ticket codes if available).
 * Use when a customer paid but did not receive the email.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        ticketType: true,
        ticketCodes: {
          orderBy: { assignedAt: 'asc' },
          select: { ticketNumber: true, ticketCode: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.paymentStatus !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only resend email for paid orders' },
        { status: 400 }
      )
    }

    // Use existing ticket codes, or try to assign if missing
    let assignedTickets: Array<{ ticketNumber: string; ticketCode: string }> =
      order.ticketCodes.map((tc) => ({
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
        console.error('[Resend email] Failed to assign ticket codes:', err)
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

    return NextResponse.json({
      success: true,
      message: `Confirmation email sent to ${order.customerEmail}`,
    })
  } catch (error) {
    console.error('Error resending confirmation email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
