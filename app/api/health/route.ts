import { NextResponse } from 'next/server'

/**
 * Health check endpoint - no DB, no auth, no external deps.
 * Use this to verify the app is running (e.g. Railway health checks).
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
