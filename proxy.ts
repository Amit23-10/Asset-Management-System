import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/config'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/csrf',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/logout',
]

/**
 * Coarse redirect gate only. Role checks happen in layouts/pages/route handlers.
 * Next.js 16 renamed middleware.ts to proxy.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next()
  }

  if (request.cookies.has(SESSION_COOKIE_NAME)) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
