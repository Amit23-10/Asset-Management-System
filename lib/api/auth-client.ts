'use client'

import { AUTH_PATHS, REQUESTED_WITH_HEADER, REQUESTED_WITH_VALUE } from '@/lib/config'
import { clearCsrfCache } from '@/lib/api/client'
import type { AuthSessionDto, SessionUser } from '@/lib/types'

export type LoginResult = Omit<AuthSessionDto, 'user'> & {
  user: SessionUser
  csrf_token?: string
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { error?: string } & T | null
  if (!response.ok) {
    throw new Error(payload?.error ?? fallback)
  }
  if (!payload) throw new Error('Malformed API response')
  return payload
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const response = await fetch(AUTH_PATHS.login, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      [REQUESTED_WITH_HEADER]: REQUESTED_WITH_VALUE,
    },
    body: JSON.stringify({ username, password }),
  })

  const result = await readJson<LoginResult>(response, 'Login failed')
  clearCsrfCache()
  return result
}

export async function fetchSession(): Promise<SessionUser | null> {
  const response = await fetch(AUTH_PATHS.me, {
    credentials: 'same-origin',
  })
  const payload = await readJson<{ user: SessionUser | null }>(response, 'Failed to restore session')
  return payload.user
}

export async function logout(): Promise<void> {
  try {
    await fetch(AUTH_PATHS.logout, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { [REQUESTED_WITH_HEADER]: REQUESTED_WITH_VALUE },
    })
  } finally {
    clearCsrfCache()
  }
}
