import {
  ArchiveRestore,
  ArrowLeftRight,
  BadgeCheck,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  Hash,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  PackagePlus,
  Percent,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Tags,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  Wrench,
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
  {
    label: 'Master',
    items: [
      { label: 'Department', href: '/master/departments', icon: Building2, roles: ALL_ROLES },
      { label: 'Asset Group', href: '/master/asset-groups', icon: Boxes, roles: ALL_ROLES },
      { label: 'Asset Sub Group', href: '/master/asset-sub-groups', icon: Layers, roles: ALL_ROLES },
      { label: 'Vendor', href: '/master/vendors', icon: Truck, roles: ALL_ROLES },
      { label: 'Branch', href: '/master/branches', icon: Landmark, roles: ALL_ROLES },
      { label: 'Fixed Asset User', href: '/master/asset-users', icon: Users, roles: ALL_ROLES },
      { label: 'Brand', href: '/master/brands', icon: Tags, roles: ALL_ROLES },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Organization Policy', href: '/configuration/organization-policy', icon: Settings2, roles: ALL_ROLES },
      { label: 'Asset Auto ID', href: '/configuration/asset-autoid', icon: Hash, roles: ALL_ROLES },
      { label: 'Voucher Configuration', href: '/configuration/voucher-config', icon: ReceiptText, roles: ALL_ROLES },
    ],
  },
  {
    label: 'Entry',
    items: [
      { label: 'Opening Asset Entry', href: '/entry/opening-assets', icon: ArchiveRestore, roles: ALL_ROLES },
      { label: 'New Asset Entry', href: '/entry/new-assets', icon: PackagePlus, roles: ALL_ROLES },
    ],
  },
  {
    label: 'Process',
    items: [
      { label: 'Asset Transfer', href: '/process/transfers', icon: ArrowLeftRight, roles: ALL_ROLES },
      { label: 'Transfer Acknowledgement', href: '/process/transfer-acknowledgements', icon: ClipboardCheck, roles: ALL_ROLES },
      { label: 'Asset Disposal', href: '/process/disposals', icon: Trash2, roles: ALL_ROLES },
      { label: 'Voucher Post', href: '/process/voucher-post', icon: FileCheck2, roles: ALL_ROLES },
      { label: 'Asset Revaluation', href: '/process/revaluations', icon: TrendingUp, roles: ALL_ROLES },
      { label: 'Asset Overhaul', href: '/process/overhauls', icon: Wrench, roles: ALL_ROLES },
      { label: 'Depreciation Rate Change', href: '/process/rate-changes', icon: Percent, roles: ALL_ROLES },
      { label: 'Period End Process', href: '/process/period-end', icon: CalendarClock, roles: ALL_ROLES },
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
