import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

async function getSheetsOrderNumbers(): Promise<Set<string>> {
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

  // Read columns B (order number) and K (action) — B=col2, K=col11
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetRangeName}!B:K`,
  })

  const rows = res.data.values ?? []
  const orderNumbers = new Set<string>()

  for (let i = 1; i < rows.length; i++) { // skip header row
    const orderNumber = (rows[i]?.[0] ?? '').toString().trim() // col B
    const action = (rows[i]?.[9] ?? '').toString().trim()      // col K (B+9 offset)
    if (orderNumber && action === 'PAYMENT_COMPLETED') {
      orderNumbers.add(orderNumber)
    }
  }

  return orderNumbers
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // All confirmed + paid orders in DB
    const dbOrders = await prisma.order.findMany({
      where: { paymentStatus: 'COMPLETED', status: 'CONFIRMED' },
      select: {
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        quantity: true,
        totalAmount: true,
        createdAt: true,
        ticketCodes: { select: { ticketNumber: true, ticketCode: true } },
        ticketType: { select: { name: true } },
        promoCodeUsed: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    let sheetsOrderNumbers: Set<string>
    try {
      sheetsOrderNumbers = await getSheetsOrderNumbers()
    } catch (e) {
      return NextResponse.json({ error: `Could not read Google Sheets: ${(e as Error).message}` }, { status: 500 })
    }

    const missingFromSheets = dbOrders.filter(
      (o) => !sheetsOrderNumbers.has(o.orderNumber)
    )

    return NextResponse.json({
      dbTotal: dbOrders.length,
      sheetsTotal: sheetsOrderNumbers.size,
      missingCount: missingFromSheets.length,
      missingOrders: missingFromSheets.map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        ticketType: o.ticketType.name,
        quantity: o.quantity,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        promoCode: o.promoCodeUsed ?? '',
        ticketNumbers: o.ticketCodes.map((t) => t.ticketNumber).join(', '),
        ticketCodes: o.ticketCodes.map((t) => t.ticketCode).join(', '),
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Sync check failed' }, { status: 500 })
  }
}
