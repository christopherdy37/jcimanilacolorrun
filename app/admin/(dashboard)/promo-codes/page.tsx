'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type PromoRow = {
  id: string
  code: string
  discountPerTicket: number
  isActive: boolean
  label: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminPromoCodesPage() {
  const [rows, setRows] = useState<PromoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createCode, setCreateCode] = useState('')
  const [createDiscount, setCreateDiscount] = useState('300')
  const [createLabel, setCreateLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [bulkWorking, setBulkWorking] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/admin/promo-codes')
      if (!res.ok) {
        setError('Failed to load promo codes')
        return
      }
      const data = await res.json()
      setRows(data)
      const next: Record<string, string> = {}
      for (const r of data as PromoRow[]) {
        next[r.id] = String(r.discountPerTicket)
      }
      setDiscountInputs(next)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const discount = parseFloat(createDiscount)
      if (Number.isNaN(discount) || discount <= 0) {
        setError('Discount per ticket must be a positive number')
        setSaving(false)
        return
      }
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: createCode.trim(),
          discountPerTicket: discount,
          label: createLabel.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not create promo')
        return
      }
      setCreateCode('')
      setCreateLabel('')
      setCreateDiscount('300')
      await load()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function saveRowDiscount(row: PromoRow) {
    const raw = discountInputs[row.id]
    const discount = parseFloat(raw ?? '')
    if (Number.isNaN(discount) || discount <= 0) {
      setError('Discount must be a positive number')
      return
    }
    setSavingId(row.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/promo-codes/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPerTicket: discount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not save discount')
        return
      }
      await load()
    } catch {
      setError('Network error')
    } finally {
      setSavingId(null)
    }
  }

  async function setAllDiscountsTo300() {
    if (
      !confirm(
        'Update every promo code to ₱300 off per ticket (₱2,000 → ₱1,700)? This overwrites each code’s current discount.'
      )
    ) {
      return
    }
    setBulkWorking(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/promo-codes/bulk-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPerTicket: 300 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Bulk update failed')
        return
      }
      await load()
    } catch {
      setError('Network error')
    } finally {
      setBulkWorking(false)
    }
  }

  async function toggleActive(row: PromoRow) {
    setError(null)
    try {
      const res = await fetch(`/api/admin/promo-codes/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !row.isActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Update failed')
        return
      }
      await load()
    } catch {
      setError('Network error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Promo codes</h1>
        <p className="text-gray-600 mt-2">
          Checkout no longer accepts promo codes. These records are for reference only (existing orders may
          still show a code that was applied in the past).
        </p>
        <p className="text-sm text-gray-500 mt-2">
          <Link href="/admin" className="text-primary-600 hover:underline">
            Dashboard
          </Link>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 max-w-xl mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add promo code</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input
              type="text"
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value)}
              required
              placeholder="e.g. SponsorName"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount per ticket (PHP)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={createDiscount}
              onChange={(e) => setCreateDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
            <input
              type="text"
              value={createLabel}
              onChange={(e) => setCreateLabel(e.target.value)}
              placeholder="Internal note"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add promo code'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-900">
            If checkout still shows the old ₱500 discount, your database was not migrated. Use this to fix all
            codes at once.
          </p>
          <button
            type="button"
            disabled={bulkWorking || rows.length === 0}
            onClick={setAllDiscountsTo300}
            className="shrink-0 px-3 py-1.5 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50"
          >
            {bulkWorking ? 'Updating…' : 'Set all to ₱300 off / ticket'}
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ₱ off / ticket
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{row.code}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={discountInputs[row.id] ?? String(row.discountPerTicket)}
                      onChange={(e) =>
                        setDiscountInputs((m) => ({ ...m, [row.id]: e.target.value }))
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="button"
                      disabled={savingId === row.id}
                      onClick={() => saveRowDiscount(row)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-800"
                    >
                      {savingId === row.id ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.label || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {row.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleActive(row)}
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    {row.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-gray-500 text-sm text-center">No promo codes yet. Run seed or add one above.</p>
        )}
      </div>
    </div>
  )
}
