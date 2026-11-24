# Fixed Asset Module — Build Plan & Project Documentation

Status: **UI complete; Frappe-only integration (mock/dev ERP removed). Backend API implementation pending on Frappe site.**
Last updated: 2026-11-24
Owner: Amit23-10
Companion rules: `AGENTS.md` (non-negotiables), `docs/01..03` (auth, CRUD, shell).

This document is the single source of truth for: what already exists, what we are
building (derived from the 14 UI mockups in `docs/mockups/`), the order we build it
in, and the engineering do / don't rules.

> Note on mockups: the planning session extracted screen text via OCR (the planning
> model could not view images). Field lists below are faithful to that extraction;
> garbled areas are marked **[confirm]**. Implementers MUST visually cross-check the
> PNG in `docs/mockups/` before finalizing a form.

## Run locally

```bash
cp .env.example .env.local   # set ERP_BASE_URL=https://<your-frappe-site>
npm install
npm run dev
```

Open `http://localhost:3000` and sign in with a valid Frappe user on the configured site.

The UI is Frappe-only: all browser requests go to same-origin `/api/...` BFF routes, and the server forwards to `ERP_BASE_URL`. No mock/dev ERP is included. Backend endpoint contract and required schemas are documented in `docs/05-frappe-api-raise-request.md`.

---

## 1. Goal

Repurpose this Next.js 16 auth starter into a **Fixed Asset Management System**
(frontend) backed by a Frappe/ERP site (backend-for-frontend proxy already exists).
Scope covers the full fixed-asset lifecycle shown in the mockups:

organization policy → master data → asset acquisition (opening / new) →
transfers / disposals / revaluation / overhauling → monthly depreciation →
period-end execution → GL voucher posting.

## 2. What has been done (current state)

### 2.1 Starter capabilities (already in repo, verified working patterns)

| Area | Location | State |
| --- | --- | --- |
| Frappe session auth (sid cookie, CSRF, no JWT) | `app/api/auth/*`, `lib/api/frappe.ts`, `lib/auth/*` | Done |
| Login / logout / session restore UI | `app/(auth)/login`, `components/auth/*` | Done |
| Protected app shell (dark sidebar, drawer, breadcrumb, profile menu) | `components/app-shell.tsx`, `app/(app)/layout.tsx` | Done |
| Navigation config + role filtering | `lib/navigation.ts` | Done (template items only) |
| Generic ERP BFF proxy (GET/POST/PATCH/DELETE, same-origin, CSRF) | `app/api/[...path]/route.ts` | Done |
| Upload proxy | `app/api/upload/route.ts` | Done |
| Browser + server CRUD factories (`list/listAll/get/create/update/remove/setStatus`) | `lib/api/crud.ts`, `lib/api/server-crud.ts`, `lib/api/crud-shared.ts` | Done |
| shadcn/ui kit, Tailwind v4 tokens, Zod, mobile-first styling | `components/ui/*`, `app/globals.css` | Done |
| Post-login dashboard (session metrics only) | `app/(app)/dashboard/page.tsx` | Done (asset metrics pending) |
| Error boundary / 404 / loading | `app/error.tsx`, `app/not-found.tsx`, `app/(app)/loading.tsx` | Done |

### 2.2 Work done in this planning session (2026-11-20)

1. Cloned `Asset-Management-System` repo.
2. Inventoried starter code (auth, proxy, CRUD, shell) — section 2.1.
3. Extracted text from all 14 mockups (`D:\New\Fixed Asset\*.png`) via Windows OCR.
4. Copied mockups into repo: `docs/mockups/` (14 PNGs) so the spec lives with code.
5. Wrote this plan: screen specs (§3), routes (§4), backend contract (§5),
   depreciation spec (§6), phased roadmap (§7), do/don't (§8), open decisions (§10).
6. Repurposed `README.md` headline to Asset Management and linked this plan.

**No feature code has been written yet.** Next action: resolve decision D1 (§10),
then start Phase 0 (§7).

## 3. Screen specifications (from mockups)

Common UI conventions observed in mockups (map to our shadcn kit):

- Lists: page-size selector ("Show 10 entries"), global "search all columns",
  per-row Action (Edit), server-side pagination.
- Forms: red asterisk = required; buttons `Clear`, `Save`, `Save & Close`, `Cancel`;
  `Back to List` link; read-only computed/gray fields.
- Dates displayed/entered as `dd-MM-yyyy`.
- Selects for FK fields (Group, Sub Group, Branch, Department, User, Ledgers…).

### 3.1 Configuration

**Organization Information / Policy** — `1. Organization pocily page.png`
- List: Company Name, Division Wise Filtering?, Method of Depreciation, Mode of
  Depreciation, Action.
- Form: Organization ID, Address, Phone, Fax, Email, Contact Person, Organization
  Initial, Method of Depreciation (`STRAIGHT LINE`), Mode of Operation
  (`Monthly (Date of Operation Basis)`), Start Date of Depreciation, Capitalization
  Limit (e.g. 100.00), Minimum Allowable Book Value (e.g. 1.00), Base Currency,
  Is Opening Balance of Cost [confirm], Division Wise Filtering? (Yes/No),
  Microfin Integration Needed [confirm], Head Office Branch.

**Asset AutoId Configuration** — `2. Asset Autold Configuration page.png`
- List: Company, Item, Serial Number Length (e.g. 10), Action.
- Form: Company, Company ID (`DF`), Item, ID Sequence, Separator, Serial Number
  Length, Group ID (legacy).
- Behavior: asset IDs are generated server-side from `autoid_config`. `ID Sequence`
  is an ordered list of `company`, `branch`, `group`, `subGroup`, `department`,
  `serial` (default `company-branch-group-subGroup-department-serial`). Each token
  resolves to the linked record's code: policy/company ID, branch `branchId`,
  group `groupId`, sub-group `subGroupId`, department `shortCode`. The serial is
  zero-padded to `Serial Number Length` and equals the highest existing serial for
  the same segment prefix + 1 (derived from the previous ID, never client-side).
  Example: `DF-0171-00001-00001-IT-0000000001`. `assets.preview` returns the
  generated ID for the read-only Asset ID field; `assets.create` is authoritative.

**Voucher Configuration** — no mockup. Spec needed (D3): numbering series, GL
mapping defaults for depreciation / disposal / transfer vouchers.

### 3.2 Master

**Department** — `3. Department Create Page.png`
- List: Department Name, Short Code, Creation Date, Description, Action.
- Form: Name*, Short Code, Creation Date, Remarks.

**Asset Group** — `4. Asset Group Create Page.png`
- Form: Group ID* (max 5 digits), Group Name*, Department (select).

**Asset Sub Group** — `5. Asset Sub Group Create Page.png`
- Form: Group* (select), Sub Group ID* (max 5 digits), Sub Group Name*,
  Depreciation Rate %*, Method of Depreciation (select), Asset Ledger (select),
  Depreciation Debit Ledger (select), Depreciation Credit Ledger (select).

**Brand** — `6. Asset Brand Page.png`
- Form: Brand Name*.

**Branch** — `7. Branch Page.png`
- List: Name, Mnemonic, Currency, Action.
- Form: Company Name, Branch ID, Branch Name, Mnemonic, Description.

**Fixed Asset User** — `Fixed Asset User Page.png`
- List: User ID (e.g. S00974), User Name, Department [confirm].
- Form: [confirm] — propose User ID*, User Name*, Department (select), Branch
  (select), Remarks.

**Vendor** — nav item in mockups, no screen mockup. Spec needed (D3): propose
Vendor Name*, Short Code, Contact, Phone, Email, Address, Remarks.

### 3.3 Entry

**Opening Asset Entry** — `8. Opening Asset Entry Page.png` (OCR partial [confirm])
- Propose: Asset ID (auto, read-only), Asset Name*, Group*, Sub Group*, Brand,
  Branch*, Department, Fixed Asset User, Vendor/Supplier, Date of Purchase*,
  Date of Operation* (e.g. 01-07-2022), Cost*, Tax, VAT, Opening Accumulated
  Depreciation, Book Value (computed), Remarks.
- Opening entries load pre-existing assets with accumulated depreciation at the
  policy "Start Date of Depreciation".

**New Asset Entry** — `9. New Asset Entry Page.png` (OCR partial [confirm])
- Same shape as Opening plus `Tax?` / `VAT?` flags and tax/VAT amounts; no opening
  accumulated depreciation; Date of Operation drives first depreciation month.

### 3.4 Process

**Asset Transfer** — `10. Asset Transfer Page.png`
- Asset select → read-only snapshot: Asset ID, Asset Name, Group, Sub Group,
  Date of Operation, Date of Purchase, Cost, Accumulated Depreciation.
- Transfer From (read-only): Branch, Sub Branch, Project/Fund, User.
- Transfer To: Branch*, Sub Branch, User*, Project/Fund, Effective Date*
  (defaults today), Remarks (max 150 chars).

**Sale or Disposal** — `11. Sale Or Disposal Page.png`
- Asset ID* select → snapshot: Asset Name, Asset Group, Asset Sub Group, Cost,
  Accumulated Depn., Book Value.
- Type of Operation*: `Sale` | `Permanent Disposal`.
- Date of Disposal/Sale*, Selling Price, Remarks.
- Computed (server-side, read-only): Total Profit/Loss, Capital Gain,
  Business Gain/Loss.

**Period End Process** — `12. Execution of Preriod End Page.png`
- List of monthly periods (e.g. `01-Oct-2026 – 31-Oct-2026`), newest first.
- Actions: `Execute End for Current Period`, `Delete Last`, request status
  (`Completed` / running / failed), `Close`.

**No mockups (spec needed, D3):** Partial Disposal, Voucher Post, Acknowledgement
of Asset Transfer, Asset Revaluation, Asset Overhauling, Change of Depreciation
Rate. Proposed shapes:
- Partial Disposal: like Sale/Disposal with quantity/amount portion + remaining
  book value recomputation.
- Acknowledgement: receiving branch/user confirms a pending transfer.
- Revaluation: new value, effective date, reason; adjusts depreciation base.
- Overhauling: capitalized cost addition, effective date; extends asset life/cost.
- Change of Depreciation Rate: new rate %, effective month, reason.
- Voucher Post: posts generated GL vouchers (depreciation/disposal/transfer) to
  accounts; batch list with status.

### 3.5 Depreciation formula — `Formula OF Depreciation Calculation.png`

Straight-line, monthly, "Date of Operation Basis":

- **Case 1** — Date of Operation NOT in the depreciation month:
  `monthly = (Cost × Rate) / (100 × 12)`
  Example: Cost 13,900, Rate 10 → 115.8333…/month.
- **Case 2** — Date of Operation IS in the depreciation month (first month):
  `prorated = (Cost × Rate × RemainingDaysInMonth) / (100 × 360)`
  Example: Cost 7,786, Rate 10, operated 24-03-2025 → March prorated by remaining
  days [confirm day-count convention: inclusive of operation day].
- Floor at policy `Minimum Allowable Book Value`; stop when fully depreciated;
  respect `Capitalization Limit` at entry time.

## 4. Target navigation & route map

Add groups/items ONLY in `lib/navigation.ts` as routes land (AGENTS rule).

| Group | Item | Route | Mockup |
| --- | --- | --- | --- |
| Workspace | Dashboard | `/dashboard` | existing |
| Configuration | Organization Policy | `/configuration/organization-policy` | 1 |
| Configuration | Asset AutoId Configuration | `/configuration/asset-autoid` | 2 |
| Configuration | Voucher Configuration | `/configuration/vouchers` | – |
| Master | Department | `/master/departments` | 3 |
| Master | Asset Group | `/master/asset-groups` | 4 |
| Master | Asset Sub Group | `/master/asset-sub-groups` | 5 |
| Master | Vendor | `/master/vendors` | – |
| Master | Branch | `/master/branches` | 7 |
| Master | Fixed Asset User | `/master/asset-users` | user page |
| Master | Brand | `/master/brands` | 6 |
| Entry | Opening Asset Entry | `/entry/opening-assets` | 8 |
| Entry | New Asset Entry | `/entry/new-assets` | 9 |
| Process | Asset Transfer | `/process/transfers` | 10 |
| Process | Sale or Disposal | `/process/disposals` | 11 |
| Process | Partial Disposal | `/process/partial-disposals` | – |
| Process | Voucher Post | `/process/voucher-post` | – |
| Process | Transfer Acknowledgement | `/process/transfer-acknowledgements` | – |
| Process | Asset Revaluation | `/process/revaluations` | – |
| Process | Asset Overhauling | `/process/overhauls` | – |
| Process | Change of Depreciation Rate | `/process/rate-changes` | – |
| Process | Period End Process | `/process/period-end` | 12 |

Each list route gets `/new` and `/[id]` subroutes (edit). All under `app/(app)/`
so `requireUser()` applies; role-restricted groups get a layout with
`requireRole()` once asset roles are decided (D2).

## 5. Backend contract (Frappe ERP)

UI never talks to Frappe directly; everything goes through the existing BFF proxy.
Proposed whitelisted method namespace: `asset.api.*`, shaped so the existing CRUD
factories work unchanged (`resolveEndpoints` appends `.list/.get/.create/...`).

| Resource module | basePath |
| --- | --- |
| Departments | `/api/method/asset.api.departments` |
| Asset groups | `/api/method/asset.api.asset_groups` |
| Asset sub groups | `/api/method/asset.api.asset_sub_groups` |
| Brands | `/api/method/asset.api.brands` |
| Branches | `/api/method/asset.api.branches` |
| Asset users | `/api/method/asset.api.asset_users` |
| Vendors | `/api/method/asset.api.vendors` |
| Organization policy | `/api/method/asset.api.organization_policy` |
| AutoId config | `/api/method/asset.api.autoid_config` |
| Voucher config | `/api/method/asset.api.voucher_config` |
| Assets (opening+new) | `/api/method/asset.api.assets` |
| Transfers | `/api/method/asset.api.transfers` |
| Disposals (sale/permanent/partial) | `/api/method/asset.api.disposals` |
| Revaluations | `/api/method/asset.api.revaluations` |
| Overhauls | `/api/method/asset.api.overhauls` |
| Rate changes | `/api/method/asset.api.rate_changes` |
| Ledgers (read-only) | `/api/method/asset.api.ledgers` (`.list` only) |

Non-CRUD process methods (call via `apiRequest` / `serverFrappeRequest`, keep in
`lib/resources/processes.ts`):

```text
asset.api.transfers.acknowledge
asset.api.vouchers.post
asset.api.period_end.list
asset.api.period_end.execute
asset.api.period_end.delete_last
asset.api.period_end.status
asset.api.assets.preview_depreciation   (read-only schedule preview)
```

Envelope contract (already enforced by `lib/api/*`):

- Success: `{ message: T }`; lists: `{ message: { data: T[], meta: { total, page, pageSize } } }`.
- Errors parsed by `lib/api/errors.ts` (`_server_messages` → `message` → `exception`).
- All money/depreciation/profit-loss math lives in Frappe. UI only displays and
  does trivial client-side previews clearly labeled as estimates.
- Auto ID generation, capitalization-limit checks, book-value floors, period
  idempotency and RBAC are server-side. Frappe is the final authorization boundary.

Suggested doctypes (backend workstream if D1 = "build backend"): `Asset Organization
Policy`, `Asset AutoId Config`, `Asset Voucher Config`, `Asset Department`, `Asset
Group`, `Asset Sub Group`, `Asset Brand`, `Asset Branch`, `Asset User`, `Asset
Vendor`, `Asset`, `Asset Transfer`, `Asset Disposal`, `Asset Revaluation`, `Asset
Overhaul`, `Asset Depreciation Rate Change`, `Asset Depreciation Entry`, `Asset
Period End Run`, `Asset Voucher`.

## 6. Phased roadmap

### Phase 0 — Foundation & repurpose (before features) — DONE 2026-11-20
- [x] Resolve D1 (backend). D2 (roles) still open — nav uses ALL_ROLES meanwhile.
- [x] Rename package to `asset-management-ui`; align README/AGENTS headers.
- [x] Shared feature components: `components/features/data-table.tsx` (search,
      page-size, pagination, row actions), `master-form.tsx` (Back to List, Clear /
      Save / Save & Close / Cancel, required markers), `resource-select.tsx`
      (FK/ledger selects), `lib/format.ts` (dd-MM-yyyy display).
- [x] `lib/resources/masters.ts` config + Zod schema builder; `master-api.ts`
      cached client CRUD factory.
- [x] Master nav group in `lib/navigation.ts` (items added as routes land).
- Acceptance: `npm run typecheck && npm run lint && npm run build` green. ✔

### Phase 1 — Masters (7 screens) — UI DONE 2026-11-20
Department, Brand, Branch, Asset Group, Asset Sub Group, Fixed Asset User, Vendor.
- [x] List + create + edit per §3.2 via dynamic routes
      `app/(app)/master/[resource]/{page,new/page,[id]/page}.tsx`; 5-digit ID
      validation; FK selects via `listAll()`; ledger selects for Sub Group.
- [x] Graceful error/empty/loading states (no backend yet, no fake data).
- [ ] Acceptance remainder: CRUD round-trips against ERP — deferred to Phase B;
      mobile layout visual pass pending.

### Phase 2 — Configuration
Organization Policy, AutoId Config, Voucher Config.
- [ ] Policy singleton form per §3.1; AutoId CRUD; voucher config spec (D3).
- Acceptance: policy values (capitalization limit, min book value, start date)
  readable by entry/process screens; AutoId produces IDs of configured length.

### Phase 3 — Asset entries
Opening Asset Entry, New Asset Entry.
- [ ] Forms per §3.3 [confirm fields vs PNGs]; auto ID read-only; server-computed
      book value; opening accumulated depreciation; tax/VAT flags.
- Acceptance: created assets appear in lists with correct computed values;
  capitalization limit enforced; depreciation preview matches §3.5 examples.

### Phase 4 — Processes
Transfer (+acknowledgement), Sale/Disposal, Partial Disposal, Revaluation,
Overhauling, Rate Change, Voucher Post.
- [ ] Asset picker + read-only snapshot; transfer from/to blocks; remarks ≤ 150;
      disposal profit/loss server-computed; pending→acknowledged flow.
- Acceptance: each process mutates asset state correctly (branch/user, status,
  cost base, rate) and produces voucher drafts.

### Phase 5 — Period end & dashboard
- [ ] Period list, Execute, Delete Last, status polling; depreciation schedule
      view per asset; dashboard stat cards (asset count, total cost, accumulated
      depn, book value, month additions/disposals).
- Acceptance: Case 1 = 115.83 for 13,900 @ 10%; Case 2 proration matches mockup;
  re-running a period is idempotent; Delete Last reverses exactly one run.

### Phase 6 — Hardening
- [ ] Role mapping (D2), empty/error/loading states, keyboard/a11y pass,
      `listAll` caps, docs refresh, final typecheck/lint/build.

### Phase B — Frappe backend workstream (parallel track, after D1)
- [ ] Frappe app `asset_management` with doctypes listed in §5 (JSON fixtures).
- [ ] Whitelisted `asset.api.*` modules matching the CRUD suffix contract
      (`list/get/create/update/delete/set_status`), `{message:{data,meta}}`
      envelopes, server-side pagination + search.
- [ ] Server-side rules: auto ID generation, capitalization limit, min book value
      floor, depreciation engine (§3.5), period-end idempotency, transfer/disposal
      state transitions, GL voucher drafts, RBAC roles (feeds D2).
- [ ] `asset.api.ledgers.list` read-only ledger source for Sub Group selects.
- [ ] Deploy target site; set `ERP_BASE_URL`; then re-run Phase 1–5 round-trip
      acceptance.

## 7. Engineering rules — DO

- Follow `AGENTS.md` non-negotiables (single env `ERP_BASE_URL`; cookie/CSRF auth;
  same-origin `/api/...`; explicit `cookieHeader`; keep `proxy.ts`).
- Use `createCrudResource` / `createServerCrudResource`; keep endpoint maps in
  `lib/resources/*`; Zod-validate every mutation; `requireSameOrigin` on routes.
- Server Components by default; `'use client'` only for interactivity.
- Nav changes only in `lib/navigation.ts`; shell inherited from `(app)/layout`.
- shadcn/ui + Tailwind semantic tokens; slate-950 primary, indigo accent;
  mobile-first; keyboard accessible.
- Mirror mockup behavior (required marks, button set, dd-MM-yyyy, page-size
  selector) using our stack — not the mockup's literal styling.
- Run `npm run typecheck`, `npm run lint`, `npm run build` after every phase; fix
  all errors before moving on.
- Update §9 progress log and this doc whenever scope/status changes.
- Visually verify each implemented screen against its PNG in `docs/mockups/`.

## 8. Engineering rules — DON'T

- Don't add env vars / `NEXT_PUBLIC_*`; don't add JWT, next-auth, refresh tokens,
  or token/session storage in browser.
- Don't call Frappe cross-origin from browser; don't inline ERP paths in
  components; don't leak ERP URLs/cookies/credentials to client code.
- Don't import `server-crud.ts` into client code or `crud.ts` into Server
  Components.
- Don't add MUI/Emotion/Redux/Zustand/React Query or new deps without justification.
- Don't compute depreciation, profit/loss, or book value in the browser as source
  of truth; don't generate asset IDs client-side.
- Don't build sidebar/navbar markup inside feature pages.
- Don't treat UI role guards as authorization (Frappe RBAC is final).
- Don't implement no-mockup screens (§3.4) before their spec is approved (D3).
- Don't overwrite `docs/00..03` or sibling apps; don't commit unless asked.
- Don't skip the [confirm] cross-checks; OCR text is a draft spec, PNGs are truth.

## 9. Progress log

| Date | Entry |
| --- | --- |
| 2026-11-20 | Repo cloned; starter inventoried; 14 mockups OCR-extracted and copied to `docs/mockups/`; plan + specs + contract + roadmap written; README repurposed. |
| 2026-11-20 | D1 resolved (no backend → Phase B). Phase 0 + 1 UI implemented: shared feature components, resource config, 7 master modules (list/new/edit), Master nav group, package/AGENTS repurposed. typecheck/lint/build green; prod smoke test: `/login` 200, protected `/master/departments` 307 → login. |
| 2026-11-23 | Full UI implemented: generalized `ResourceForm`/`ResourceList`/page factory, 3 Configuration + 2 Entry + 5 Process resource modules (list/new/edit), custom Period End / Voucher Post / Transfer Acknowledgement screens, nav groups, dashboard asset stats, asset preview with book-value calculation. A local dev ERP was used for smoke testing during development (since removed); production target is Frappe via `ERP_BASE_URL`. |
| 2026-11-23 | Follow-up fixes: replaced all visible "Meal Management" branding (shell, login, metadata, logo mark, lockfile) with "Asset Management System"; fixed list pages stuck on the loading spinner (mount-time search debounce re-set `loading=true` without refetch — now short-circuits when search is unchanged); select options now resolve from the unified resource registry so process forms can load assets. typecheck/lint/build green, served HTML and list API verified. |
| 2026-11-23 | Create/edit pages across Master, Configuration, Entry and Process now span the full content width: removed `max-w-2xl`, fields render in a responsive 1/2/3-column card, section headings span all columns, actions stay page-aligned. typecheck/lint/build green; create and edit routes verified for all four groups. |
| 2026-11-23 | Asset IDs now come from `autoid_config` (server-side): configurable segment sequence with company/branch/group/sub-group/department codes and a zero-padded serial derived from the highest previous ID for the same prefix. Added Company ID, ID Sequence and Separator config fields with defaults; asset entry previews the generated ID. Smoke test: `DF-0171-00001-00001-IT-0000000001/…0002`, different branch reset to `…0189-…0000000001`. typecheck/lint/build green; demo data reseeded. |
| 2026-11-23 | Fixed stale dropdown options: newly added Brand/Vendor records were missing from asset entry selects because `optionsCache` persisted across SPA navigation. `clearOptionsCache()` now runs after every successful save, so selects refetch fresh master data. typecheck/lint/build green. |
| 2026-11-23 | Asset ID select in process screens now uses all registered assets and a searchable combobox. Registered an `assets` lookup resource, added `searchable` field flag, and show `ID — Name` options that can be filtered by ID or name. Verified in browser: 6 assets listed, typing `DF-HO` filtered to the matching asset, and selecting it filled the asset snapshot. typecheck/lint/build green. |
| 2026-11-23 | Transfers now take effect only on acknowledgement: duplicate pending transfers are blocked, the asset stays in its original branch until acknowledgement, then branch/user change, a new branch-based asset ID is generated, `previousId`/`previousBranch` are stored, and references in other collections are updated. Entry index pages show `Previous Asset ID`; transfer list shows previous/new IDs; acknowledgement notice reports the ID change. Verified end-to-end with a test asset (`0171` → `0189`, old ID no longer resolves). typecheck/lint/build green. |
| 2026-11-23 | Added Excel bulk entry to New/Opening Asset Entry lists. `Download Format` generates an `.xlsx` template with every form field, a hidden system signature, and strict header checks; `Upload Excel` accepts only that exact format (max 1000 rows/10 MB), validates required/type/length rules server-side, and creates assets via the ERP BFF. Added `exceljs` (server-only) as a dependency. Verified: template download, valid import created 1 asset, foreign workbook and tampered headers both rejected with 400. typecheck/lint/build green. |
| 2026-11-23 | Removed the Asset ID column from the bulk Excel template; IDs remain auto-generated from AutoId configuration exactly as in single asset entry. |

Next: Phase B (production Frappe backend), D2 roles, D3/D4 spec cross-checks with mockup PNGs. API raise request: `docs/05-frappe-api-raise-request.md`.

## 10. Open decisions

- **D1 — Backend: RESOLVED 2026-11-20.** No backend exists yet. Decision: build a
  Frappe app workstream (Phase B) implementing §5; UI is built against the contract
  now. CRUD round-trip acceptance is deferred until Phase B lands; until then UI
  must degrade gracefully (error/empty states) with no fake data.
- **D2 — Roles:** current `Role` union is workshop-specific. Define asset roles
  (e.g. Admin / Accounts / Asset Manager / Viewer) and map ERP roles in
  `lib/auth/roles.ts`.
- **D3 — Specs for no-mockup screens:** Vendor, Voucher Config, Partial Disposal,
  Voucher Post, Acknowledgement, Revaluation, Overhauling, Rate Change.
- **D4 — [confirm] fields:** Opening/New entry exact fields; Fixed Asset User
  form; day-count convention in depreciation Case 2; policy flags wording.
- **D5 — Multi-company / division filtering:** mockups show "Division Wise
  Filtering?" — decide if Phase 1 ships single-company only.
