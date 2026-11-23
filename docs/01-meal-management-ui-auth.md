# Meal Management UI — Authentication Implementation

**Project:** Continental Works meal management  
**App path:** `/home/ahr/WORKPLACE/meal-management-ui`  
**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui  
**Backend:** Frappe custom app `workshop` / `workshop.api.auth.*`  
**Status:** Implemented — auth + dashboard  
**Scope:** Login, session restore, logout, route guard, CSRF bridge, ERP BFF utilities, post-login dashboard. Feature modules intentionally omitted.

> This document describes the implemented cookie/CSRF design. `00-auth-erp-sso-doc.md` is an older JWT/refresh-token specification and is historical for this app.
>
> CRUD helpers for future feature modules are documented in `02-meal-management-ui-crud-utils.md`.
>
> The reusable mobile-first shell is documented in `03-app-shell-template.md`.

---

## 1. Decisions

| Topic | Choice |
|---|---|
| Session | Frappe `sid` session cookie, `HttpOnly` |
| Tokens | No JWT, no refresh token, no browser token storage |
| Server session | `getServerAuthSession()` calls `workshop.api.auth.me` via `next/headers` cookies |
| Browser → API | Same-origin Route Handlers only |
| CSRF | ERP `X-Frappe-CSRF-Token`, cached in browser memory |
| Origin check | Derived from request `host` / `x-forwarded-*`; no app URL env |
| Route gate | `proxy.ts` cookie-presence redirect |
| Authorization | Server layout/page helpers; Frappe remains final boundary |
| Env | Single variable: `ERP_BASE_URL` |

---

## 2. Environment

`.env.example` / `.env`:

```env
ERP_BASE_URL=https://continental-motor.com
```

Rules:

- `ERP_BASE_URL` is the ERP/Frappe origin, no trailing slash.
- Trailing slash is stripped in `lib/config.ts`.
- No `NEXT_PUBLIC_*` vars.
- Session cookie name fixed to `sid`.
- Company context cookie fixed to `cw_company`.

---

## 3. Backend endpoints used

Defined in `lib/config.ts` → `ERP_METHODS`.

| Method | Endpoint | Use |
|---|---|---|
| GET | `/api/method/workshop.api.auth.csrf_token` | CSRF token |
| POST | `/api/method/workshop.api.auth.login` | Credential login |
| GET | `/api/method/workshop.api.auth.me` | Session restore |
| POST | `/api/method/workshop.api.auth.logout` | Session revocation |

Login is sent to Frappe as:

```text
Content-Type: application/x-www-form-urlencoded
X-Frappe-CSRF-Token: <token>

usr=<username>&pwd=<password>&csrf_token=<token>
```

Frappe returns the standard envelope:

```ts
type AuthSessionDto = {
  ok?: boolean
  user: {
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
  capabilities: string[]
  siteName?: string
}
```

Errors may arrive as `_server_messages`, `message`, or `exception`. All are parsed by `lib/api/errors.ts`.

---

## 4. Route map

| Route | Purpose |
|---|---|
| `/login` | Public login page; redirects authenticated users to `/dashboard` |
| `/` | Protected redirect to `/dashboard` |
| `/dashboard` | Post-login dashboard built from the current ERP session |
| `/api/auth/csrf` | Browser CSRF bridge |
| `/api/auth/login` | Login exchange and cookie forwarding |
| `/api/auth/me` | Session restore |
| `/api/auth/logout` | Logout exchange and cookie clearing |
| `/api/[...path]` | Same-origin ERP BFF proxy |
| `/api/upload` | `upload_file` proxy |

`proxy.ts` treats these as public:

```ts
/login
/api/auth/csrf
/api/auth/login
/api/auth/me
/api/auth/logout
```

All other paths require `sid` cookie presence. Missing cookie:

- page route → redirect to `/login?next=...`
- `/api/*` route → `401 { error: 'Unauthorized' }`

`proxy.ts` is coarse UX gating only. Real checks use `requireUser()` / `requireRole()`.

---

## 5. Login flow

1. Browser posts JSON to `/api/auth/login`:

   ```json
   { "username": "Administrator", "password": "secret" }
   ```

2. Route Handler validates payload with Zod.
3. `requireSameOrigin(request)` checks `Origin` against derived request origin.
4. `requestCsrfToken()` calls Frappe CSRF endpoint using incoming cookies.
5. Route Handler posts form-urlencoded credentials to Frappe with `X-Frappe-CSRF-Token`.
6. Frappe `Set-Cookie` headers are forwarded to the browser.
7. Route Handler rotates CSRF using the merged cookie jar.
8. Response:

   ```ts
   {
     ...dto,
     user: SessionUser,
     csrf_token: string
   }
   ```

9. `lib/api/auth-client.ts` clears browser CSRF cache.
10. Login form calls `router.replace(next)` then `router.refresh()`. Default `next` is `/dashboard`.

Failed login returns `{ error: string }` with Frappe status or `502`.

---

## 6. Session restore

Server Components call:

```ts
import { getServerAuthSession } from '@/lib/auth/session'

const session = await getServerAuthSession()
```

Behavior:

- Reads cookies with `next/headers`.
- Calls `workshop.api.auth.me` with forwarded cookie header.
- `401` / `403` → anonymous.
- Non-OK response → anonymous.
- Valid response → `SessionUser` via `toSessionUser()`.

`requireUser()`:

```ts
const user = await requireUser()
```

Anonymous → `redirect('/login')`.

`requireRole()`:

```ts
await requireRole(['Admin'])
await requireRole(['Job Creation', 'Service Advisor', 'CRE'])
```

Bypass for `user.isAdministrator` or `user.isWorkshopAdmin`.

---

## 7. Logout flow

1. Browser posts `/api/auth/logout`.
2. Route Handler checks origin.
3. CSRF token fetched from ERP.
4. Frappe `workshop.api.auth.logout` called with cookies + CSRF header.
5. Response `{ ok: true }`.
6. `cw_company` cookie cleared locally.
7. Frappe `Set-Cookie` forwarded, clearing `sid`.
8. Browser CSRF cache cleared.
9. Client navigates to `/login` and refreshes.

Logout returns success even if ERP call fails, as long as no exception is thrown by parsing/origin checks; cookie clearing is forwarded from the upstream response.

---

## 8. Session user model

```ts
type SessionUser = {
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
```

Roles:

```ts
Admin
Guard
Job Creation
CRE
Service Advisor
Service Engineer
Technician
QC
Parts
Procurement
Accounts
```

`lib/auth/roles.ts` normalizes raw ERP role IDs and capability `admin.read` into frontend roles. It also derives:

```ts
isAdministrator = id === 'Administrator' || raw role includes 'Administrator'
isWorkshopAdmin = raw role includes 'Workshop Admin' | 'Workshop Administrator'
```

Client components read identity from `SessionProvider`:

```tsx
import { useSessionUser } from '@/components/auth/session-provider'

const user = useSessionUser()
```

No token is exposed to client code.

---

## 9. CSRF

Server:

- `requestCsrfToken(cookieHeader)` fetches ERP CSRF.
- Missing/invalid endpoint response falls back to `'none'`, matching the Vite app.
- Mutating route handlers send `X-Frappe-CSRF-Token`.
- `isSameOrigin()` compares `Origin` with request-derived origin.
- All auth responses set `Cache-Control: no-store`.

Browser:

- `getCsrfToken()` caches token in module memory.
- Mutating `apiRequest()` calls attach CSRF header.
- `clearCsrfCache()` runs after login and logout.
- API activity/error events mirror Vite app:
  - `cw:api-activity`
  - `cw:api-error-toast`

---

## 10. API proxy

Browser calls same-origin paths. Example:

```ts
import { workshopApi } from '@/lib/api/workshop-api'

const users = await workshopApi.listUsers({ page: 1, pageSize: 20 })
```

`app/api/[...path]/route.ts`:

- Allows `GET`, `POST`, `PATCH`, `DELETE`.
- Blocks `..` and `.` path segments.
- Blocks `/api/auth/*` and `/api/upload` proxy targets.
- Forwards cookies, content type, company header, and CSRF header.
- Forwards upstream `Set-Cookie`.
- Sets `Cache-Control: no-store`.

Server Components can bypass the browser proxy:

```ts
import { serverFrappeRequest } from '@/lib/api/frappe'
import { ERP_METHODS } from '@/lib/config'

const navigation = await serverFrappeRequest<WorkshopNavigation>(ERP_METHODS.navigation)
```

---

## 11. UI layer

Auth + dashboard UI:

| File | Purpose |
|---|---|
| `app/layout.tsx` | Session bootstrap, font, `TooltipProvider` |
| `app/(auth)/login/page.tsx` | Login screen; post-login redirect to `/dashboard` |
| `components/auth/login-form.tsx` | shadcn form, submit, error alert |
| `components/auth/logout-button.tsx` | shadcn logout button |
| `components/auth/session-provider.tsx` | Client session context |
| `app/(app)/layout.tsx` | `requireUser()` guard |
| `app/(app)/page.tsx` | Protected redirect to `/dashboard` |
| `app/(app)/dashboard/page.tsx` | Dashboard built from `SessionUser` |
| `components/app-shell.tsx` | Mobile-first sidebar, hamburger drawer, dynamic navbar |
| `lib/navigation.ts` | Nav config + role filtering + active matching |
| `hooks/use-local-storage-state.ts` | SSR-safe shell preferences |
| `components/stat-card.tsx` | Dark gradient session metric card |
| `components/section-card.tsx` | Dashboard section card |
| `app/error.tsx` | Error boundary |
| `app/not-found.tsx` | 404 screen |

Theme:

- Tailwind CSS v4 via `app/globals.css`.
- shadcn/ui base-nova style with Base UI primitives.
- Slate/indigo design tokens.
- Mobile-first layout: hamburger drawer below `lg`, permanent sidebar on desktop.
- Plus Jakarta Sans via `next/font/google`.

---

## 12. Security notes

- Frappe is the authorization boundary. Next.js guards improve UX only.
- Browser never talks directly to ERP.
- No JWT, no refresh token, no `localStorage` session.
- `sid` stays `HttpOnly`.
- `X-CW-Company` is context only; ERP must validate shop scope.
- `X-CW-Requested-With` is a client marker, not an authorization control.
- Mutation origin checks reject cross-origin requests when `Origin` is present.
- Unknown CSRF endpoint responses fall back to `'none'`; ERP must reject invalid CSRF when required.

---

## 13. Verification

Run from app root:

```bash
npm run typecheck
npm run lint
npm run build
```

Last verified build:

```text
Next.js 16.4.6
Routes: /, /dashboard, /login, /api/auth/csrf, /api/auth/login,
        /api/auth/me, /api/auth/logout,
        /api/[...path], /api/upload, /_not-found
```

Production dependency audit: `0 vulnerabilities`. Dev-only advisories remain in `shadcn` CLI transitive dependencies.
