import { NextRequest, NextResponse } from 'next/server'
import { forwardSetCookies, requestCsrfToken } from '@/lib/api/frappe'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const { token, upstream } = await requestCsrfToken(cookieHeader)

  const response = NextResponse.json(
    { csrf_token: token },
    { headers: { 'Cache-Control': 'no-store' } },
  )
  forwardSetCookies(upstream, response)
  return response
}
