import { cookies } from 'next/headers'
import { CSRF_HEADER, ERP_BASE_URL, ERP_METHODS } from '@/lib/config'
import { FrappeApiError, parseFrappeError, readMessage } from '@/lib/api/errors'

export type FrappeFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  rawBody?: BodyInit
  headers?: HeadersInit
  cookieHeader?: string
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${ERP_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Server-only Frappe fetch. Never forwards the browser Cookie header by accident;
 * callers must pass cookieHeader explicitly.
 */
export async function frappeFetch(path: string, options: FrappeFetchOptions = {}): Promise<Response> {
  const method = options.method ?? 'GET'
  const headers = new Headers(options.headers)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.cookieHeader) headers.set('Cookie', options.cookieHeader)

  const body =
    options.rawBody ?? (options.body !== undefined && method !== 'GET' ? JSON.stringify(options.body) : undefined)

  return fetch(resolveUrl(path), {
    method,
    headers,
    body,
    cache: 'no-store',
    redirect: 'manual',
  })
}

type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] }

export function getSetCookies(response: Response): string[] {
  const headers = response.headers as HeadersWithGetSetCookie
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie()

  const single = response.headers.get('set-cookie')
  return single ? [single] : []
}

export function forwardSetCookies(upstream: Response, target: Response): void {
  for (const cookie of getSetCookies(upstream)) {
    target.headers.append('set-cookie', cookie)
  }
}

export function mergeCookieHeader(base: string, setCookies: string[]): string {
  const jar = new Map<string, string>()

  for (const pair of base.split(';')) {
    const index = pair.indexOf('=')
    if (index < 0) continue
    jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim())
  }

  for (const setCookie of setCookies) {
    const first = setCookie.split(';')[0]
    const index = first.indexOf('=')
    if (index < 0) continue
    const name = first.slice(0, index).trim()
    const value = first.slice(index + 1).trim()
    if (value === '') jar.delete(name)
    else jar.set(name, value)
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
}

export async function serverCookieHeader(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.toString()
}

export async function requestCsrfToken(cookieHeader = ''): Promise<{ token: string; upstream: Response }> {
  const upstream = await frappeFetch(ERP_METHODS.csrfToken, { cookieHeader })

  if (!upstream.ok) {
    // Mirrors workshop-builder-ui fallback. Frappe may accept 'none' for
    // already-authenticated sessions depending on server config.
    return { token: 'none', upstream }
  }

  const payload = (await upstream.json().catch(() => null)) as
    | { message?: { csrf_token?: string } }
    | null

  return { token: payload?.message?.csrf_token ?? 'none', upstream }
}

export async function getServerCsrfToken(cookieHeader = ''): Promise<string> {
  return (await requestCsrfToken(cookieHeader)).token
}

export function csrfHeader(token: string): Record<string, string> {
  return { [CSRF_HEADER]: token }
}

function requestOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost ?? request.headers.get('host')
  const fallback = new URL(request.url)
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProto ?? fallback.protocol.replace(':', '')

  return host ? `${protocol}://${host}` : fallback.origin
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).origin === requestOrigin(request)
  } catch {
    return false
  }
}

export function requireSameOrigin(request: Request): void {
  if (!isSameOrigin(request)) {
    throw new FrappeApiError('Invalid request origin', 403)
  }
}

export async function serverFrappeRequest<T>(
  path: string,
  options: Omit<FrappeFetchOptions, 'cookieHeader'> & { silent?: boolean } = {},
): Promise<T> {
  const cookieHeader = await serverCookieHeader()
  const csrfToken = options.method && options.method !== 'GET' ? await getServerCsrfToken(cookieHeader) : ''

  const upstream = await frappeFetch(path, {
    ...options,
    cookieHeader,
    headers: {
      ...(options.headers ?? {}),
      ...(csrfToken ? csrfHeader(csrfToken) : {}),
    },
  })

  if (!upstream.ok) {
    throw await parseFrappeError(upstream, 'Request failed')
  }

  return readMessage<T>(upstream)
}
