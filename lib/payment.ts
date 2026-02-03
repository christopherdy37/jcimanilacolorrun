// PayMaya payment provider

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  paymentUrl: string
  status: 'pending' | 'succeeded' | 'failed'
}

export interface PaymentProviderInterface {
  createPaymentIntent(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntent>
  verifyWebhook(payload: string | Buffer, signature: string): Promise<any>
  retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent>
}

// PayMaya implementation
class PayMayaProvider implements PaymentProviderInterface {
  private baseUrl: string
  private invoiceId: string

  constructor() {
    // Use configured PayMaya invoice URL or default
    this.baseUrl = process.env.PAYMAYA_INVOICE_URL || 'https://payments.maya.ph/invoice'
    // Use configured invoice ID or the one provided by user
    this.invoiceId = process.env.PAYMAYA_INVOICE_ID || '69bf3642-c9c1-4378-810b-96aa9c2b7a69'
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'php',
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    // For PayMaya, we use invoice links
    // Include amount and order information in URL parameters for verification
    // Note: PayMaya invoice links may support amount parameter
    // If your PayMaya invoice doesn't support dynamic amounts, you'll need to use PayMaya API to create invoices
    const params = new URLSearchParams({
      id: this.invoiceId,
      amount: amount.toFixed(2),
      currency: currency.toUpperCase(),
    })
    
    // Include order metadata if available for tracking
    if (metadata?.orderId) {
      params.append('orderId', metadata.orderId)
    }
    if (metadata?.orderNumber) {
      params.append('orderNumber', metadata.orderNumber)
    }

    const paymentUrl = `${this.baseUrl}?${params.toString()}`

    return {
      id: this.invoiceId,
      amount,
      currency: currency.toUpperCase(),
      paymentUrl,
      status: 'pending',
    }
  }

  async verifyWebhook(payload: string | Buffer, signature: string): Promise<any> {
    // PayMaya webhook verification would go here
    // For now, we'll handle this in the callback endpoint
    return JSON.parse(payload.toString())
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    // For PayMaya, we can't easily retrieve payment status via API without their SDK
    // This would need to be implemented with PayMaya's API if available
    const paymentUrl = `${this.baseUrl}?id=${paymentIntentId}`
    return {
      id: paymentIntentId,
      amount: 0,
      currency: 'PHP',
      paymentUrl,
      status: 'pending',
    }
  }
}

// Factory function to get the PayMaya payment provider
export function getPaymentProvider(): PaymentProviderInterface {
  return new PayMayaProvider()
}
