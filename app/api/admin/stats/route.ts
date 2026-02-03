import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalOrders, totalRevenue, ticketBreakdown, recentOrders] = await Promise.all([
      prisma.order.count({
        where: { status: 'CONFIRMED' },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ['ticketTypeId'],
        where: { status: 'CONFIRMED' },
        _sum: { quantity: true },
        _count: { id: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          ticketType: true,
        },
      }),
    ])

    // Get ticket type names for breakdown
    const ticketTypeIds = ticketBreakdown.map((t) => t.ticketTypeId)
    const ticketTypes = await prisma.ticketType.findMany({
      where: { id: { in: ticketTypeIds } },
    })

    const breakdown = ticketBreakdown.map((t) => {
      const ticketType = ticketTypes.find((tt) => tt.id === t.ticketTypeId)
      return {
        ticketType: ticketType?.name || 'Unknown',
        quantity: t._sum.quantity || 0,
        orders: t._count.id,
      }
    })

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      ticketBreakdown: breakdown,
      recentOrders,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

