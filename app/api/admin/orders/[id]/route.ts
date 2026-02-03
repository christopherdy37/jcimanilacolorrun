import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleSheetsService } from '@/lib/google-sheets'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
})

export async function GET(
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
        paymentTransaction: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateOrderSchema.parse(body)

    // Get current order state before update
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        ticketType: true,
        paymentTransaction: true,
      },
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: validated,
      include: {
        ticketType: true,
        paymentTransaction: true,
      },
    })

    // Log status change to Google Sheets
    try {
      const changes: string[] = []
      if (validated.status && validated.status !== currentOrder.status) {
        changes.push(`Order status: ${currentOrder.status} → ${validated.status}`)
      }
      if (validated.paymentStatus && validated.paymentStatus !== currentOrder.paymentStatus) {
        changes.push(`Payment status: ${currentOrder.paymentStatus} → ${validated.paymentStatus}`)
      }

      if (changes.length > 0) {
        await getGoogleSheetsService().logOrder({
          timestamp: new Date().toISOString(),
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          ticketType: order.ticketType.name,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          action: 'STATUS_UPDATED',
          notes: `Admin update: ${changes.join(', ')}`,
        })
      }
    } catch (logError) {
      console.error('Error logging status update to Google Sheets:', logError)
      // Don't fail the update if logging fails
    }

    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

