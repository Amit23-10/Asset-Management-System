import type { QueryValue } from '@/lib/types'

export type CrudEndpoints = {
  list: string
  get: string
  create: string
  update: string
  delete: string
  setStatus: string
}

export type CrudEndpointOverrides = Partial<CrudEndpoints>

export type CrudListParams = Record<string, QueryValue>

export type ListEnvelope<T> = {
  data?: T[]
  meta?: {
    total?: number
    [key: string]: unknown
  }
}

export type CrudListResult<T> = T[] | ListEnvelope<T>

export type CrudResourceOptions<TCreate, TUpdate> = {
  /** Base ERP method path, e.g. `/api/method/workshop.api.parts`. */
  basePath: string
  /** Override only the methods the ERP resource actually exposes. */
  endpoints?: CrudEndpointOverrides
  /** Query/body key used by `get`, `update`, `delete`, `setStatus`. Default `id`. */
  idKey?: string
  /** Transform create input to ERP body. Default: input as-is. */
  createBody?: (input: TCreate) => unknown
  /** Transform update input to ERP body. Default: `{ [idKey]: id, ...patch }`. */
  updateBody?: (id: string, patch: TUpdate) => unknown
  /** Transform delete input to ERP body. Default: `{ id }`. */
  deleteBody?: (id: string) => unknown
  /** Transform status input to ERP body. Default: `{ id, status }`. */
  setStatusBody?: (id: string, status: string) => unknown
  /** Suppress global activity/error events on browser calls. */
  silent?: boolean
}

export type ListAllOptions = {
  pageSize?: number
  maxPages?: number
}

export function resolveEndpoints(
  basePath: string,
  overrides: CrudEndpointOverrides = {},
): CrudEndpoints {
  const base = basePath.replace(/\/$/, '')
  const suffix = (name: string) => `${base}.${name}`

  return {
    list: overrides.list ?? suffix('list'),
    get: overrides.get ?? suffix('get'),
    create: overrides.create ?? suffix('create'),
    update: overrides.update ?? suffix('update'),
    delete: overrides.delete ?? suffix('delete'),
    setStatus: overrides.setStatus ?? suffix('set_status'),
  }
}

export function buildQuery(params: Record<string, QueryValue>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export function listRows<T>(result: CrudListResult<T>): T[] {
  if (Array.isArray(result)) return result
  return result?.data ?? []
}

export function listTotal<T>(result: CrudListResult<T>): number | undefined {
  if (Array.isArray(result)) return undefined
  const total = result?.meta?.total
  return typeof total === 'number' ? total : undefined
}

/** ERP body style used by parts, vendors, purchase orders: `{ data: input }`. */
export function erpDataBody<T>(data: T) {
  return { data }
}

/** ERP body style used by parts, vendors, purchase orders: `{ id, data }`. */
export function erpIdDataBody<T>(id: string, data: T) {
  return { id, data }
}
