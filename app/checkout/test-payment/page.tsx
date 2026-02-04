'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function TestPaymentContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Missing order. Start a test order from the ticket section.</p>
          <Link href="/#tickets" className="text-primary-500 font-semibold hover:underline">
            Go to Tickets
          </Link>
        </div>
      </div>
    )
  }

  const successUrl = `/api/payments/paymaya-callback?orderId=${orderId}&status=success&invoiceId=test-${Date.now()}&test=1`
  const failureUrl = '/checkout/payment-error'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Test payment</h1>
        <p className="text-gray-600 mb-6">
          Simulate what happens after PayMaya. Choose success or failure to test both flows.
        </p>
        <div className="space-y-3">
          <a
            href={successUrl}
            className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Simulate successful payment
          </a>
          <a
            href={failureUrl}
            className="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Simulate failed payment
          </a>
          <Link
            href="/"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  )
}

function TestPaymentFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={<TestPaymentFallback />}>
      <TestPaymentContent />
    </Suspense>
  )
}
