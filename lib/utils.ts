import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `JCI-${timestamp}-${random}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

/** Display-only “was” price on the site when the live ticket price is lower. */
export const TICKET_COMPARE_AT_PRICE_PHP = 2000

export function ticketShowsCompareAtPrice(price: number): boolean {
  return price < TICKET_COMPARE_AT_PRICE_PHP
}

