import { serverFrappeRequest } from '@/lib/api/frappe'
import {
  buildQuery,
  listRows,
  listTotal,
  resolveEndpoints,
  type CrudListParams,
  type CrudListResult,
  type CrudResourceOptions,
  type ListAllOptions,
} from '@/lib/api/crud-shared'

export type ServerCrudResource<
  T,
  TCreate,
  TUpdate,
  TDelete = unknown,
  TStatus = T,
> = {
  list(params?: CrudListParams): Promise<CrudListResult<T>>
  listAll(params?: CrudListParams, options?: ListAllOptions): Promise<T[]>
  get(id: string): Promise<T>
  create(input: TCreate): Promise<T>
  update(id: string, patch: TUpdate): Promise<T>
  remove(id: string): Promise<TDelete>
  setStatus(id: string, status: string): Promise<TStatus>
}

/**
 * Server-side CRUD factory for Server Components and Server Actions.
 * Uses `serverFrappeRequest`, which forwards cookies and CSRF and resolves
 * ERP method paths against `ERP_BASE_URL`.
 */
export function createServerCrudResource<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TDelete = unknown,
  TStatus = T,
>(options: CrudResourceOptions<TCreate, TUpdate>): ServerCrudResource<T, TCreate, TUpdate, TDelete, TStatus> {
  const endpoints = resolveEndpoints(options.basePath, options.endpoints)
  const idKey = options.idKey ?? 'id'

  async function list(params: CrudListParams = {}) {
    return serverFrappeRequest<CrudListResult<T>>(`${endpoints.list}${buildQuery(params)}`)
  }

  async function listAll(params: CrudListParams = {}, listOptions: ListAllOptions = {}) {
    const pageSize = listOptions.pageSize ?? 100
    const maxPages = listOptions.maxPages ?? 100
    const rows: T[] = []

    for (let page = 1; page <= maxPages; page += 1) {
      const result = await list({ ...params, page, pageSize })
      const pageRows = listRows(result)
      rows.push(...pageRows)

      if (pageRows.length === 0) break
      if (pageRows.length < pageSize) break

      const total = listTotal(result)
      if (typeof total === 'number' && rows.length >= total) break
    }

    return rows
  }

  async function get(id: string) {
    return serverFrappeRequest<T>(`${endpoints.get}${buildQuery({ [idKey]: id })}`)
  }

  async function create(input: TCreate) {
    return serverFrappeRequest<T>(endpoints.create, {
      method: 'POST',
      body: options.createBody ? options.createBody(input) : input,
    })
  }

  async function update(id: string, patch: TUpdate) {
    return serverFrappeRequest<T>(endpoints.update, {
      method: 'POST',
      body: options.updateBody ? options.updateBody(id, patch) : { [idKey]: id, ...patch },
    })
  }

  async function remove(id: string) {
    return serverFrappeRequest<TDelete>(endpoints.delete, {
      method: 'POST',
      body: options.deleteBody ? options.deleteBody(id) : { [idKey]: id },
    })
  }

  async function setStatus(id: string, status: string) {
    return serverFrappeRequest<TStatus>(endpoints.setStatus, {
      method: 'POST',
      body: options.setStatusBody
        ? options.setStatusBody(id, status)
        : { [idKey]: id, status },
    })
  }

  return {
    list,
    listAll,
    get,
    create,
    update,
    remove,
    setStatus,
  }
}
