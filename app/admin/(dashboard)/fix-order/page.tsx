'use client'

import { useState } from 'react'
import Link from 'next/link'

type FixResult = {
  ok: true
  orderNumber: string
  customerName: string
  paymentWasPending: boolean
  ticketsAssigned: number
  needed: number
  insufficient: boolean
  ticketPreview: string[]
  googleSheetsUpdated: boolean
  emailSent: boolean
  emailError?: string
}

export default function AdminFixOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FixResult | null>(null)

  async function handleFix(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/fix-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), sendEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`)
        return
      }
      setResult(data)
      setOrderNumber('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fix stuck paid order</h1>
        <p className="text-gray-600 mt-2">
          When PayMaya shows paid but the order is still <strong>PENDING</strong> (no tickets / no email).
          Confirm payment in Maya first.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          <Link href="/admin/orders" className="text-primary-600 hover:underline">
            Browse orders
          </Link>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg mb-6">
        <form onSubmit={handleFix} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. JCI-MN3RJ4QG-9MOU"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            Send confirmation email to customer
          </label>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Working…' : 'Complete order, assign tickets, update sheet'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg border-l-4 border-emerald-500">
          <h2 className="font-semibold text-gray-900 mb-2">Success</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              <strong>Order:</strong> {result.orderNumber}
            </li>
            <li>
              <strong>Customer:</strong> {result.customerName}
            </li>
            <li>
              <strong>Payment was pending:</strong>{' '}
              {result.paymentWasPending ? 'Yes (now completed)' : 'Already completed'}
            </li>
            <li>
              <strong>Tickets:</strong> {result.ticketsAssigned} / {result.needed}
              {result.insufficient && ' (pool may be short)'}
            </li>
            {result.ticketPreview.length > 0 && (
              <li className="mt-2">
                <strong>Codes:</strong>
                <ul className="font-mono text-xs mt-1 space-y-0.5">
                  {result.ticketPreview.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            )}
            <li>
              <strong>Google Sheets:</strong> {result.googleSheetsUpdated ? 'Updated' : 'Not updated (check logs)'}
            </li>
            <li>
              <strong>Email:</strong>{' '}
              {sendEmail ? (result.emailSent ? 'Sent' : result.emailError || 'Not sent') : 'Skipped'}
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
