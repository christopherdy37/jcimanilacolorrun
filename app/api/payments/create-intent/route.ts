import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payment'

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { ticketType: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 400 }
      )
    }

    // Test mode: skip PayMaya and redirect to test page to choose success or failure
    const isTestMode = process.env.PAYMENT_TEST_MODE === 'true'
    if (isTestMode) {
      const origin = new URL(request.url).origin
      const paymentUrl = `${origin}/checkout/test-payment?orderId=${order.id}`
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: 'paymaya',
          providerTransactionId: `test-${Date.now()}`,
          amount: order.totalAmount,
          status: 'PENDING',
          metadata: {
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            paymentUrl,
            test: true,
          },
        },
      })
      return NextResponse.json({
        paymentIntentId: `test-${order.id}`,
        paymentUrl,
      })
    }

    const paymentProvider = getPaymentProvider()
    const paymentIntent = await paymentProvider.createPaymentIntent(
      order.totalAmount,
      'php',
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
      }
    )

    // Create payment transaction record
    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: 'paymaya',
        providerTransactionId: paymentIntent.id,
        amount: order.totalAmount,
        status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
        metadata: {
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
          paymentUrl: paymentIntent.paymentUrl,
        },
      },
    })

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      paymentUrl: paymentIntent.paymentUrl,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

