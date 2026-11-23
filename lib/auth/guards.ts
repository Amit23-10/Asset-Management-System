import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/roles'
import type { Role, SessionUser } from '@/lib/types'

export type ApiGuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }

export async function requireApiUser(): Promise<ApiGuardResult> {
  const session = await getServerAuthSession()
  if (session.status === 'anonymous') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true, user: session.user }
}

export async function requireApiRole(allowed: Role[]): Promise<ApiGuardResult> {
  const result = await requireApiUser()
  if (!result.ok) return result

  const { user } = result
  if (user.isAdministrator || user.isWorkshopAdmin || hasRole(user.roles, allowed)) return result

  return {
    ok: false,
    response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  }
}
