import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  discountPerTicket: z.number().positive().max(1_000_000),
})

/**
 * Sets discountPerTicket for every promo (e.g. one-time fix when DB still had old values).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = bodySchema.parse(body)

    const result = await prisma.promoCode.updateMany({
      data: { discountPerTicket: parsed.discountPerTicket },
    })

    return NextResponse.json({
      ok: true,
      updatedCount: result.count,
      discountPerTicket: parsed.discountPerTicket,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 })
  }
}
