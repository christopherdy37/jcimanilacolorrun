import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        ticketType: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generate CSV
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Email',
      'Phone',
      'Ticket Type',
      'Quantity',
      'Total Amount',
      'Status',
      'Payment Status',
      'Shirt Size',
      'Emergency Contact',
    ]

    const rows = orders.map((order) => [
      order.orderNumber,
      order.createdAt.toISOString(),
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.ticketType.name,
      order.quantity.toString(),
      order.totalAmount.toFixed(2),
      order.status,
      order.paymentStatus,
      order.shirtSize,
      order.emergencyContact,
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}

