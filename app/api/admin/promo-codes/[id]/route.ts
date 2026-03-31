import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  discountPerTicket: z.number().positive().max(1_000_000).optional(),
  label: z.string().max(200).optional().nullable(),
  code: z.string().min(1).max(80).optional(),
})

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
    const parsed = patchSchema.parse(body)

    const existing = await prisma.promoCode.findUnique({
      where: { id: params.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (parsed.code !== undefined) {
      const codeTrim = parsed.code.trim()
      const conflict = await prisma.promoCode.findFirst({
        where: {
          code: { equals: codeTrim, mode: 'insensitive' },
          NOT: { id: params.id },
        },
      })
      if (conflict) {
        return NextResponse.json(
          { error: 'Another promo already uses this code' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.promoCode.update({
      where: { id: params.id },
      data: {
        ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
        ...(parsed.discountPerTicket !== undefined
          ? { discountPerTicket: parsed.discountPerTicket }
          : {}),
        ...(parsed.label !== undefined ? { label: parsed.label } : {}),
        ...(parsed.code !== undefined ? { code: parsed.code.trim() } : {}),
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: e.errors },
        { status: 400 }
      )
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 })
  }
}
