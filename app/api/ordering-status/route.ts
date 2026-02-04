import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns whether ticket ordering is enabled (read from env at request time).
 * Only explicit "true" (lowercase) enables ordering; unset or any other value = disabled.
 */
export async function GET() {
  const raw = process.env.NEXT_PUBLIC_TICKET_ORDERING_ENABLED
  const enabled = String(raw).toLowerCase().trim() === 'true'
  return NextResponse.json({ ticketOrderingEnabled: enabled })
}
