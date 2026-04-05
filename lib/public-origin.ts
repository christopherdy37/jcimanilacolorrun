/**
 * Base URL for absolute redirects (PayMaya callbacks, test payment flow).
 * Never rely on `request.url` alone when the app listens on 0.0.0.0 — that produces
 * unusable URLs like https://0.0.0.0:800/...
 */
export function getPublicOrigin(request: Request): string {
  const fromEnv =
    process.env.APP_URL?.trim().replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '')
    return `https://${host}`
  }

  const forwardedProto = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
  if (forwardedHost) {
    const proto = forwardedProto || 'https'
    return `${proto}://${forwardedHost}`
  }

  const url = new URL(request.url)
  let host = url.host
  const badBind = host.startsWith('0.0.0.0') || host.startsWith('[::]')

  if (badBind) {
    const headerHost = request.headers.get('host')?.trim()
    if (
      headerHost &&
      !headerHost.startsWith('0.0.0.0') &&
      !headerHost.startsWith('[::]')
    ) {
      host = headerHost
    } else {
      host = `localhost:${url.port || '3000'}`
    }
    const proto = forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : url.protocol.replace(':', '')
    return `${proto}://${host}`
  }

  return url.origin
}
