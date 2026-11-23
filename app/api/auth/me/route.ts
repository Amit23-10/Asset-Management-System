import { NextRequest, NextResponse } from 'next/server'
import { ERP_METHODS } from '@/lib/config'
import { forwardSetCookies, frappeFetch } from '@/lib/api/frappe'
import { errorResponse, parseFrappeError, readMessage } from '@/lib/api/errors'
import { toSessionUser } from '@/lib/auth/session'
import type { AuthSessionDto } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const upstream = await frappeFetch(ERP_METHODS.me, { cookieHeader })

    if (upstream.status === 401 || upstream.status === 403) {
      const response = NextResponse.json(
        { user: null },
        { headers: { 'Cache-Control': 'no-store' } },
      )
      forwardSetCookies(upstream, response)
      return response
    }

    if (!upstream.ok) {
      throw await parseFrappeError(upstream, 'Failed to restore session')
    }

    const dto = await readMessage<AuthSessionDto>(upstream)
    const response = NextResponse.json(
      { user: toSessionUser(dto) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
    forwardSetCookies(upstream, response)
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
