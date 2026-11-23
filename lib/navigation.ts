import {
  BadgeCheck,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { hasRole } from '@/lib/auth/roles'
import type { Role, SessionUser } from '@/lib/types'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
  exact?: boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const ALL_ROLES: Role[] = [
  'Admin',
  'Guard',
  'Job Creation',
  'CRE',
  'Service Advisor',
  'Service Engineer',
  'Technician',
  'QC',
  'Parts',
  'Procurement',
  'Accounts',
]

/**
 * Template navigation. Add groups/items here as feature routes land.
 * Items are role-filtered by the session user; elevated flags bypass the list.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ALL_ROLES,
        exact: true,
      },
      {
        label: 'Session',
        href: '/dashboard#session',
        icon: ShieldCheck,
        roles: ALL_ROLES,
        exact: true,
      },
      {
        label: 'Access',
        href: '/dashboard#access',
        icon: BadgeCheck,
        roles: ALL_ROLES,
        exact: true,
      },
      {
        label: 'Capabilities',
        href: '/dashboard#capabilities',
        icon: KeyRound,
        roles: ALL_ROLES,
        exact: true,
      },
    ],
  },
]

export function hrefPath(href: string): string {
  return href.split('#')[0]
}

export function hrefHash(href: string): string {
  const index = href.indexOf('#')
  return index >= 0 ? href.slice(index) : ''
}

export function visibleNavGroups(groups: NavGroup[], user: SessionUser): NavGroup[] {
  const elevated = user.isAdministrator || user.isWorkshopAdmin

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => elevated || item.roles.length === 0 || hasRole(user.roles, item.roles),
      ),
    }))
    .filter((group) => group.items.length > 0)
}

export function findActiveNavItem(
  groups: NavGroup[],
  pathname: string,
  hash = '',
): NavItem | undefined {
  const candidates = groups.flatMap((group) => group.items)

  const matches = candidates.filter((item) => {
    const path = hrefPath(item.href)
    const samePath =
      pathname === path || (!item.exact && pathname.startsWith(`${path}/`))

    if (!samePath) return false

    const itemHash = hrefHash(item.href)
    return !itemHash || hash === itemHash
  })

  return matches.sort((a, b) => {
    const hashDiff = hrefHash(b.href).length - hrefHash(a.href).length
    if (hashDiff) return hashDiff
    return hrefPath(b.href).length - hrefPath(a.href).length
  })[0]
}
