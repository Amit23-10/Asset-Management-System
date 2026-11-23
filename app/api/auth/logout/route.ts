import { NextRequest, NextResponse } from 'next/server'
import { COMPANY_COOKIE_NAME, CSRF_HEADER, ERP_METHODS } from '@/lib/config'
import {
  forwardSetCookies,
  frappeFetch,
  requestCsrfToken,
  requireSameOrigin,
} from '@/lib/api/frappe'
import { errorResponse } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request)

    const cookieHeader = request.headers.get('cookie') ?? ''
    const { token: csrfToken } = await requestCsrfToken(cookieHeader)

    const upstream = await frappeFetch(ERP_METHODS.logout, {
      method: 'POST',
      cookieHeader,
      headers: { [CSRF_HEADER]: csrfToken },
    })

    const response = NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    )
    response.cookies.set(COMPANY_COOKIE_NAME, '', { path: '/', maxAge: 0 })
    forwardSetCookies(upstream, response)
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
