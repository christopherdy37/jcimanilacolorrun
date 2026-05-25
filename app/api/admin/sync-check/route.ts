import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

async function getSheetsTicketNumbers(): Promise<Set<string>> {
  const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  const sheetName = process.env.GOOGLE_SHEETS_NAME || 'Orders'

  if (!credentials || !spreadsheetId) {
    throw new Error('Google Sheets not configured')
  }

  const credentialsObj = typeof credentials === 'string' ? JSON.parse(credentials) : credentials
  const auth = new google.auth.GoogleAuth({
    credentials: credentialsObj,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetRangeName = /[\s,'"]/.test(sheetName)
    ? `'${sheetName.replace(/'/g, "''")}'`
    : sheetName

  // Read cols K (action) and L (ticket numbers) — A:L to get both
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetRangeName}!A:L`,
  })

  const rows = res.data.values ?? []
  const ticketNumbers = new Set<string>()

  for (let i = 1; i < rows.length; i++) { // skip header
    const action = (rows[i]?.[10] ?? '').toString().trim()       // col K (index 10)
    const ticketCol = (rows[i]?.[11] ?? '').toString().trim()    // col L (index 11)
    if (action !== 'PAYMENT_COMPLETED' || !ticketCol) continue

    // Col L may have multiple ticket numbers separated by newlines
    for (const t of ticketCol.split('\n')) {
      const num = t.trim()
      if (num) ticketNumbers.add(num)
    }
  }

  return ticketNumbers
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // All assigned (real) ticket codes in DB — orderId not null, not test tickets
    const assignedTickets = await prisma.ticketCode.findMany({
      where: { orderId: { not: null } },
      select: {
        ticketNumber: true,
        ticketCode: true,
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            quantity: true,
            totalAmount: true,
            createdAt: true,
            ticketType: { select: { name: true } },
          },
        },
      },
    })

    // Filter out sandbox/test tickets
    const realTickets = assignedTickets.filter(
      (t) => !t.ticketNumber.startsWith('TEST-') && !t.ticketCode.startsWith('DUMMY-')
    )

    let sheetsTicketNumbers: Set<string>
    try {
      sheetsTicketNumbers = await getSheetsTicketNumbers()
    } catch (e) {
      return NextResponse.json(
        { error: `Could not read Google Sheets: ${(e as Error).message}` },
        { status: 500 }
      )
    }

    // Tickets assigned in DB but not found in Sheets
    const missingTickets = realTickets.filter(
      (t) => !sheetsTicketNumbers.has(t.ticketNumber)
    )

    return NextResponse.json({
      dbAssignedCount: realTickets.length,
      sheetsTicketCount: sheetsTicketNumbers.size,
      missingCount: missingTickets.length,
      missingTickets: missingTickets.map((t) => ({
        ticketNumber: t.ticketNumber,
        ticketCode: t.ticketCode,
        orderNumber: t.order?.orderNumber ?? '',
        customerName: t.order?.customerName ?? '',
        customerEmail: t.order?.customerEmail ?? '',
        customerPhone: t.order?.customerPhone ?? '',
        quantity: t.order?.quantity ?? 0,
        totalAmount: t.order?.totalAmount ?? 0,
        createdAt: t.order?.createdAt ?? null,
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Sync check failed' }, { status: 500 })
  }
}
