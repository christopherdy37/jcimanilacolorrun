import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private configured = false

  constructor() {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD

    if (smtpHost && smtpUser && smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })
      this.configured = true
    } else {
      console.warn('SMTP not configured – emails will not be sent')
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.configured || !this.transporter) {
      console.warn('Email skipped (SMTP not configured):', options.subject)
      return
    }
    const from = process.env.SMTP_FROM || 'JCI Manila Color Run <noreply@jcimanilacolorrun.com>'

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
  }

  async sendOrderConfirmation(order: {
    orderNumber: string
    customerName: string
    customerEmail: string
    ticketType: string
    quantity: number
    totalAmount: number
  }): Promise<void> {
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 JCI Manila Color Run</h1>
              <p>Order Confirmation</p>
            </div>
            <div class="content">
              <p>Hello ${order.customerName},</p>
              <p>Thank you for your purchase! Your payment has been successfully processed and your order has been confirmed.</p>
              
              <div class="order-details">
                <h2>Payment Receipt</h2>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Ticket Type:</strong> ${order.ticketType}</p>
                <p><strong>Quantity:</strong> ${order.quantity}</p>
                <p><strong>Total Amount Paid:</strong> ₱${order.totalAmount.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> <span style="color: #10b981; font-weight: bold;">✓ Paid</span></p>
              </div>

              <p>We're excited to see you at the Color Run for Mental Health!</p>
              <p>Please keep this email as your payment receipt.</p>
              <p>If you have any questions, please contact us at info@jcimanilacolorrun.com</p>
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
      subject: `Order Confirmation - ${order.orderNumber}`,
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

