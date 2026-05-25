import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const importSchema = z.object({
  rows: z
    .array(
      z.object({
        ticketNumber: z.string().min(1).max(100),
        ticketCode: z.string().min(1).max(100),
      })
    )
    .min(1)
    .max(5000),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [total, assigned] = await Promise.all([
      prisma.ticketCode.count(),
      prisma.ticketCode.count({ where: { orderId: { not: null } } }),
    ])

    return NextResponse.json({ total, assigned, unassigned: total - assigned })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch ticket code stats' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { rows } = importSchema.parse(body)

    const result = await prisma.ticketCode.createMany({
      data: rows.map((r) => ({
        ticketNumber: r.ticketNumber.trim(),
        ticketCode: r.ticketCode.trim(),
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      inserted: result.count,
      skipped: rows.length - result.count,
      total: rows.length,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to import ticket codes' }, { status: 500 })
  }
}
