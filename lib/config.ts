export const ERP_BASE_URL = (process.env.ERP_BASE_URL ?? 'https://cw.elfbd.com').replace(/\/$/, '')

export const SESSION_COOKIE_NAME = 'sid'
export const COMPANY_COOKIE_NAME = 'cw_company'
export const CSRF_HEADER = 'X-Frappe-CSRF-Token'
export const COMPANY_HEADER = 'X-CW-Company'
export const REQUESTED_WITH_HEADER = 'X-CW-Requested-With'
export const REQUESTED_WITH_VALUE = 'workshop-next'

export const AUTH_PATHS = {
  csrf: '/api/auth/csrf',
  login: '/api/auth/login',
  me: '/api/auth/me',
  logout: '/api/auth/logout',
  upload: '/api/upload',
} as const

export const ERP_METHODS = {
  csrfToken: '/api/method/workshop.api.auth.csrf_token',
  login: '/api/method/workshop.api.auth.login',
  me: '/api/method/workshop.api.auth.me',
  logout: '/api/method/workshop.api.auth.logout',
  navigation: '/api/method/workshop.api.portal.navigation',
  listUsers: '/api/method/workshop.api.users.list',
  listRoles: '/api/method/workshop.api.roles.list',
  createUser: '/api/method/workshop.api.users.create',
  updateUser: '/api/method/workshop.api.users.update',
  setUserStatus: '/api/method/workshop.api.users.set_status',
  heartbeat: '/api/method/workshop.api.users.heartbeat',
  registrationOcr: '/api/method/workshop.api.ocr.registration_plate',
  uploadFile: '/api/method/upload_file',
} as const
