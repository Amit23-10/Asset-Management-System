import type { Role } from '@/lib/types'

const RULES: Array<[Role, string[]]> = [
  ['Admin', ['Administrator', 'System Manager', 'Workshop Admin', 'Workshop Administrator', 'Admin', 'CW Admin']],
  ['Guard', ['Guard', 'CW Guard']],
  ['Job Creation', ['Job Creation', 'JC', 'Job Controller', 'CW Job Creation']],
  ['CRE', ['CRE', 'CW CRE']],
  ['Service Advisor', ['Service Advisor', 'SA', 'CW Service Advisor']],
  ['Service Engineer', ['Service Engineer', 'SE', 'CW Service Engineer']],
  ['Technician', ['Technician', 'CW Technician']],
  ['QC', ['QC', 'Quality Controller', 'CW QC']],
  [
    'Parts',
    [
      'Parts',
      'CW Parts',
      'Store Keeper',
      'Picker',
      'Estimator',
      'Parts Buyer / Estimator',
      'Parts Manager',
    ],
  ],
  ['Procurement', ['Procurement', 'Procurement User', 'Procurement Manager', 'CW Procurement']],
  ['Accounts', ['Accounts', 'Accounts User', 'Accounts Manager', 'CW Accounts']],
]

export function normalizeRoles(rawRoleIds: string[], capabilities: string[] = []): Role[] {
  const raw = new Set(rawRoleIds.map((role) => role.toLowerCase().trim()))
  const caps = new Set(capabilities)
  const roles = new Set<Role>()

  for (const [role, aliases] of RULES) {
    if (aliases.some((alias) => raw.has(alias.toLowerCase()))) roles.add(role)
  }

  if (caps.has('admin.read')) roles.add('Admin')

  return [...roles]
}

export function deriveElevation(id: string, rawRoleIds: string[]) {
  const raw = new Set(rawRoleIds.map((role) => role.toLowerCase().trim()))
  return {
    isAdministrator: id === 'Administrator' || raw.has('administrator'),
    isWorkshopAdmin: raw.has('workshop admin') || raw.has('workshop administrator'),
  }
}

export function hasRole(roles: Role[], allowed: Role[]): boolean {
  return roles.some((role) => allowed.includes(role))
}

export function canAccessPrefix(roles: Role[], allowed: Role[], prefix: string, pathname: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`) ? hasRole(roles, allowed) : true
}
