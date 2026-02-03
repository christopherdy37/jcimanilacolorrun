import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailService } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const invoiceId = searchParams.get('invoiceId')
    const status = searchParams.get('status') // PayMaya may pass payment status
    const paidAmount = searchParams.get('amount') // Amount paid (if PayMaya returns it)

    if (!orderId) {
      return NextResponse.redirect(new URL('/checkout/payment-error', request.url))
    }

    // Find the order and payment transaction
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        ticketType: true,
        paymentTransaction: true,
      },
    })

    if (!order) {
      return NextResponse.redirect(new URL('/checkout/payment-error', request.url))
    }

    // If payment is already completed, redirect to success
    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
    }

    // Verify payment amount matches order amount
    if (paidAmount) {
      const paidAmountNum = parseFloat(paidAmount)
      const expectedAmount = order.totalAmount
      
      // Allow small rounding differences (0.01)
      if (Math.abs(paidAmountNum - expectedAmount) > 0.01) {
        console.error(`Payment amount mismatch for order ${orderId}: Expected ${expectedAmount}, got ${paidAmountNum}`)
        return NextResponse.redirect(new URL('/checkout/payment-error?reason=amount_mismatch', request.url))
      }
    }

    // For PayMaya, we'll mark payment as completed when user returns from PayMaya
    // In production, you should verify payment status with PayMaya's API
    // For now, we'll update the order status and send email
    if (status === 'success' || invoiceId) {
      // Update payment transaction if it exists
      if (order.paymentTransaction) {
        await prisma.paymentTransaction.update({
          where: { id: order.paymentTransaction.id },
          data: {
            status: 'COMPLETED',
            providerTransactionId: invoiceId || order.paymentTransaction.providerTransactionId,
          },
        })
      } else {
        // Create payment transaction if it doesn't exist
        await prisma.paymentTransaction.create({
          data: {
            orderId: order.id,
            provider: 'paymaya',
            providerTransactionId: invoiceId || 'paymaya-invoice',
            amount: order.totalAmount,
            status: 'COMPLETED',
          },
        })
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
        },
      })

      // Send confirmation email
      try {
        await getEmailService().sendOrderConfirmation({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          ticketType: order.ticketType.name,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
        })
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't fail the callback if email fails
      }

      return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
    }

    // If status is not success, redirect to payment error page
    return NextResponse.redirect(new URL('/checkout/payment-error', request.url))
  } catch (error) {
    console.error('PayMaya callback error:', error)
    return NextResponse.redirect(new URL('/checkout/payment-error', request.url))
  }
}

// POST handler for webhook callbacks from PayMaya
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // PayMaya webhook payload structure may vary
    // Adjust based on PayMaya's actual webhook format
    const invoiceId = body.invoiceId || body.id
    const paymentStatus = body.status || body.paymentStatus
    const paidAmount = body.amount || body.totalAmount || body.paidAmount

    if (!invoiceId || paymentStatus !== 'paid') {
      return NextResponse.json({ received: true })
    }

    // Find payment transaction by invoice ID
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        providerTransactionId: invoiceId,
        provider: 'paymaya',
      },
      include: {
        order: {
          include: { ticketType: true },
        },
      },
    })

    if (!transaction || transaction.status === 'COMPLETED') {
      return NextResponse.json({ received: true })
    }

    // Verify payment amount matches expected amount
    if (paidAmount) {
      const paidAmountNum = parseFloat(paidAmount.toString())
      const expectedAmount = transaction.amount
      
      // Allow small rounding differences (0.01)
      if (Math.abs(paidAmountNum - expectedAmount) > 0.01) {
        console.error(`Payment amount mismatch for transaction ${transaction.id}: Expected ${expectedAmount}, got ${paidAmountNum}`)
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
      }
    }

    // Update payment transaction and order
    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' },
      }),
      prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
        },
      }),
    ])

    // Send confirmation email
    try {
      await getEmailService().sendOrderConfirmation({
        orderNumber: transaction.order.orderNumber,
        customerName: transaction.order.customerName,
        customerEmail: transaction.order.customerEmail,
        ticketType: transaction.order.ticketType.name,
        quantity: transaction.order.quantity,
        totalAmount: transaction.order.totalAmount,
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('PayMaya webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 })
  }
}
