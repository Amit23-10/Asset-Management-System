# Meal Management UI — CRUD Utility Functions

**App path:** `/home/ahr/WORKPLACE/meal-management-ui`  
**Status:** Implemented  
**Scope:** Reusable CRUD helpers for future ERP-backed feature modules. No feature module is added yet.  
**Related:** `01-meal-management-ui-auth.md`

---

## 1. Purpose

These helpers remove repetitive list/get/create/update/delete/status plumbing from feature code. They keep the auth contract intact:

- Browser code never calls ERP directly.
- Server code never forwards cookies implicitly.
- CSRF, company context, ERP error parsing, and `Cache-Control: no-store` stay centralized.
- Feature code supplies only endpoint paths, types, and optional body transforms.

---

## 2. Files

| File | Environment | Purpose |
|---|---|---|
| `lib/api/crud-shared.ts` | shared | Types, endpoint resolver, query builder, list helpers, ERP body wrappers |
| `lib/api/crud.ts` | client | `createCrudResource()` using `apiRequest()` through the BFF proxy |
| `lib/api/server-crud.ts` | server | `createServerCrudResource()` using `serverFrappeRequest()` |
| `lib/api/client.ts` | client | Re-exports `buildQuery()` for existing callers |
| `lib/api/workshop-api.ts` | client | Existing typed API helpers; unchanged |

`lib/api/server-crud.ts` imports `next/headers`. Never import it into a `'use client'` file.

---

## 3. Shared API

Import from `@/lib/api/crud-shared`.

### `resolveEndpoints(basePath, overrides?)`

Builds ERP method paths from a base path.

```ts
resolveEndpoints('/api/method/workshop.api.parts')
```

Result:

```ts
{
  list:      '/api/method/workshop.api.parts.list',
  get:       '/api/method/workshop.api.parts.get',
  create:    '/api/method/workshop.api.parts.create',
  update:    '/api/method/workshop.api.parts.update',
  delete:    '/api/method/workshop.api.parts.delete',
  setStatus: '/api/method/workshop.api.parts.set_status',
}
```

Override only methods that differ:

```ts
resolveEndpoints('/api/method/workshop.api.parts', {
  get: '/api/method/workshop.api.parts.details',
  delete: '/api/method/workshop.api.parts.archive',
})
```

### `buildQuery(params)`

Serializes query values. Skips `undefined`, `null`, and `''`.

```ts
buildQuery({ search: 'oil filter', page: 1, pageSize: 20, active: true })
// '?search=oil+filter&page=1&pageSize=20&active=true'
```

Also re-exported from `@/lib/api/client` for existing client code.

### `listRows(result)` / `listTotal(result)`

Normalize both ERP list shapes:

```ts
type CrudListResult<T> = T[] | { data?: T[]; meta?: { total?: number; ... } }
```

```ts
const rows = listRows(response)
const total = listTotal(response)
```

### ERP body wrappers

Some ERP methods expect data wrapped in `data`:

```ts
import {
  erpDataBody,
  erpIdDataBody,
} from '@/lib/api/crud-shared'

erpDataBody({ name: 'Oil filter' })
// { data: { name: 'Oil filter' } }

erpIdDataBody('PART-001', { name: 'Oil filter' })
// { id: 'PART-001', data: { name: 'Oil filter' } }
```

Use them through `createBody` / `updateBody` options.

---

## 4. Resource options

Both factories accept the same options:

```ts
type CrudResourceOptions<TCreate, TUpdate> = {
  basePath: string
  endpoints?: Partial<{
    list: string
    get: string
    create: string
    update: string
    delete: string
    setStatus: string
  }>
  idKey?: string                       // default 'id'
  createBody?: (input: TCreate) => unknown
  updateBody?: (id: string, patch: TUpdate) => unknown
  deleteBody?: (id: string) => unknown
  setStatusBody?: (id: string, status: string) => unknown
  silent?: boolean                     // client only
}
```

Default bodies:

| Method | Body |
|---|---|
| `create(input)` | `input` |
| `update(id, patch)` | `{ [idKey]: id, ...patch }` |
| `remove(id)` | `{ [idKey]: id }` |
| `setStatus(id, status)` | `{ [idKey]: id, status }` |

`get(id)` appends `?{idKey}={id}` to the `get` endpoint.

`list(params)` appends `buildQuery(params)` to the `list` endpoint.

---

## 5. Browser CRUD

Import from `@/lib/api/crud`.

```ts
import { createCrudResource } from '@/lib/api/crud'

type Part = {
  id: string
  name: string
  status: string
}

export const partsApi = createCrudResource<Part>({
  basePath: '/api/method/workshop.api.parts',
})
```

Generated methods:

```ts
partsApi.list({ search: 'oil', page: 1, pageSize: 20 })
partsApi.listAll({ status: 'active' })
partsApi.get('PART-001')
partsApi.create({ name: 'Oil filter', status: 'active' })
partsApi.update('PART-001', { name: 'Oil filter v2' })
partsApi.remove('PART-001')
partsApi.setStatus('PART-001', 'inactive')
```

Notes:

- All calls go to same-origin `/api/method/...` paths through `app/api/[...path]/route.ts`.
- Mutating calls attach the in-memory CSRF token.
- `X-CW-Company` and `X-CW-Requested-With` are added by `apiRequest()`.
- Activity/error events fire unless `silent: true`.
- `listAll()` pages with `page` / `pageSize`, defaults `100` per page and `100` max pages.

### Custom ERP body shape

```ts
export const partsApi = createCrudResource<Part>({
  basePath: '/api/method/workshop.api.parts',
  createBody: (input) => ({ data: input }),
  updateBody: (id, patch) => ({ id, data: patch }),
})
```

### Custom endpoints

```ts
export const issueApi = createCrudResource<Issue>({
  basePath: '/api/method/workshop.api.issues',
  endpoints: {
    get: '/api/method/workshop.api.issues.details',
    delete: '/api/method/workshop.api.issues.archive',
    setStatus: '/api/method/workshop.api.issues.change_status',
  },
  idKey: 'issue_id',
})
```

### Silent polling

```ts
export const heartbeatApi = createCrudResource<Heartbeat>({
  basePath: '/api/method/workshop.api.heartbeat',
  silent: true,
})
```

---

## 6. Server CRUD

Import from `@/lib/api/server-crud`.

```ts
import { createServerCrudResource } from '@/lib/api/server-crud'
import { ERP_METHODS } from '@/lib/config'

type Part = { id: string; name: string }

const partsResource = createServerCrudResource<Part>({
  basePath: '/api/method/workshop.api.parts',
})

export async function loadParts() {
  return partsResource.listAll({ status: 'active' })
}
```

Use in a Server Component:

```tsx
import { partsResource } from '@/lib/resources/parts'

export default async function PartsPage() {
  const parts = await partsResource.list()
  return <pre>{JSON.stringify(parts, null, 2)}</pre>
}
```

Server notes:

- Uses `serverFrappeRequest()` from `lib/api/frappe.ts`.
- Reads cookies via `next/headers`.
- Adds CSRF header for non-GET calls.
- Throws `FrappeApiError` on ERP failure.
- Resolves relative paths against `ERP_BASE_URL`.
- `silent` is ignored; server requests emit no browser events.

---

## 7. Pagination contract

`listAll()` assumes ERP list methods accept:

```ts
{ page: number; pageSize: number }
```

…and return either:

```ts
T[]
// or
{ data: T[]; meta: { total: number } }
```

Stop conditions:

- empty page
- page shorter than `pageSize`
- accumulated rows reach `meta.total`
- `maxPages` reached

If an ERP resource uses different pagination keys, call `list()` in a feature-specific loop instead of `listAll()`.

---

## 8. Security rules

- Browser CRUD factories are client-only; server CRUD factories are server-only.
- Do not pass ERP credentials, CSRF tokens, or session cookies into feature code.
- Do not call ERP URLs directly from client components.
- ERP remains the authorization boundary; `requireUser()` / `requireRole()` only guard UX and route entry.
- Do not add env vars. `ERP_BASE_URL` remains the only configuration value.
- Keep ERP method paths centralized in `lib/config.ts` when reused, or in a resource module when resource-specific.

---

## 9. Verification

From app root:

```bash
npm run typecheck
npm run lint
npm run build
```

Last verified after CRUD utility addition:

- typecheck: passed
- lint: passed
- production build: passed
