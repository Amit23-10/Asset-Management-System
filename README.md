# Asset Management UI

Next.js 16 App Router auth starter for Continental Works meal operations. Mirrors `workshop-builder-ui` authentication and API utilities. UI uses Tailwind CSS v4 + shadcn/ui.

Authentication plus a post-login dashboard are implemented. Sign-in lands on `/dashboard`; protected root redirects there. Add feature routes later.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

Only env var: `ERP_BASE_URL` — ERP/Frappe site origin. Session cookie name fixed to `sid`.

## Auth flow

1. Root layout calls `getServerAuthSession()` → `workshop.api.auth.me` with forwarded cookies.
2. No session on protected route → `requireUser()` redirects to `/login?next=...`.
3. Login form posts to `/api/auth/login`.
4. Route Handler fetches CSRF from Frappe, posts `usr`/`pwd`/`csrf_token` form-urlencoded, forwards Frappe `Set-Cookie`, rotates CSRF, returns normalized `SessionUser`.
5. `router.refresh()` re-renders Server Components with new cookies.
6. Logout posts `/api/auth/logout`, revokes via Frappe, forwards cookie clearing.
7. `proxy.ts` is a coarse cookie-presence gate. Real checks live in layouts/pages/route handlers.

No JWT in browser storage. Frappe session cookie stays `HttpOnly`.

## File map

```text
proxy.ts                         coarse route gate
app/layout.tsx                   session bootstrap + TooltipProvider
app/(auth)/login/page.tsx        login screen
app/(app)/layout.tsx             protected layout
app/(app)/page.tsx               redirect to /dashboard
app/(app)/dashboard/page.tsx     post-login dashboard
components/app-shell.tsx         mobile-first sidebar, drawer, dynamic navbar
components/profile-menu.tsx      navbar profile dropdown: account, settings, sign out
lib/navigation.ts                nav config + role filtering + active matching
hooks/use-local-storage-state.ts SSR-safe shell preferences
components/stat-card.tsx         dark session metric card
components/section-card.tsx      dashboard section card
app/api/auth/csrf/route.ts       CSRF bridge
app/api/auth/login/route.ts      login bridge + cookie forwarding
app/api/auth/me/route.ts         session restore
app/api/auth/logout/route.ts     logout bridge
app/api/[...path]/route.ts       generic ERP BFF proxy
app/api/upload/route.ts          upload_file proxy
lib/api/frappe.ts                server ERP fetch, CSRF, cookie helpers
lib/api/client.ts                browser fetch wrapper, CSRF cache, events
lib/api/auth-client.ts           login / me / logout browser calls
lib/api/workshop-api.ts          typed API helpers
lib/api/crud-shared.ts           shared CRUD types, endpoints, query helpers
lib/api/crud.ts                  browser CRUD factory
lib/api/server-crud.ts           server CRUD factory
lib/auth/session.ts              getServerAuthSession, requireUser, requireRole
lib/auth/roles.ts                ERP role → frontend role normalization
lib/api/errors.ts                ERP error parsing
components/auth/*                session provider, login form, logout button
components/ui/*                  shadcn/ui components
app/globals.css                  Tailwind v4 + shadcn tokens
```

## Auth helpers

```ts
import { requireUser, requireRole } from '@/lib/auth/session'

const user = await requireUser()
await requireRole(['Admin'])
```

`isAdministrator` and `isWorkshopAdmin` bypass `requireRole`. ERP remains final authorization boundary.

## CRUD utilities

Reusable CRUD factories exist for future feature modules:

```ts
import { createCrudResource } from '@/lib/api/crud'

export const partsApi = createCrudResource<Part>({
  basePath: '/api/method/workshop.api.parts',
})

await partsApi.list({ page: 1, pageSize: 20 })
await partsApi.get('PART-001')
await partsApi.create({ name: 'Oil filter' })
```

Server Components / Actions use `createServerCrudResource()` from `lib/api/server-crud.ts`. Shared types and helpers live in `lib/api/crud-shared.ts`.

Full docs: `docs/02-meal-management-ui-crud-utils.md`.

## App shell template

All protected pages inherit `components/app-shell.tsx` from `app/(app)/layout.tsx`. It provides the workshop-style dark sidebar, mobile hamburger drawer, collapsible nav groups, dynamic breadcrumb, and profile menu with account/settings/sign-out actions.

Add feature links only in `lib/navigation.ts`. Full docs: `docs/03-app-shell-template.md`.

## Styling

- Tailwind CSS v4, CSS-first config in `app/globals.css`.
- shadcn/ui base-nova with Base UI primitives and Lucide icons.
- Slate sidebar/page tokens, indigo accent, Plus Jakarta Sans.
- Mobile-first utilities: base styles target phones, then `sm:` and `lg:` enhance.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # production server
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```
