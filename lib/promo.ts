/**
 * Promo code validation and discount calculation.
 * Code "JCIMNLLB26" reduces ticket price by ₱500 per ticket.
 * Valid until end of March (configurable via env).
 */

const PROMO_CODE = 'JCIMNLLB26'
const DISCOUNT_PER_TICKET = 500

/** Last valid date: end of March. Uses PROMO_EXPIRY_YEAR env or current year. */
function getPromoExpiryDate(): Date {
  const year = parseInt(process.env.PROMO_EXPIRY_YEAR || String(new Date().getFullYear()), 10)
  return new Date(year, 2, 31, 23, 59, 59, 999) // March 31
}

export function validatePromoCode(code: string | null | undefined): {
  valid: boolean
  discountPerTicket: number
  error?: string
} {
  if (!code || typeof code !== 'string') {
    return { valid: false, discountPerTicket: 0 }
  }

  const trimmed = code.trim().toUpperCase()
  if (trimmed !== PROMO_CODE) {
    return { valid: false, discountPerTicket: 0, error: 'Invalid promo code' }
  }

  const now = new Date()
  const expiry = getPromoExpiryDate()
  if (now > expiry) {
    return { valid: false, discountPerTicket: 0, error: 'Promo code has expired' }
  }

  return { valid: true, discountPerTicket: DISCOUNT_PER_TICKET }
}

export function applyPromoDiscount(
  baseTotal: number,
  quantity: number,
  promoCode: string | null | undefined
): { totalAmount: number; discountAmount: number } {
  const { valid, discountPerTicket } = validatePromoCode(promoCode)
  if (!valid) {
    return { totalAmount: baseTotal, discountAmount: 0 }
  }

  const discountAmount = Math.min(discountPerTicket * quantity, baseTotal)
  const totalAmount = Math.max(0, baseTotal - discountAmount)

  return { totalAmount, discountAmount }
}
