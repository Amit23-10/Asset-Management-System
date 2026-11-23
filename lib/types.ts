export type Role =
  | 'Admin'
  | 'Guard'
  | 'Job Creation'
  | 'CRE'
  | 'Service Advisor'
  | 'Service Engineer'
  | 'Technician'
  | 'QC'
  | 'Parts'
  | 'Procurement'
  | 'Accounts'

export type CWUserDto = {
  id: string
  fullName: string
  email: string
  mobile: string
  roleIds: string[]
  shopIds: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export type AuthSessionDto = {
  ok?: boolean
  user: CWUserDto
  capabilities: string[]
  siteName?: string
}

export type SessionUser = {
  id: string
  name: string
  email: string
  roles: Role[]
  rawRoleIds: string[]
  capabilities: string[]
  shopIds: string[]
  siteName?: string
  isAdministrator: boolean
  isWorkshopAdmin: boolean
}

export type Session =
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'anonymous'; user: null }

export type WorkshopNavigation = {
  companies: Array<{ id: string; name: string; currency?: string }>
  shops: Array<{
    id: string
    name: string
    companyId?: string
    type: string
    status: string
  }>
  companyIds: string[]
  shopIds: string[]
  capabilities: string[]
}

export type ApiListResponse<T> = {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    [key: string]: number
  }
}

export type CWRoleDto = {
  id: string
  name: string
  description?: string
}

export type RegistrationOcrResult = {
  fileId: string
  fileUrl: string
  rawText: string
  registrationNo: string
  components: {
    city: string
    region: string
    vehicleClass: string
    series: string
    number: string
  }
  confidence: number
  engine: string
  formatValid: boolean
  requiresConfirmation: boolean
  needsRetake: boolean
}

export type QueryValue = string | number | boolean | null | undefined

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  silent?: boolean
}
