import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyPromoDiscount, findActivePromoForCode } from '@/lib/promo'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  code: z.string().optional(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().positive().max(10),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.parse(body)
    const baseTotal = parsed.unitPrice * parsed.quantity

    if (!parsed.code?.trim()) {
      return NextResponse.json({
        subtotal: baseTotal,
        totalAmount: baseTotal,
        discountAmount: 0,
        promoApplied: false,
        invalidPromo: false,
        promoLabel: null as string | null,
      })
    }

    const promo = await findActivePromoForCode(prisma, parsed.code)
    if (!promo) {
      return NextResponse.json({
        subtotal: baseTotal,
        totalAmount: baseTotal,
        discountAmount: 0,
        promoApplied: false,
        invalidPromo: true,
        promoLabel: null as string | null,
      })
    }

    const { totalAmount, discountAmount } = applyPromoDiscount(
      baseTotal,
      parsed.quantity,
      promo
    )

    return NextResponse.json({
      subtotal: baseTotal,
      totalAmount,
      discountAmount,
      promoApplied: true,
      invalidPromo: false,
      promoLabel: promo.code,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('Promo preview error:', e)
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 })
  }
}
