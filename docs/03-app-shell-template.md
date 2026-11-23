# Meal Management UI — App Shell Template

**App path:** `/home/ahr/WORKPLACE/meal-management-ui`  
**Status:** Implemented  
**Scope:** Reusable mobile-first application shell: left sidebar, hamburger drawer, dynamic navbar, role-filtered navigation.  
**Reference:** `workshop-builder-ui/src/components/AppShell.tsx` — behavior mirrored, styling ported to Tailwind + shadcn/ui.

---

## 1. Purpose

`AppShell` is the layout template for every future application in this workspace. It owns:

- dark left sidebar expanded/collapsed state
- mobile hamburger drawer
- sticky page-context navbar
- breadcrumb derived from navigation config
- role-filtered navigation
- user footer and logout
- responsive spacing (`mobile-first`, `sm:`, `lg:`)

Feature pages should provide content only. They should not rebuild nav or chrome.

---

## 2. Files

| File | Purpose |
|---|---|
| `components/app-shell.tsx` | Client shell: sidebar, drawer, navbar, user footer |
| `lib/navigation.ts` | Central nav config + filtering/active-item helpers |
| `hooks/use-local-storage-state.ts` | SSR-safe localStorage state for shell preferences |
| `components/auth/logout-button.tsx` | Default and icon-only logout variants; exports `useLogout()` |
| `components/profile-menu.tsx` | Navbar profile dropdown: account, settings, sign out |
| `app/(app)/layout.tsx` | Wraps every protected page in `AppShell` |
| `components/stat-card.tsx` | Dark gradient metric card |
| `components/section-card.tsx` | Card section with header/icon |

---

## 3. Responsive behavior

Mobile is the base layout. Larger breakpoints progressively enhance it.

### Mobile (`< lg`)

- Fixed 56px dark app bar at top.
- Hamburger button opens a temporary left drawer.
- Drawer width: `min(18rem, 85vw)`.
- Backdrop closes the drawer.
- `Escape` closes the drawer.
- Body scroll locked while drawer open.
- Drawer closes on nav link click and browser `popstate`.
- Sticky navbar sits below the app bar (`top-14`).

### Desktop (`lg+`)

- Permanent dark sidebar, 264px expanded.
- Collapse toggle reduces sidebar to 76px icon rail.
- Main content padding follows sidebar width with a 200ms transition.
- Sticky navbar sits at `top-0`.
- Section groups collapsible; preference persisted.

### Sidebar palette

Mirrors workshop tokens:

```text
sidebar bg      #0F172A
page bg         #F8F9FC
accent          indigo
selected item   white/10 + left indigo accent
muted text      slate-400 / slate-500
```

---

## 4. Navigation config

All navigation lives in `lib/navigation.ts`.

```ts
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
```

Default config:

```ts
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES, exact: true },
      { label: 'Session', href: '/dashboard#session', icon: ShieldCheck, roles: ALL_ROLES, exact: true },
      { label: 'Access', href: '/dashboard#access', icon: BadgeCheck, roles: ALL_ROLES, exact: true },
      { label: 'Capabilities', href: '/dashboard#capabilities', icon: KeyRound, roles: ALL_ROLES, exact: true },
    ],
  },
]
```

Helpers:

| Helper | Purpose |
|---|---|
| `visibleNavGroups(groups, user)` | Filters items by role; elevated users bypass |
| `findActiveNavItem(groups, pathname, hash)` | Longest-match active link, hash-aware |
| `hrefPath(href)` | Strips `#fragment` |
| `hrefHash(href)` | Returns `#fragment` |

`isAdministrator` and `isWorkshopAdmin` bypass role filtering, matching `requireRole()`.

---

## 5. Dynamic navbar

The sticky navbar reads the active item from `NAV_GROUPS` via `usePathname()` and `window.location.hash`.

Example breadcrumb on `/dashboard#access`:

```text
Meal Management  ›  Workspace  ›  Access
```

If the path is deeper than the matched link, `Details` is appended:

```text
Meal Management  ›  Workspace  ›  Dashboard  ›  Details
```

No per-page navbar prop is needed. Add the route to `NAV_GROUPS` and the breadcrumb updates.

---

## 6. Hamburger drawer

Mobile top bar:

```tsx
<Button
  aria-label="Open navigation menu"
  aria-expanded={mobileOpen}
  aria-controls="mobile-navigation"
  onClick={() => setMobileOpen(true)}
>
  <Menu />
</Button>
```

Drawer:

- `role="dialog"`
- `aria-modal="true"`
- `aria-label="Navigation"`
- backdrop is a real `<button aria-label="Close navigation menu">`
- close button in drawer header

Focus is not trapped. Add a focus-trap library only if accessibility audit requires it.

---

## 7. Persistence

Shell preferences use `hooks/use-local-storage-state.ts`, built on `useSyncExternalStore`.

Keys:

```text
mm.shell.sidebar.collapsed
mm.shell.sections.v1
```

Server snapshot is always defaults:

```ts
collapsed = false
collapsedSections = {}
```

That avoids hydration mismatch. Section groups default open; after first toggle, the stored value wins.

---

## 8. Adding a feature route

1. Create `app/(app)/<feature>/page.tsx`. It inherits `AppShell` from the protected layout.
2. Add an item to `lib/navigation.ts`:

   ```ts
   {
     label: 'Part Requests',
     href: '/part-requests',
     icon: ClipboardList,
     roles: ['Parts', 'Procurement', 'Admin'],
   }
   ```

3. Use a `SectionCard` / `StatCard` or plain Tailwind markup for the page body.
4. Call `requireRole()` in a route layout if the route must be guarded server-side.
5. Do not add nav markup inside the page.

Role examples:

```ts
roles: ['Admin']
roles: ['Job Creation', 'Service Advisor', 'CRE']
roles: ALL_ROLES
```

---

## 9. Profile menu and logout

Navbar profile trigger opens `components/profile-menu.tsx`.

Menu contents:

- identity header — name, email, mapped roles
- **Account** — session details, access & roles, capabilities
- **Settings** — expand/collapse navigation, reset layout
- **Sign out** — destructive action, disabled while pending

Triggers:

```tsx
<ProfileMenu trigger="avatar" />
<ProfileMenu trigger="icon" />
```

Used in:

- mobile app bar — icon trigger
- desktop navbar — avatar trigger
- sidebar footer — keeps `LogoutButton`; default when expanded, icon when collapsed

Logout logic is shared through `useLogout()` from `components/auth/logout-button.tsx`. `LogoutButton` also supports:

```tsx
<LogoutButton />
<LogoutButton variant="icon" label="Sign out" />
```

---

## 10. Verification

From app root:

```bash
npm run typecheck
npm run lint
npm run build
```

Last verified after shell refactor:

- typecheck: passed
- lint: passed
- build: passed
