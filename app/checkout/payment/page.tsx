'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    // If someone lands here, redirect them back
    // PayMaya payments redirect directly to PayMaya
    if (orderId) {
      router.push(`/checkout/success?orderId=${orderId}`)
    } else {
      router.push('/')
    }
  }, [orderId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Redirecting...</p>
        <Link
          href="/"
          className="text-primary-500 hover:text-primary-600 underline"
        >
          Return to home
        </Link>
      </div>
    </div>
  )
}

function PaymentFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Redirecting...</p>
        <Link
          href="/"
          className="text-primary-500 hover:text-primary-600 underline"
        >
          Return to home
        </Link>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  )
}
