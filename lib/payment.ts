// PayMaya (Maya Checkout) payment provider

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

/**
 * PayMaya (Maya Checkout) implementation using the
 * /checkout/v1/checkouts API to generate a hosted payment page.
 *
 * Docs:
 * - Sandbox base URL: https://pg-sandbox.paymaya.com
 * - Production base URL: https://pg.maya.ph
 * - Endpoint: /checkout/v1/checkouts
 */
class PayMayaProvider implements PaymentProviderInterface {
  private checkoutBaseUrl: string
  private publicKey: string | undefined

  constructor() {
    const env = (process.env.PAYMAYA_ENV || 'sandbox').toLowerCase()
    const isProduction = env === 'production'

    this.checkoutBaseUrl = isProduction
      ? 'https://pg.maya.ph'
      : 'https://pg-sandbox.paymaya.com'

    this.publicKey = process.env.PAYMAYA_PUBLIC_KEY

    if (!this.publicKey) {
      console.warn(
        '[PayMaya] PAYMAYA_PUBLIC_KEY is not set. Create checkout requests will fail until it is configured.'
      )
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'php',
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    if (!this.publicKey) {
      throw new Error('PAYMAYA_PUBLIC_KEY is not configured')
    }

    const url = `${this.checkoutBaseUrl}/checkout/v1/checkouts`
    const requestReferenceNumber =
      metadata?.orderNumber || metadata?.orderId || `order-${Date.now()}`

    const payload: any = {
      totalAmount: {
        // Maya expects "value" (not "amount") for the checkout total
        value: amount,
        currency: currency.toUpperCase(),
      },
      redirectUrl: {
        success: metadata?.successUrl,
        failure: metadata?.failureUrl || metadata?.successUrl,
        cancel: metadata?.cancelUrl || metadata?.failureUrl || metadata?.successUrl,
      },
      requestReferenceNumber,
      metadata: {
        orderId: metadata?.orderId,
        orderNumber: metadata?.orderNumber,
      },
    }

    const authHeader =
      'Basic ' + Buffer.from(`${this.publicKey}:`).toString('base64')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[PayMaya] Failed to create checkout', response.status, text)
      throw new Error('Failed to create PayMaya checkout')
    }

    const data = (await response.json()) as {
      checkoutId: string
      redirectUrl: string
    }

    return {
      id: data.checkoutId,
      amount,
      currency: currency.toUpperCase(),
      paymentUrl: data.redirectUrl,
      status: 'pending',
    }
  }

  async verifyWebhook(payload: string | Buffer, _signature: string): Promise<any> {
    // Webhook verification (signature, etc.) can be implemented here
    // For now, webhook handling is implemented directly in the API route.
    return JSON.parse(payload.toString())
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    // Retrieving a checkout's status via API can be implemented with Maya's
    // transaction retrieval endpoints if needed. For now we return a stub.
    return {
      id: paymentIntentId,
      amount: 0,
      currency: 'PHP',
      paymentUrl: '',
      status: 'pending',
    }
  }
}

// Factory function to get the PayMaya payment provider
export function getPaymentProvider(): PaymentProviderInterface {
  return new PayMayaProvider()
}
