# AGENTS.md

AI instructions for `asset-management-ui` (Fixed Asset Management). Read this before changing code.

## Project

Next.js 16 App Router fixed-asset management UI backed by a Frappe/ERP site. Current scope: authentication, dashboard, Master, Configuration, Entry, Process modules and period-end/voucher workflows. Local preview uses the zero-dependency dev ERP (`npm run dev:erp`); production target is Frappe (Phase B).

App root: this repository (`Asset-Management-System`)
Build plan / screen specs / backend contract: `docs/04-fixed-asset-build-plan.md`
UI mockups: `docs/mockups/`
Implementation docs: `docs/01-meal-management-ui-auth.md`
CRUD utility docs: `docs/02-meal-management-ui-crud-utils.md`
App shell template docs: `docs/03-app-shell-template.md`
Older JWT spec: `docs/00-auth-erp-sso-doc.md` — historical, do not follow for this app.

## Non-negotiables

- Do not add env vars. Only `ERP_BASE_URL` exists.
- Do not add JWT, refresh tokens, `next-auth`, Auth.js, or browser token storage.
- Do not call Frappe directly from browser code. Browser calls same-origin `/api/...`.
- Do not forward cookies implicitly on server requests. Pass `cookieHeader` explicitly via helpers.
- Do not expose ERP credentials, tokens, or cookies to client components.
- Do not remove `proxy.ts`; Next.js 16 uses it instead of `middleware.ts`.
- Do not treat UI guards as authorization. Frappe RBAC and shop scoping are final boundary.
- Do not overwrite `workshop-builder-ui` or parent `docs/` files unless asked.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```

Run typecheck, lint, and build after changes. Fix all errors.

## Stack

- Next.js 16.4.6, React 19, TypeScript strict.
- Tailwind CSS v4, CSS-first config in `app/globals.css`.
- shadcn/ui base-nova, Base UI primitives, Lucide icons.
- Zod for input validation.
- `exceljs` for server-side Excel template generation and bulk import parsing only.
- No MUI, Emotion, Redux, Zustand, or React Query unless requested.

## Auth architecture

- Session: Frappe `sid` cookie, `HttpOnly`.
- CSRF: ERP `X-Frappe-CSRF-Token`, cached in browser memory.
- Browser auth calls:
  - `/api/auth/csrf`
  - `/api/auth/login`
  - `/api/auth/me`
  - `/api/auth/logout`
- ERP methods in `lib/config.ts` → `ERP_METHODS`:
  - `workshop.api.auth.csrf_token`
  - `workshop.api.auth.login`
  - `workshop.api.auth.me`
  - `workshop.api.auth.logout`
- Login payload to ERP is form-urlencoded: `usr`, `pwd`, `csrf_token`.
- Auth responses set `Cache-Control: no-store`.
- Origin checks derive app origin from request headers; no app URL env.

Flow: `login page → /api/auth/login → ERP → Set-Cookie forwarded → router.refresh() → Server Components read cookies`.

## Current file map

```text
proxy.ts                         coarse cookie gate
app/layout.tsx                   session bootstrap, font, TooltipProvider
app/(auth)/login/page.tsx        login UI
app/(app)/layout.tsx             protected layout, requireUser()
app/(app)/page.tsx               redirect to /dashboard
app/(app)/dashboard/page.tsx     post-login dashboard
components/app-shell.tsx         mobile-first sidebar, drawer, dynamic navbar
lib/navigation.ts                nav config + role filtering + active matching
hooks/use-local-storage-state.ts SSR-safe shell preferences
components/stat-card.tsx         dark session metric card
components/section-card.tsx      dashboard section card
app/error.tsx                    error boundary
app/not-found.tsx                404
app/api/auth/csrf/route.ts       CSRF bridge
app/api/auth/login/route.ts      login exchange
app/api/auth/me/route.ts         session restore
app/api/auth/logout/route.ts     logout exchange
app/api/[...path]/route.ts       ERP BFF proxy
app/api/upload/route.ts          upload_file proxy
app/api/bulk-assets/template/route.ts Excel format download
app/api/bulk-assets/import/route.ts   bulk Excel import endpoint
lib/config.ts                    env, cookie/header names, ERP methods
lib/types.ts                     DTO/session types
lib/api/frappe.ts                server ERP fetch, cookie, CSRF, origin helpers
lib/api/errors.ts                ERP error parsing
lib/api/client.ts                browser fetch wrapper, CSRF cache, events
lib/api/auth-client.ts           login/me/logout browser calls
lib/api/workshop-api.ts          typed API helper methods
lib/api/crud-shared.ts           shared CRUD types, endpoints, query helpers
lib/api/crud.ts                  browser CRUD factory
lib/api/server-crud.ts           server CRUD factory
lib/auth/session.ts              getServerAuthSession, requireUser, requireRole
lib/auth/roles.ts                role normalization/elevation
lib/auth/guards.ts               API route guards
lib/resources/masters.ts         master resource config (fields/columns/endpoints)
lib/resources/master-api.ts      cached client CRUD factory for masters
lib/format.ts                    dd-MM-yyyy display, cell text, current period helpers
lib/resources/documents.ts       configuration/entry/process resource configs
lib/resources/registry.ts        unified resource lookup (ALL_RESOURCES)
lib/bulk-assets.ts               Excel template generation + strict import validation
server/dev-erp.mjs               local dev ERP implementing asset.api.* contract
components/features/*            data-table, resource-list, resource-form, resource-select, bulk-asset-actions, period-end, voucher-post, transfer-acknowledgements
app/(app)/master/[resource]/*    master list/new/edit routes
app/(app)/configuration/[resource]/*, app/(app)/entry/[resource]/*, app/(app)/process/[resource]/*  generated list/new/edit routes
components/auth/*                session provider, login/logout UI
components/ui/*                  shadcn components
app/globals.css                  Tailwind + theme tokens
```

## Adding a feature route

1. Create page under `app/(app)/...` so it inherits `requireUser()`.
2. For role restrictions, add a layout with `requireRole([...])`:

   ```tsx
   import { requireRole } from '@/lib/auth/session'

   export default async function Layout({ children }: { children: React.ReactNode }) {
     await requireRole(['Admin'])
     return <>{children}</>
   }
   ```

3. Add the route to `lib/navigation.ts` with label, `href`, icon, and roles. Do not build nav inside the page.
4. Use Tailwind + shadcn components. Keep light surfaces, slate text, indigo accents. Mobile-first: base phone styles, then `sm:` / `lg:`.
5. Fetch server data with `serverFrappeRequest()` or `createServerCrudResource()`.
6. Fetch client data with `apiRequest()` or `createCrudResource()`.
7. Keep resource-specific endpoint maps in a small `lib/resources/*` or service module; do not inline ERP paths across components.
8. Never put ERP detail in a client component.

Example role guards:

```ts
await requireRole(['Admin'])
await requireRole(['Job Creation', 'Service Advisor', 'CRE'])
```

`isAdministrator` and `isWorkshopAdmin` bypass `requireRole`.

## API rules

Server Component / Server Action:

```ts
import { serverFrappeRequest } from '@/lib/api/frappe'
import { ERP_METHODS } from '@/lib/config'

const data = await serverFrappeRequest<MyDto>(ERP_METHODS.someMethod)
```

Client component:

```ts
import { apiRequest } from '@/lib/api/client'

const data = await apiRequest<MyDto>('/api/method/workshop.api.some.method')
```

Mutating client calls attach CSRF automatically. Query strings use `buildQuery(params)` from `lib/api/client.ts`.

API route handlers:

- Validate body with Zod.
- Call `requireSameOrigin(request)` for mutations.
- Forward upstream `Set-Cookie` with `forwardSetCookies()`.
- Return `{ error: string }` on failure via `errorResponse()`.
- Export `const dynamic = 'force-dynamic'` for auth/proxy routes.

## CRUD utilities

Use factories for resource CRUD instead of repeating request code.

Client:

```ts
import { createCrudResource } from '@/lib/api/crud'

export const partsApi = createCrudResource<Part>({
  basePath: '/api/method/workshop.api.parts',
})
```

Server:

```ts
import { createServerCrudResource } from '@/lib/api/server-crud'

export const partsResource = createServerCrudResource<Part>({
  basePath: '/api/method/workshop.api.parts',
})
```

Both expose `list`, `listAll`, `get`, `create`, `update`, `remove`, `setStatus`.

Rules:

- Never import `server-crud.ts` into client code.
- Never import `crud.ts` into Server Components.
- Use `endpoints` overrides for non-standard ERP method names.
- Use `idKey` when ERP uses a key other than `id`.
- Use `createBody` / `updateBody` / `deleteBody` / `setStatusBody` when ERP wraps payloads in `data`.
- `listAll()` assumes `page` / `pageSize` query params and `data` / `meta.total` response shape.
- Reuse `buildQuery()`, `listRows()`, `listTotal()` from `crud-shared.ts` for custom cases.
- Full docs: `docs/02-meal-management-ui-crud-utils.md`.

## App shell template

All protected pages inherit `components/app-shell.tsx` from `app/(app)/layout.tsx`. Do not add sidebar/navbar markup to feature pages.

- Workbench shell mirrors `workshop-builder-ui`: dark left sidebar, collapsible groups, dynamic breadcrumb.
- Mobile-first: hamburger drawer below `lg`, fixed dark app bar, backdrop + Escape close, body scroll lock.
- Desktop: 264px sidebar, 76px collapsed icon rail, preferences persisted via `hooks/use-local-storage-state.ts`.
- Navigation config is only `lib/navigation.ts`. Role filtering uses `visibleNavGroups()`; elevated flags bypass.
- Active item and breadcrumb use `findActiveNavItem()` with `usePathname()` + hash.
- Navbar profile dropdown lives in `components/profile-menu.tsx`: session/access/capability links, nav collapse/reset, sign out.
- Logout variants: default button and `variant="icon"`; shared action via `useLogout()`.

Full docs: `docs/03-app-shell-template.md`.

## ERP response contract

Success envelope:

```ts
{ message: T }
```

Error fields, in priority order:

```ts
_server_messages
message
exception
```

Use helpers from `lib/api/errors.ts`. Do not hand-roll parser logic.

## Headers and cookies

```ts
SESSION_COOKIE_NAME = 'sid'
COMPANY_COOKIE_NAME = 'cw_company'
CSRF_HEADER = 'X-Frappe-CSRF-Token'
COMPANY_HEADER = 'X-CW-Company'
REQUESTED_WITH_HEADER = 'X-CW-Requested-With'
```

- `sid`: ERP session, server-owned.
- `cw_company`: UI context only, never authorization.
- `X-CW-Company`: context hint; ERP must validate shop scope.
- `X-CW-Requested-With`: marker only, not a security control.

## Styling rules

- Use Tailwind utility classes.
- Use shadcn components from `components/ui/`; add more with `npx shadcn@latest add <component>`.
- Keep theme tokens in `app/globals.css`.
- Prefer semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`.
- Use slate-950 for primary actions and indigo for accents to match the source app.
- Mobile-first always: base styles for phones, then `sm:` and `lg:` enhancements.
- Keep pages responsive and keyboard accessible.
- Prefer Server Components; use `'use client'` only for interactivity.

## Security checklist

Before finishing any change, verify:

- No new env vars.
- No ERP base URL in client code.
- No direct cross-origin fetch from browser.
- No token/session in `localStorage`, `sessionStorage`, React state, or logs.
- Mutations require CSRF and origin check.
- Protected routes sit under `app/(app)/` or call `requireUser()`.
- Role-restricted routes call `requireRole()` server-side.
- Frappe still enforces RBAC and shop scoping.

## Do not

- Restore removed role feature pages unless requested.
- Add feature modules without explicit request.
- Replace cookie/CSRF auth with JWT.
- Add `NEXT_PUBLIC_*` vars.
- Use MUI patterns from `workshop-builder-ui`; mirror behavior, not its styling stack.
- Modify `package.json` deps casually. Justify new packages.
