import type { PrismaClient, PromoCode } from '@prisma/client'

type PromoLike = Pick<PromoCode, 'discountPerTicket' | 'code'>

export async function findActivePromoForCode(
  prisma: PrismaClient,
  code: string | null | undefined
): Promise<PromoCode | null> {
  if (!code?.trim()) return null
  const trimmed = code.trim()
  return prisma.promoCode.findFirst({
    where: {
      isActive: true,
      code: { equals: trimmed, mode: 'insensitive' },
    },
  })
}

export function applyPromoDiscount(
  baseTotal: number,
  quantity: number,
  promo: PromoLike | null
): { totalAmount: number; discountAmount: number } {
  if (!promo) {
    return { totalAmount: baseTotal, discountAmount: 0 }
  }

  const discountAmount = Math.min(promo.discountPerTicket * quantity, baseTotal)
  const totalAmount = Math.max(0, baseTotal - discountAmount)

  return { totalAmount, discountAmount }
}
