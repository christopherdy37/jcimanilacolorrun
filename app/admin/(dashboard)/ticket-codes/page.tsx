'use client'

import { useEffect, useState } from 'react'

interface Stats {
  total: number
  assigned: number
  unassigned: number
}

interface ImportResult {
  inserted: number
  skipped: number
  total: number
}

interface ParsedRow {
  ticketNumber: string
  ticketCode: string
}

function parseRows(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const rows: ParsedRow[] = []
  const errors: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Support tab-separated (Excel copy-paste) or comma-separated
    const parts = line.includes('\t') ? line.split('\t') : line.split(',')
    const ticketNumber = (parts[0] ?? '').trim()
    const ticketCode = (parts[1] ?? '').trim()

    if (!ticketNumber || !ticketCode) {
      errors.push(`Row ${i + 1}: missing ticket number or code — "${line}"`)
      continue
    }
    rows.push({ ticketNumber, ticketCode })
  }

  return { rows, errors }
}

export default function TicketCodesPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/ticket-codes')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setStatsLoading(false))
  }, [result])

  function handleTextChange(value: string) {
    setText(value)
    setResult(null)
    setImportError(null)
    if (!value.trim()) {
      setParsed([])
      setParseErrors([])
      return
    }
    const { rows, errors } = parseRows(value)
    setParsed(rows)
    setParseErrors(errors)
  }

  async function handleImport() {
    if (parsed.length === 0) return
    setImporting(true)
    setImportError(null)
    setResult(null)

    try {
      const res = await fetch('/api/admin/ticket-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error ?? 'Import failed')
      } else {
        setResult(data)
        setText('')
        setParsed([])
        setParseErrors([])
      }
    } catch {
      setImportError('Network error — please try again')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ticket Codes</h1>
        <p className="text-gray-500 mt-1 text-sm">Import ticket codes from your Excel sheet.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['total', 'unassigned', 'assigned'] as const).map((key) => (
          <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {statsLoading ? '—' : (stats?.[key] ?? 0)}
            </div>
            <div className="text-sm text-gray-500 capitalize mt-1">{key}</div>
          </div>
        ))}
      </div>

      {/* Import */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">Paste from Excel</h2>
          <p className="text-sm text-gray-500">
            Select the two columns (Ticket Number, Ticket Code) in Excel, copy, then paste below.
            Each row = one ticket. Tab-separated or comma-separated both work.
          </p>
        </div>

        <textarea
          className="w-full h-48 font-mono text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          placeholder={"JCI-001\tABC123\nJCI-002\tDEF456\n..."}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={importing}
        />

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800 space-y-1">
            <p className="font-medium">Some rows will be skipped:</p>
            {parseErrors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        {/* Preview */}
        {parsed.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {parsed.length} row{parsed.length !== 1 ? 's' : ''} ready to import
              {parseErrors.length > 0 ? ` (${parseErrors.length} skipped)` : ''}
            </p>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Ticket Number</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Ticket Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsed.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-900">{row.ticketNumber}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-900">{row.ticketCode}</td>
                    </tr>
                  ))}
                  {parsed.length > 50 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-center text-gray-400">
                        …and {parsed.length - 50} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
            <p className="font-medium">Import complete</p>
            <p>
              {result.inserted} inserted &nbsp;·&nbsp; {result.skipped} skipped (duplicates)
            </p>
          </div>
        )}

        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            {importError}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={parsed.length === 0 || importing}
          className="px-5 py-2 bg-primary-500 text-white rounded-lg font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing…' : `Import ${parsed.length > 0 ? parsed.length + ' codes' : 'codes'}`}
        </button>
      </div>
    </div>
  )
}
