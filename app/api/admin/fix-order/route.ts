import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fixStuckPaidOrder } from '@/lib/fix-stuck-order'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  orderNumber: z.string().min(1),
  sendEmail: z.boolean().optional().default(true),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { orderNumber, sendEmail } = parsed.data
  const result = await fixStuckPaidOrder(orderNumber, {
    sendEmail,
    notesSuffix: 'admin fix-order',
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json(result)
}
