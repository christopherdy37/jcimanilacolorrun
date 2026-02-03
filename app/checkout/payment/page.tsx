import { Suspense } from 'react'
import PaymentContent from './PaymentContent'

function PaymentFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Redirecting...</p>
        <a
          href="/"
          className="text-primary-500 hover:text-primary-600 underline"
        >
          Return to home
        </a>
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
