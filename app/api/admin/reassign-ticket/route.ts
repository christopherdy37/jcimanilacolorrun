import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleSheetsService } from '@/lib/google-sheets'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  orderNumber: z.string().min(1),
  correctTicketNumber: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { orderNumber, correctTicketNumber } = schema.parse(body)

    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: { ticketType: true, ticketCodes: true },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const correctTicket = await prisma.ticketCode.findFirst({
      where: { ticketNumber: correctTicketNumber },
    })
    if (!correctTicket) {
      return NextResponse.json(
        { error: `Ticket number "${correctTicketNumber}" not found in database` },
        { status: 404 }
      )
    }

    if (correctTicket.orderId && correctTicket.orderId !== order.id) {
      return NextResponse.json(
        { error: `Ticket ${correctTicketNumber} is already assigned to a different order` },
        { status: 409 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Unassign all currently assigned tickets for this order
      await tx.ticketCode.updateMany({
        where: { orderId: order.id },
        data: { orderId: null, assignedAt: null },
      })

      // Assign the correct ticket to this order
      await tx.ticketCode.update({
        where: { id: correctTicket.id },
        data: { orderId: order.id, assignedAt: new Date() },
      })
    })

    // Update Sheets with correct ticket
    let sheetsUpdated = false
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
        ticketNumbers: correctTicketNumber,
        ticketCodes: correctTicket.ticketCode,
        notes: `Ticket reassigned (corrected to ${correctTicketNumber})`,
        promoCode: order.promoCodeUsed ?? '',
      })
      sheetsUpdated = true
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      correctTicketNumber,
      ticketCode: correctTicket.ticketCode,
      sheetsUpdated,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Reassign failed' }, { status: 500 })
  }
}
