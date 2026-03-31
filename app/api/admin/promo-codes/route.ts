import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  code: z.string().min(1, 'Code is required').max(80),
  discountPerTicket: z.number().positive().max(1_000_000).optional(),
  label: z.string().max(200).optional().nullable(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const promos = await prisma.promoCode.findMany({
      orderBy: { code: 'asc' },
    })
    return NextResponse.json(promos)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to list promo codes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSchema.parse(body)
    const codeTrim = parsed.code.trim()

    const duplicate = await prisma.promoCode.findFirst({
      where: { code: { equals: codeTrim, mode: 'insensitive' } },
    })
    if (duplicate) {
      return NextResponse.json(
        { error: 'A promo with this code already exists' },
        { status: 409 }
      )
    }

    const created = await prisma.promoCode.create({
      data: {
        code: codeTrim,
        discountPerTicket: parsed.discountPerTicket ?? 500,
        label: parsed.label ?? null,
        isActive: true,
      },
    })
    return NextResponse.json(created)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: e.errors },
        { status: 400 }
      )
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 })
  }
}
