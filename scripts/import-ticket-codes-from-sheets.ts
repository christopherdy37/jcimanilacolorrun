import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

function parseCredentials(raw: string): any {
  try {
    return JSON.parse(raw)
  } catch {
    // allow raw to already be JSON-ish; but most setups should be JSON
    throw new Error('GOOGLE_SHEETS_CREDENTIALS must be valid JSON')
  }
}

async function main() {
  const spreadsheetId = requireEnv('GOOGLE_SHEETS_ID')
  const credentials = parseCredentials(requireEnv('GOOGLE_SHEETS_CREDENTIALS'))

  // Put your ticket list in a tab (sheet) like "TicketCodes" with columns:
  // A = Ticket Number, B = Code (row 1 can be headers)
  const sheetName = process.env.TICKET_CODES_SHEET_NAME || 'TicketCodes'
  const rangeA1 = process.env.TICKET_CODES_RANGE || 'A:B'

  // Quote sheet name for A1 if needed
  const sheetRangeName = /[\s,'"]/.test(sheetName) ? `'${sheetName.replace(/'/g, "''")}'` : sheetName
  const range = `${sheetRangeName}!${rangeA1}`

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  const values = res.data.values || []

  if (values.length === 0) {
    console.log('[Import] No rows found in range:', range)
    return
  }

  // If first row looks like a header, skip it
  const startIndex =
    values[0] &&
    values[0][0] &&
    String(values[0][0]).toLowerCase().includes('ticket') &&
    values[0][1] &&
    String(values[0][1]).toLowerCase().includes('code')
      ? 1
      : 0

  const rows = values.slice(startIndex)

  const data = rows
    .map((r, idx) => {
      const ticketNumber = (r?.[0] ?? '').toString().trim()
      const ticketCode = (r?.[1] ?? '').toString().trim()
      if (!ticketNumber || !ticketCode) {
        return { kind: 'skip' as const, reason: `blank fields at row ${startIndex + idx + 1}` }
      }
      return { kind: 'ok' as const, ticketNumber, ticketCode }
    })
    .filter((x): x is { kind: 'ok'; ticketNumber: string; ticketCode: string } => x.kind === 'ok')

  if (data.length === 0) {
    console.log('[Import] No valid (ticketNumber, ticketCode) rows found.')
    return
  }

  const result = await prisma.ticketCode.createMany({
    data: data.map((d) => ({ ticketNumber: d.ticketNumber, ticketCode: d.ticketCode })),
    skipDuplicates: true, // relies on unique constraints in Prisma schema
  })

  console.log('[Import] Sheet:', sheetName)
  console.log('[Import] Range:', rangeA1)
  console.log('[Import] Rows read:', rows.length)
  console.log('[Import] Valid rows:', data.length)
  console.log('[Import] Inserted (new):', result.count)
  console.log('[Import] Skipped (duplicates):', Math.max(0, data.length - result.count))
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('[Import] Failed:', err)
    await prisma.$disconnect()
    process.exit(1)
  })

