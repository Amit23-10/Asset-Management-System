import { NextRequest, NextResponse } from 'next/server'
import { CSRF_HEADER, COMPANY_HEADER } from '@/lib/config'
import {
  forwardSetCookies,
  frappeFetch,
  getServerCsrfToken,
  requireSameOrigin,
} from '@/lib/api/frappe'
import { errorResponse } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const

type RouteContext = { params: Promise<{ path: string[] }> }

async function handler(request: NextRequest, context: RouteContext) {
  try {
    requireSameOrigin(request)

    const method = request.method
    if (!METHODS.includes(method as (typeof METHODS)[number])) {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    const { path } = await context.params
    if (path.some((segment) => segment === '..' || segment === '.')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const targetPath = `/api/${path.join('/')}${request.nextUrl.search}`
    if (!targetPath.startsWith('/api/') || targetPath.startsWith('/api/auth/') || targetPath.startsWith('/api/upload')) {
      return NextResponse.json({ error: 'Forbidden path' }, { status: 403 })
    }

    const cookieHeader = request.headers.get('cookie') ?? ''
    const contentType = request.headers.get('content-type')
    const company = request.headers.get(companyHeaderKey())
    const providedCsrf = request.headers.get(csrfHeaderKey())

    const csrfToken =
      method === 'GET' ? providedCsrf ?? '' : providedCsrf ?? (await getServerCsrfToken(cookieHeader))

    const headers: Record<string, string> = {}
    if (contentType) headers['Content-Type'] = contentType
    if (company) headers[COMPANY_HEADER] = company
    if (csrfToken) headers[CSRF_HEADER] = csrfToken

    const body = method === 'GET' ? undefined : await request.arrayBuffer()

    const upstream = await frappeFetch(targetPath, {
      method: method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
      cookieHeader,
      headers,
      ...(body && body.byteLength > 0 ? { rawBody: body } : {}),
    })

    const response = new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    })

    forwardSetCookies(upstream, response)
    return response
  } catch (error) {
    return errorResponse(error)
  }
}

function companyHeaderKey() {
  return COMPANY_HEADER.toLowerCase()
}

function csrfHeaderKey() {
  return CSRF_HEADER.toLowerCase()
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
