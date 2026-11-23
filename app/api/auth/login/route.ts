import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CSRF_HEADER,
  ERP_METHODS,
} from '@/lib/config'
import {
  forwardSetCookies,
  getSetCookies,
  mergeCookieHeader,
  requestCsrfToken,
  requireSameOrigin,
  frappeFetch,
} from '@/lib/api/frappe'
import { errorResponse, parseFrappeError, readMessage } from '@/lib/api/errors'
import { toSessionUser } from '@/lib/auth/session'
import type { AuthSessionDto } from '@/lib/types'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  username: z.string().trim().min(1).max(140),
  password: z.string().min(1).max(200),
})

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request)

    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials payload' }, { status: 400 })
    }

    const incomingCookie = request.headers.get('cookie') ?? ''
    const { token: csrfToken, upstream: csrfUpstream } = await requestCsrfToken(incomingCookie)

    const body = new URLSearchParams()
    body.set('usr', parsed.data.username)
    body.set('pwd', parsed.data.password)
    body.set('csrf_token', csrfToken)

    const upstream = await frappeFetch(ERP_METHODS.login, {
      method: 'POST',
      cookieHeader: incomingCookie,
      rawBody: body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        [CSRF_HEADER]: csrfToken,
      },
    })

    if (!upstream.ok) {
      const error = await parseFrappeError(upstream, 'Login failed')
      return errorResponse(error)
    }

    const dto = await readMessage<AuthSessionDto>(upstream)
    const mergedCookie = mergeCookieHeader(incomingCookie, getSetCookies(upstream))
    const { token: freshCsrf, upstream: freshCsrfUpstream } = await requestCsrfToken(mergedCookie)

    const response = NextResponse.json(
      {
        ...dto,
        user: toSessionUser(dto),
        csrf_token: freshCsrf,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )

    forwardSetCookies(csrfUpstream, response)
    forwardSetCookies(upstream, response)
    forwardSetCookies(freshCsrfUpstream, response)
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
