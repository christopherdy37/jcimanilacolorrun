import { prisma } from '@/lib/prisma'

export type AssignedTicket = {
  ticketNumber: string
  ticketCode: string
}

/**
 * Atomically assigns `quantity` unassigned TicketCode rows to an order.
 * Uses row-level locks (FOR UPDATE SKIP LOCKED) to avoid duplicates under concurrency.
 */
export async function assignTicketCodesToOrder(params: {
  orderId: string
  quantity: number
}): Promise<{ assigned: AssignedTicket[]; insufficient: boolean }> {
  const quantity = Math.max(0, Math.floor(params.quantity || 0))
  if (quantity === 0) return { assigned: [], insufficient: false }

  return await prisma.$transaction(async (tx) => {
    // If already assigned enough codes to this order, return them
    const existing = await tx.ticketCode.findMany({
      where: { orderId: params.orderId },
      select: { ticketNumber: true, ticketCode: true },
      orderBy: { createdAt: 'asc' },
    })
    if (existing.length >= quantity) {
      return { assigned: existing.slice(0, quantity), insufficient: false }
    }

    const needed = quantity - existing.length

    // Lock and take the next available codes without blocking other transactions
    const rows: Array<{ id: string }> = await tx.$queryRaw`
      SELECT "id"
      FROM "ticket_codes"
      WHERE "orderId" IS NULL
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${needed}
    `

    if (rows.length === 0) {
      return { assigned: existing, insufficient: true }
    }

    const ids = rows.map((r) => r.id)

    await tx.ticketCode.updateMany({
      where: { id: { in: ids }, orderId: null },
      data: { orderId: params.orderId, assignedAt: new Date() },
    })

    const assigned = await tx.ticketCode.findMany({
      where: { orderId: params.orderId },
      select: { ticketNumber: true, ticketCode: true },
      orderBy: { assignedAt: 'asc' },
    })

    return { assigned, insufficient: assigned.length < quantity }
  })
}

