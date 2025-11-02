import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Country-based blocking (server-side geo from Vercel / fallback headers)
  const BLOCKED_COUNTRIES = new Set(['CN', 'RU', 'IR', 'IN', 'TW', 'BY'])
  const countryFromGeo = (req as any).geo?.country as string | undefined
  const countryFromHeader = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || undefined
  const country = (countryFromGeo || countryFromHeader || '').toUpperCase()

  // Allowlist specific IPs (comma-separated in env ALLOWLIST_IPS)
  const forwardedFor = req.headers.get('x-forwarded-for') || ''
  const realIp = req.headers.get('x-real-ip') || ''
  const candidateIp = (forwardedFor.split(',')[0] || realIp || '').trim()
  const allowlist = (process.env.ALLOWLIST_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean)

  if (candidateIp && allowlist.includes(candidateIp)) {
    return NextResponse.next()
  }

  if (country && BLOCKED_COUNTRIES.has(country)) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Access Restricted</title></head><body style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding:40px;">
      <h1 style="margin:0 0 8px; font-size:22px;">Access Restricted</h1>
      <p style="color:#555;">This service is not available in your country.</p>
    </body></html>`
    return new NextResponse(html, {
      status: 451, // Unavailable For Legal Reasons
      headers: { 'content-type': 'text/html; charset=utf-8' }
    })
  }

  // Allow test pages and static files to pass through without authentication
  const testRoutes = ['/simple-test', '/test-auth', '/test-signin', '/debug-auth', '/test-session', '/isolated-test.html', '/debug-signin.html']
  const isTestRoute = testRoutes.includes(req.nextUrl.pathname)
  
  if (isTestRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  // For now, let all routes pass through to avoid session issues
  // The client-side authentication will handle the actual protection
  if (isPublicRoute) {
    return response
  }

  // Let all other routes pass through
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
