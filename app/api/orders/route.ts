import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { z } from 'zod'

const createOrderSchema = z.object({
  ticketTypeId: z.string(),
  quantity: z.number().int().positive(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  shirtSize: z.string(),
  emergencyContact: z.string().min(1),
  emergencyPhone: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Get ticket type and verify availability
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: validated.ticketTypeId },
    })

    if (!ticketType || !ticketType.isActive) {
      return NextResponse.json(
        { error: 'Invalid ticket type' },
        { status: 400 }
      )
    }

    if (ticketType.maxQuantity && validated.quantity > ticketType.maxQuantity) {
      return NextResponse.json(
        { error: 'Quantity exceeds maximum allowed' },
        { status: 400 }
      )
    }

    const totalAmount = ticketType.price * validated.quantity

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        ticketTypeId: validated.ticketTypeId,
        quantity: validated.quantity,
        totalAmount,
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        customerPhone: validated.customerPhone,
        shirtSize: validated.shirtSize,
        emergencyContact: validated.emergencyContact,
        emergencyPhone: validated.emergencyPhone,
      },
      include: {
        ticketType: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          ticketType: true,
          paymentTransaction: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

