import { google } from 'googleapis'

interface OrderLogData {
  timestamp: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  ticketType: string
  quantity: number
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  action: string // 'ORDER_CREATED', 'PAYMENT_COMPLETED', 'STATUS_UPDATED'
  ticketNumbers?: string // newline-separated when multiple (on payment completion)
  ticketCodes?: string   // newline-separated when multiple (on payment completion)
  notes?: string
  /** Promo code used at checkout (empty if none) */
  promoCode?: string
}

class GoogleSheetsService {
  private sheets: any
  private spreadsheetId: string = ''
  private sheetName: string = 'Orders'
  /** Sheet name quoted for A1 range (required when name has spaces/special chars) */
  private sheetRangeName: string = "'Orders'"

  constructor() {
    // Get credentials from environment variables
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID
    const sheetName = process.env.GOOGLE_SHEETS_NAME || 'Orders'

    if (!credentials || !spreadsheetId) {
      console.warn('Google Sheets credentials not configured. Order logging will be skipped.')
      return
    }

    try {
      let credentialsObj
      // Try to parse as JSON string first, if that fails, assume it's already an object
      try {
        credentialsObj = typeof credentials === 'string' ? JSON.parse(credentials) : credentials
      } catch {
        credentialsObj = credentials
      }

      const auth = new google.auth.GoogleAuth({
        credentials: credentialsObj,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      this.sheets = google.sheets({ version: 'v4', auth })
      this.spreadsheetId = spreadsheetId
      this.sheetName = sheetName
      // Quote sheet name for A1 range when it contains spaces or special characters
      this.sheetRangeName = /[\s,'"]/.test(sheetName) ? `'${sheetName.replace(/'/g, "''")}'` : sheetName

      // Initialize sheet headers if needed (async, don't await)
      this.initializeSheet().catch((err) => {
        console.error('Error initializing sheet headers:', err)
      })
    } catch (error) {
      console.error('Error initializing Google Sheets service:', error)
    }
  }

  private static readonly HEADERS_15 = [
    'Timestamp',
    'Order Number',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Ticket Type',
    'Quantity',
    'Total Amount',
    'Order Status',
    'Payment Status',
    'Action',
    'Ticket Number(s)',
    'Ticket Code(s)',
    'Notes',
    'Promo Code',
  ]

  private async initializeSheet() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetRangeName}!A1:O1`,
      })

      const firstRow = response.data.values?.[0] ?? []

      // No data: create full 15-column header
      if (firstRow.length === 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetRangeName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [GoogleSheetsService.HEADERS_15],
          },
        })
        return
      }

      // Migrate 12- or 14-column header to 15 (Promo Code column)
      if (firstRow.length === 12 || firstRow.length === 14) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetRangeName}!A1:O1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [GoogleSheetsService.HEADERS_15],
          },
        })
      }
    } catch (error) {
      console.error('Error initializing Google Sheet:', error)
    }
  }

  /** Ensure header row has 15 columns (Promo Code) for appended rows. */
  private async ensureHeader15Columns(): Promise<void> {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetRangeName}!A1:O1`,
      })
      const firstRow = res.data.values?.[0] ?? []
      if (firstRow.length === 12 || firstRow.length === 14) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetRangeName}!A1:O1`,
          valueInputOption: 'RAW',
          requestBody: { values: [GoogleSheetsService.HEADERS_15] },
        })
      }
    } catch {
      // ignore; append will still work
    }
  }

  async logOrder(data: OrderLogData): Promise<void> {
    if (!this.sheets || !this.spreadsheetId || this.spreadsheetId === '') {
      console.log('Google Sheets not configured. Order log:', data)
      return
    }

    try {
      await this.ensureHeader15Columns()

      const row = [
        data.timestamp,
        data.orderNumber,
        data.customerName,
        data.customerEmail,
        data.customerPhone,
        data.ticketType,
        data.quantity.toString(),
        data.totalAmount.toString(),
        data.orderStatus,
        data.paymentStatus,
        data.action,
        data.ticketNumbers ?? '',
        data.ticketCodes ?? '',
        data.notes || '',
        data.promoCode ?? '',
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetRangeName}!A:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [row],
        },
      })

      console.log(`Order logged to Google Sheets: ${data.orderNumber} - ${data.action}`)
    } catch (error) {
      console.error('Error logging order to Google Sheets:', error)
      // Don't throw - we don't want to break the order flow if logging fails
    }
  }
}

// Singleton instance
let googleSheetsService: GoogleSheetsService | null = null

export function getGoogleSheetsService(): GoogleSheetsService {
  if (!googleSheetsService) {
    googleSheetsService = new GoogleSheetsService()
  }
  return googleSheetsService
}

export type { OrderLogData }
