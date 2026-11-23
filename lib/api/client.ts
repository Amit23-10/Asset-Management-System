'use client'

import {
  AUTH_PATHS,
  COMPANY_COOKIE_NAME,
  CSRF_HEADER,
  REQUESTED_WITH_HEADER,
  REQUESTED_WITH_VALUE,
} from '@/lib/config'
import { buildQuery } from '@/lib/api/crud-shared'
import type { RequestOptions } from '@/lib/types'

export { buildQuery }

let csrfTokenCache: string | null = null
let activityCount = 0

function emitActivity(delta: 1 | -1) {
  if (typeof window === 'undefined') return
  activityCount = Math.max(0, activityCount + delta)
  window.dispatchEvent(new CustomEvent('cw:api-activity', { detail: { delta, count: activityCount } }))
}

function emitError(message: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cw:api-error-toast', { detail: { message } }))
}

export async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache

  try {
    const response = await fetch(AUTH_PATHS.csrf, { credentials: 'same-origin' })
    if (response.ok) {
      const data = (await response.json()) as { csrf_token?: string }
      if (data.csrf_token) {
        csrfTokenCache = data.csrf_token
        return csrfTokenCache
      }
    }
  } catch {
    // Fall through to legacy fallback.
  }

  return 'none'
}

export function clearCsrfCache() {
  csrfTokenCache = null
}

export function setCompanyContext(companyId: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${COMPANY_COOKIE_NAME}=${encodeURIComponent(companyId)}; path=/; max-age=2592000; samesite=lax`
}

function getCompanyContext(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COMPANY_COOKIE_NAME}=`))
  if (!match) return ''
  return decodeURIComponent(match.slice(COMPANY_COOKIE_NAME.length + 1))
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const company = getCompanyContext()
  const csrfToken = method === 'GET' ? '' : await getCsrfToken()

  if (!options.silent) emitActivity(1)

  try {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: {
        ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        ...(company ? { 'X-CW-Company': company } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        [REQUESTED_WITH_HEADER]: REQUESTED_WITH_VALUE,
        ...(options.headers ?? {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

    const payload = (await response.json().catch(() => null)) as
      | { message?: T; error?: string }
      | null

    if (!response.ok) {
      const message = payload?.error ?? `Request failed (${response.status})`
      emitError(message)
      throw new Error(message)
    }

    if (!payload || !('message' in payload)) {
      throw new Error('Malformed API response')
    }

    return payload.message as T
  } finally {
    if (!options.silent) emitActivity(-1)
  }
}

export async function uploadFile(
  file: File,
  opts: { folder?: string; isPrivate?: boolean } = {},
): Promise<{ fileUrl: string; fileName: string; name: string }> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('The selected file exceeds the 25 MB upload limit.')
  }

  const csrfToken = await getCsrfToken()
  const form = new FormData()
  form.set('file', file)
  if (opts.folder) form.set('folder', opts.folder)
  if (opts.isPrivate !== undefined) form.set('is_private', opts.isPrivate ? '1' : '0')

  emitActivity(1)
  try {
    const response = await fetch(AUTH_PATHS.upload, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        [CSRF_HEADER]: csrfToken,
        [REQUESTED_WITH_HEADER]: REQUESTED_WITH_VALUE,
      },
      body: form,
    })

    const payload = (await response.json().catch(() => null)) as
      | { fileUrl?: string; fileName?: string; name?: string; error?: string }
      | null

    if (!response.ok || !payload?.fileUrl) {
      const message = payload?.error ?? 'File upload failed'
      emitError(message)
      throw new Error(message)
    }

    return {
      fileUrl: payload.fileUrl,
      fileName: payload.fileName ?? file.name,
      name: payload.name ?? '',
    }
  } finally {
    emitActivity(-1)
  }
}
