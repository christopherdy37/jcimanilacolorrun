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
  notes?: string
}

class GoogleSheetsService {
  private sheets: any
  private spreadsheetId: string = ''
  private sheetName: string = 'Orders'

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

      // Initialize sheet headers if needed (async, don't await)
      this.initializeSheet().catch((err) => {
        console.error('Error initializing sheet headers:', err)
      })
    } catch (error) {
      console.error('Error initializing Google Sheets service:', error)
    }
  }

  private async initializeSheet() {
    try {
      // Check if sheet exists and has headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:J1`,
      })

      // If no data, create headers
      if (!response.data.values || response.data.values.length === 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
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
              'Notes'
            ]],
          },
        })
      }
    } catch (error) {
      console.error('Error initializing Google Sheet:', error)
    }
  }

  async logOrder(data: OrderLogData): Promise<void> {
    if (!this.sheets || !this.spreadsheetId || this.spreadsheetId === '') {
      console.log('Google Sheets not configured. Order log:', data)
      return
    }

    try {
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
        data.notes || '',
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:Z`,
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
