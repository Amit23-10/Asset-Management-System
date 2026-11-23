import { redirect } from 'next/navigation'
import {
  ERP_METHODS,
} from '@/lib/config'
import {
  frappeFetch,
  serverCookieHeader,
} from '@/lib/api/frappe'
import { readMessage } from '@/lib/api/errors'
import { deriveElevation, normalizeRoles } from '@/lib/auth/roles'
import type { AuthSessionDto, Role, Session, SessionUser } from '@/lib/types'

export function toSessionUser(session: AuthSessionDto): SessionUser {
  const rawRoleIds = session.user.roleIds ?? []
  const capabilities = session.capabilities ?? []
  const elevation = deriveElevation(session.user.id, rawRoleIds)

  return {
    id: session.user.id,
    name: session.user.fullName || session.user.id,
    email: session.user.email,
    roles: normalizeRoles(rawRoleIds, capabilities),
    rawRoleIds,
    capabilities,
    shopIds: session.user.shopIds ?? [],
    siteName: session.siteName,
    ...elevation,
  }
}

const ANONYMOUS: Session = { status: 'anonymous', user: null }

/**
 * Server-side session discovery. No client bootstrap gate required.
 */
export async function getServerAuthSession(): Promise<Session> {
  try {
    const cookieHeader = await serverCookieHeader()
    const upstream = await frappeFetch(ERP_METHODS.me, { cookieHeader })

    if (upstream.status === 401 || upstream.status === 403) return ANONYMOUS
    if (!upstream.ok) return ANONYMOUS

    const dto = await readMessage<AuthSessionDto>(upstream)
    if (!dto?.user?.id) return ANONYMOUS

    return { status: 'authenticated', user: toSessionUser(dto) }
  } catch {
    return ANONYMOUS
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getServerAuthSession()
  if (session.status === 'anonymous') redirect('/login')
  return session.user
}

export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await requireUser()

  if (user.isAdministrator || user.isWorkshopAdmin) return user
  if (user.roles.some((role) => allowed.includes(role))) return user

  redirect('/')
}
