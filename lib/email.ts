import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/** Parse "Name <email@x.com>" or "email@x.com" */
function parseFromHeader(from: string): { name?: string; email: string } {
  const m = from.match(/^(.+?)\s*<([^>]+)>$/)
  if (m) {
    return { name: m[1].trim(), email: m[2].trim() }
  }
  return { email: from.trim() }
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  /** Uses HTTPS (443) — works when SMTP ports are blocked in Docker / cloud */
  private brevoApiKey: string | null = null
  private configured = false

  constructor() {
    const brevoKey =
      process.env.BREVO_API_KEY?.trim() ||
      process.env.SENDINBLUE_API_KEY?.trim() ||
      ''
    if (brevoKey) {
      this.brevoApiKey = brevoKey
      this.configured = true
      console.log('[Email] Brevo API configured (HTTPS — use this when SMTP times out in production)')
    }

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD

    if (smtpHost && smtpUser && smtpPassword) {
      const connectionTimeoutMs = parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '60000', 10)
      // Force IPv4 when Docker/cloud SMTP hangs on IPv6 (common ETIMEDOUT on CONN)
      const forceIpv4 = process.env.SMTP_FORCE_IPV4 === 'true'

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        requireTLS: smtpPort === 587,
        connectionTimeout: connectionTimeoutMs,
        greetingTimeout: connectionTimeoutMs,
        socketTimeout: connectionTimeoutMs,
        ...(forceIpv4 ? { family: 4 as const } : {}),
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })
      this.configured = true
      console.log(
        '[Email] SMTP configured:',
        smtpHost,
        'port',
        smtpPort,
        forceIpv4 ? '(IPv4 only)' : ''
      )
    } else if (!this.brevoApiKey) {
      const missing = []
      if (!smtpHost) missing.push('SMTP_HOST')
      if (!smtpUser) missing.push('SMTP_USER')
      if (!smtpPassword) missing.push('SMTP_PASSWORD')
      console.warn(
        '[Email] Not configured – add BREVO_API_KEY (recommended for production) or SMTP_* vars:',
        missing.join(', ')
      )
    }
  }

  /** Prefer Brevo HTTP API when key is set (avoids blocked SMTP ports). Set EMAIL_TRANSPORT=smtp to force SMTP only. */
  private useBrevoApi(): boolean {
    if (!this.brevoApiKey) return false
    const transport = (process.env.EMAIL_TRANSPORT || '').toLowerCase()
    if (transport === 'smtp') return false
    return true
  }

  private async sendViaBrevoApi(options: EmailOptions): Promise<void> {
    if (!this.brevoApiKey) throw new Error('Brevo API not configured')

    const fromRaw = process.env.SMTP_FROM || 'JCI Manila Color Run <noreply@jcimanilacolorrun.com>'
    const sender = parseFromHeader(fromRaw)

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': this.brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: sender.email,
          ...(sender.name ? { name: sender.name } : {}),
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        ...(options.text ? { textContent: options.text } : {}),
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Brevo API ${res.status}: ${errText.slice(0, 500)}`)
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.configured) {
      console.warn('[Email] Skipped (not configured):', options.subject)
      return
    }

    if (this.useBrevoApi()) {
      try {
        await this.sendViaBrevoApi(options)
        console.log('[Email] Sent via Brevo API to:', options.to, '| Subject:', options.subject)
        return
      } catch (err) {
        console.error('[Email] Brevo API failed:', err)
        if (!this.transporter) throw err
        console.warn('[Email] Falling back to SMTP...')
      }
    }

    if (!this.transporter) {
      console.warn('[Email] Skipped (no SMTP transporter):', options.subject)
      return
    }

    const from = process.env.SMTP_FROM || 'JCI Manila Color Run <noreply@jcimanilacolorrun.com>'

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      console.log('[Email] Sent via SMTP to:', options.to, '| Subject:', options.subject)
    } catch (err) {
      console.error('[Email] Send failed:', err)
      throw err
    }
  }

  async sendOrderConfirmation(order: {
    orderNumber: string
    customerName: string
    customerEmail: string
    ticketType: string
    quantity: number
    totalAmount: number
    tickets?: Array<{ ticketNumber: string; ticketCode: string }>
    ticketAssignmentPending?: boolean
  }): Promise<void> {
    const registrationInstructionsHtml =
      order.tickets && order.tickets.length
        ? `
          <div class="order-details">
            <h2>How to Register Your Ticket</h2>
            <ol style="margin: 0; padding-left: 18px;">
              <li style="margin: 6px 0;">
                Go to <a href="https://colorfest.asia/" target="_blank" rel="noopener noreferrer">https://colorfest.asia/</a>
              </li>
              <li style="margin: 6px 0;">
                Register / Sign in, then follow the on-screen instructions on the site.
              </li>
              <li style="margin: 6px 0;">
                Use the ticket code provided on this email and input on <strong>PROMO CODE</strong> field.
              </li>
            </ol>
            <p style="margin: 10px 0 0;">
              After registering, please follow any additional steps/instructions shown on
              <a href="https://colorfest.asia/" target="_blank" rel="noopener noreferrer">colorfest.asia</a>.
            </p>
          </div>
        `
        : ''

    const ticketsHtml =
      order.tickets && order.tickets.length
        ? `
          <div class="order-details">
            <h2>Your Ticket Code(s)</h2>
            <p style="margin-top: 0;">
              Keep these safe. You’ll use them to register online and present them at the event to claim your kit:
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align:left; padding: 8px; border-bottom: 1px solid #e5e7eb;">Ticket #</th>
                  <th style="text-align:left; padding: 8px; border-bottom: 1px solid #e5e7eb;">Code</th>
                </tr>
              </thead>
              <tbody>
                ${order.tickets
                  .map(
                    (t) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${(t.ticketNumber || '').toUpperCase()}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;"><strong>${(t.ticketCode || '').toUpperCase()}</strong></td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `
        : order.ticketAssignmentPending
          ? `
            <div class="order-details">
              <h2>Your Ticket Code(s)</h2>
              <p>We received your payment successfully. Your ticket code(s) will be sent in a follow-up email shortly.</p>
            </div>
          `
          : ''

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #f472b6, #60a5fa); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .success-badge { background: #d1fae5; color: #065f46; padding: 12px 16px; border-radius: 8px; font-weight: bold; margin: 16px 0; text-align: center; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 JCI Manila Color Run</h1>
              <p>Purchase Receipt</p>
            </div>
            <div class="content">
              <p>Hello ${order.customerName},</p>
              <div class="success-badge">✓ You have successfully bought your ticket(s)!</div>
              <p>Thank you for your purchase. Your payment has been received and your order is confirmed.</p>
              
              <div class="order-details">
                <h2>Your Receipt</h2>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Ticket Type:</strong> ${order.ticketType}</p>
                <p><strong>Quantity:</strong> ${order.quantity}</p>
                <p><strong>Total Amount Paid:</strong> ₱${order.totalAmount.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> <span style="color: #10b981; font-weight: bold;">✓ Paid</span></p>
              </div>

              ${ticketsHtml}
              ${registrationInstructionsHtml}

              <p>We're excited to see you at the Color Run for Mental Health! Please keep this email as your receipt.</p>
              <p>If you have any questions, contact us at info@jcimanilacolorrun.com</p>
            </div>
            <div class="footer">
              <p>JCI Manila Color Run | Color Run for Mental Health</p>
            </div>
          </div>
        </body>
      </html>
    `

    await this.sendEmail({
      to: order.customerEmail,
      subject: `Ticket Purchase Receipt - ${order.orderNumber} (Payment Successful)`,
      html,
    })
  }
}

// Singleton instance
let emailService: EmailService | null = null

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService()
  }
  return emailService
}
