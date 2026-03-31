import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailService } from '@/lib/email'
import { getGoogleSheetsService } from '@/lib/google-sheets'
import { getPaymentProvider } from '@/lib/payment'
import { assignTicketCodesToOrder } from '@/lib/ticket-codes'

const SUCCESS_STATUSES = ['PAYMENT_SUCCESS', 'CAPTURED', 'PAID', 'DONE']
const FAILURE_STATUSES = ['PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'PAYMENT_CANCELLED', 'VOIDED', 'REFUNDED']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let orderId = searchParams.get('orderId')
    const invoiceId =
      searchParams.get('invoiceId') ||
      searchParams.get('checkoutId') ||
      searchParams.get('id')
    const status = searchParams.get('status') // Our own status flag for readability
    const paidAmount =
      searchParams.get('amount') || searchParams.get('totalAmount') // Amount paid (if PayMaya returns it)
    const isTest = searchParams.get('test') === '1'
    const isSandboxEnv =
      (process.env.PAYMAYA_ENV || 'sandbox').toLowerCase() !== 'production'

    // Find the order: by orderId (our URL param) or by checkoutId (Maya may redirect with only their params)
    let order = orderId
      ? await prisma.order.findUnique({
          where: { id: orderId },
          include: { ticketType: true, paymentTransaction: true },
        })
      : null

    if (!order && invoiceId) {
      const tx = await prisma.paymentTransaction.findFirst({
        where: { providerTransactionId: invoiceId, provider: 'paymaya' },
        include: { order: { include: { ticketType: true, paymentTransaction: true } } },
      })
      if (tx?.order) {
        order = tx.order
        orderId = order.id
      }
    }

    if (!order || !orderId) {
      console.warn('[PayMaya callback GET] Order not found:', { orderId, invoiceId, url: request.url })
      return NextResponse.redirect(new URL('/checkout/payment-error', request.url))
    }

    // If payment is already completed, redirect to success
    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
    }

    // Verify payment amount matches order amount (when PayMaya sends it back in redirect)
    const expectedAmount = order.totalAmount
    if (paidAmount) {
      const paidAmountNum = parseFloat(paidAmount)
      // Allow small rounding differences (0.01)
      if (Math.abs(paidAmountNum - expectedAmount) > 0.01) {
        console.error(`Payment amount mismatch for order ${orderId}: Expected ${expectedAmount}, got ${paidAmountNum}`)
        return NextResponse.redirect(new URL('/checkout/payment-error?reason=amount_mismatch', request.url))
      }
    } else if (process.env.REQUIRE_AMOUNT_VERIFICATION === 'true') {
      // Strict mode: do not confirm unless we received and verified the amount.
      // Maya does NOT include paid amount in the success redirect URL — do NOT use this with Maya or every payment will fail.
      console.warn(`Payment amount not returned for order ${orderId}. Redirecting to error (REQUIRE_AMOUNT_VERIFICATION=true).`)
      return NextResponse.redirect(new URL('/checkout/payment-error?reason=amount_unverified', request.url))
    }

    // For PayMaya, we'll mark payment as completed when user returns from PayMaya
    // When we have status=success from our URL, we trust it. When we only have invoiceId,
    // optionally verify via Maya API - but only reject on explicit failure (not PENDING).
    const checkoutId = invoiceId || order.paymentTransaction?.providerTransactionId
    if (status === 'success' || invoiceId) {
      // Only verify when we have invoiceId but NOT status=success (Maya may have appended params).
      // When status=success from our URL, we trust the redirect.
      if (checkoutId && status !== 'success') {
        const provider = getPaymentProvider()
        const apiStatus = provider.getPaymentStatus
          ? await provider.getPaymentStatus(checkoutId)
          : null
        // Only reject on explicit failure. PENDING/PROCESSING can mean delay - allow through.
        if (apiStatus && FAILURE_STATUSES.includes(apiStatus)) {
          console.warn(
            `[PayMaya callback] API status for ${checkoutId} is ${apiStatus}, not marking complete`
          )
          return NextResponse.redirect(new URL('/checkout/payment-error?reason=status_unverified', request.url))
        }
      }
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

      // Assign ticket codes FIRST (must complete before sending email)
      let assignedTickets: Array<{ ticketNumber: string; ticketCode: string }> = []
      let ticketAssignmentPending = false
      // In sandbox / test, do NOT consume real ticket codes from the pool.
      if (isSandboxEnv || isTest) {
        assignedTickets = Array.from({ length: Math.max(1, order.quantity) }).map((_, i) => ({
          ticketNumber: `TEST-${String(i + 1).padStart(4, '0')}`,
          ticketCode: `DUMMY-${order.orderNumber}-${i + 1}`,
        }))
        ticketAssignmentPending = false
      } else {
        try {
          const result = await assignTicketCodesToOrder({
            orderId: order.id,
            quantity: order.quantity,
          })
          assignedTickets = result.assigned
          ticketAssignmentPending = result.insufficient
          if (ticketAssignmentPending) {
            console.warn(
              '[TicketCodes] Not enough available codes to fully assign order:',
              order.orderNumber,
              'needed',
              order.quantity,
              'assigned',
              assignedTickets.length
            )
          }
        } catch (err) {
          ticketAssignmentPending = true
          console.error('[TicketCodes] Failed assigning ticket codes:', err)
        }
      }

      // Send receipt email ONLY after ticket codes are assigned
      try {
        console.log('[PayMaya callback] Sending receipt email to:', order.customerEmail)
        await getEmailService().sendOrderConfirmation({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          ticketType: order.ticketType.name,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          tickets: assignedTickets.length ? assignedTickets : undefined,
          ticketAssignmentPending,
        })
      } catch (emailError) {
        console.error('[PayMaya callback] Failed to send receipt email:', emailError)
        // Don't fail the callback if email fails
      }

      // Log payment completion to Google Sheets (with ticket number(s) and code(s))
      try {
        const notes = isTest
          ? `[TEST] Payment simulated (no real charge). Invoice ID: ${invoiceId || 'N/A'}`
          : `Payment completed via PayMaya. Invoice ID: ${invoiceId || 'N/A'}`
        const ticketNumbers = assignedTickets.length
          ? assignedTickets.map((t) => t.ticketNumber).join('\n')
          : ''
        const ticketCodes = assignedTickets.length
          ? assignedTickets.map((t) => t.ticketCode).join('\n')
          : ''
        await getGoogleSheetsService().logOrder({
          timestamp: new Date().toISOString(),
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          ticketType: order.ticketType.name,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          orderStatus: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          action: 'PAYMENT_COMPLETED',
          ticketNumbers: ticketNumbers || undefined,
          ticketCodes: ticketCodes || undefined,
          notes,
          promoCode: order.promoCodeUsed ?? '',
        })
      } catch (logError) {
        console.error('Error logging payment to Google Sheets:', logError)
        // Don't fail the callback if logging fails
      }

      return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, request.url))
    }

    // If status is not success and no invoiceId, redirect to payment error page
    console.warn('[PayMaya callback GET] No success signal:', { orderId, status, invoiceId })
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
    const paymentStatus = (body.status || body.paymentStatus || '').toUpperCase()
    // Maya sends amount as number/string or totalAmount.value (CHECKOUT_SUCCESS format)
    const paidAmountRaw = body.amount || body.paidAmount || body.totalAmount
    const paidAmount =
      paidAmountRaw && typeof paidAmountRaw === 'object' && 'value' in paidAmountRaw
        ? paidAmountRaw.value
        : paidAmountRaw
    const isSandboxEnv =
      (process.env.PAYMAYA_ENV || 'sandbox').toLowerCase() !== 'production'

    // Maya sends PAYMENT_SUCCESS, CAPTURED, DONE, or isPaid for successful payments
    const isPaymentSuccess =
      paymentStatus === 'PAYMENT_SUCCESS' ||
      paymentStatus === 'CAPTURED' ||
      paymentStatus === 'PAID' ||
      paymentStatus === 'DONE' ||
      body.isPaid === true

    if (!invoiceId || !isPaymentSuccess) {
      console.log('[PayMaya webhook] Ignored – no invoiceId or not success:', { invoiceId, paymentStatus, isPaid: body.isPaid, requestRef: body.requestReferenceNumber })
      return NextResponse.json({ received: true })
    }

    console.log('[PayMaya webhook] Processing:', { invoiceId, paymentStatus, requestRef: body.requestReferenceNumber })

    // Find payment transaction by invoice/checkout ID (Maya may send id or invoiceId)
    let transaction = await prisma.paymentTransaction.findFirst({
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

    // Fallback: Maya may send payment id which differs from checkoutId; try requestReferenceNumber (orderNumber)
    if (!transaction && body.requestReferenceNumber) {
      const orderWithTx = await prisma.order.findFirst({
        where: { orderNumber: body.requestReferenceNumber },
        include: { ticketType: true, paymentTransaction: true },
      })
      if (orderWithTx?.paymentTransaction) {
        const { paymentTransaction, ...order } = orderWithTx
        transaction = { ...paymentTransaction, order } as NonNullable<typeof transaction>
      }
    }

    // Fallback: try metadata.orderId (we pass this when creating checkout)
    if (!transaction && body.metadata?.orderId) {
      const orderWithTx = await prisma.order.findFirst({
        where: { id: body.metadata.orderId },
        include: { ticketType: true, paymentTransaction: true },
      })
      if (orderWithTx?.paymentTransaction) {
        const { paymentTransaction, ...order } = orderWithTx
        transaction = { ...paymentTransaction, order } as NonNullable<typeof transaction>
      }
    }

    if (!transaction || transaction.status === 'COMPLETED') {
      if (!transaction) {
        console.warn('[PayMaya webhook] No matching transaction for:', { invoiceId, requestRef: body.requestReferenceNumber, metadataOrderId: body.metadata?.orderId })
      }
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

    // Assign ticket codes FIRST (must complete before sending email)
    let assignedTickets: Array<{ ticketNumber: string; ticketCode: string }> = []
    let ticketAssignmentPending = false
    if (isSandboxEnv) {
      // In sandbox, do not consume real ticket codes; generate dummy ones instead.
      assignedTickets = Array.from({ length: Math.max(1, transaction.order.quantity) }).map(
        (_, i) => ({
          ticketNumber: `TEST-${String(i + 1).padStart(4, '0')}`,
          ticketCode: `DUMMY-${transaction.order.orderNumber}-${i + 1}`,
        })
      )
      ticketAssignmentPending = false
    } else {
      try {
        const result = await assignTicketCodesToOrder({
          orderId: transaction.orderId,
          quantity: transaction.order.quantity,
        })
        assignedTickets = result.assigned
        ticketAssignmentPending = result.insufficient
      } catch (err) {
        ticketAssignmentPending = true
        console.error('[TicketCodes] Failed assigning ticket codes (webhook):', err)
      }
    }

    // Send confirmation email ONLY after ticket codes are assigned
    try {
      await getEmailService().sendOrderConfirmation({
        orderNumber: transaction.order.orderNumber,
        customerName: transaction.order.customerName,
        customerEmail: transaction.order.customerEmail,
        ticketType: transaction.order.ticketType.name,
        quantity: transaction.order.quantity,
        totalAmount: transaction.order.totalAmount,
        tickets: assignedTickets.length ? assignedTickets : undefined,
        ticketAssignmentPending,
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    // Log payment completion to Google Sheets (webhook) with ticket number(s) and code(s)
    try {
      const ticketNumbers = assignedTickets.length
        ? assignedTickets.map((t) => t.ticketNumber).join('\n')
        : ''
      const ticketCodes = assignedTickets.length
        ? assignedTickets.map((t) => t.ticketCode).join('\n')
        : ''
      await getGoogleSheetsService().logOrder({
        timestamp: new Date().toISOString(),
        orderNumber: transaction.order.orderNumber,
        customerName: transaction.order.customerName,
        customerEmail: transaction.order.customerEmail,
        customerPhone: transaction.order.customerPhone,
        ticketType: transaction.order.ticketType.name,
        quantity: transaction.order.quantity,
        totalAmount: transaction.order.totalAmount,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        action: 'PAYMENT_COMPLETED',
        ticketNumbers: ticketNumbers || undefined,
        ticketCodes: ticketCodes || undefined,
        notes: `Payment completed via PayMaya webhook. Invoice ID: ${invoiceId}`,
        promoCode: transaction.order.promoCodeUsed ?? '',
      })
    } catch (logError) {
      console.error('Error logging payment to Google Sheets:', logError)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('PayMaya webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 })
  }
}
