# Frappe API Raise Request — Fixed Asset Management

**Date:** 2026-11-24  
**Frontend:** `asset-management-ui` (Next.js 16, same-origin BFF)  
**Target ERP:** Frappe site configured by `ERP_BASE_URL`  
**Status:** Frontend is Frappe-only; mock/dev ERP removed. Backend APIs below are required for end-to-end operation.

## 1. Purpose

This document is the backend implementation request for the Fixed Asset Management frontend. It lists all APIs the UI currently calls, expected auth/session behavior, request/response contracts, query/body parameters, and data models/schemas inferred from the frontend resource definitions and process screens.

Backend developers should implement these as Frappe whitelisted methods (or compatible endpoints) on the configured Frappe site.

## 2. Integration Rules (Must Follow)

- **Base URL:** Frontend server uses `ERP_BASE_URL` only. No new env vars.
- **Auth model:** Frappe session cookie `sid` (`HttpOnly`) + CSRF token `X-Frappe-CSRF-Token`.
- **Browser never calls Frappe directly.** Frontend BFF proxies requests same-origin and forwards cookies/CSRF server-side.
- **Success envelope:** `{"message": <payload>}`.
- **Error envelope:** Frappe-standard error fields; frontend parses `_server_messages`, then `message`, then `exception`.
- **Authorization:** Frappe RBAC and shop/company scope are final authority. UI guards are convenience only.
- **Date format:** ISO `YYYY-MM-DD` in API payloads. UI displays `dd-MM-yyyy`.
- **Numbers:** Send numeric values as numbers where possible; frontend also tolerates numeric strings in some reads.
- **IDs:** String IDs. Asset IDs are server-generated on create/preview per AutoId configuration.

## 3. Standard CRUD Contract

Most resources use the CRUD factory convention:

| Action | Method | Path suffix | Request | Response `message` |
|---|---|---|---|---|
| List | GET | `.list` | Query params: `page`, `pageSize`, `search`, plus resource filters | `{ "data": [<row>], "meta": { "total": <int>, "page": <int>, "pageSize": <int> } }` |
| Get | GET | `.get` | Query param: `id` | `<row>` |
| Create | POST | `.create` | JSON body: resource fields (+ optional `entryType` for assets) | `<created row>` including `id` |
| Update | POST | `.update` | JSON body: `{ "id": "...", ...patchFields }` | `<updated row>` |
| Delete | POST | `.delete` | JSON body: `{ "id": "..." }` | `<deleted row>` or `{ "ok": true }` |
| Set status | POST | `.set_status` | JSON body: `{ "id": "...", "status": "..." }` | `<updated row>` |

### List behavior
- `page` default 1, `pageSize` default 10/20 depending caller; support at least 1-100.
- `search` should search across visible/key text fields.
- Resource-specific filters currently used:
  - `assets.list`: `entryType=opening|new`
  - `transfers.list`: `status=Pending` (used by acknowledgement screen)

## 4. Auth / Session APIs (Required)

These are existing frontend auth dependencies.

| Frontend use | Frappe method | HTTP | Request | Expected response |
|---|---|---:|---|---|
| CSRF token | `/api/method/workshop.api.auth.csrf_token` | GET | cookie header | `{ "message": { "csrf_token": "<token>" } }` or equivalent token field readable by frontend |
| Login | `/api/method/workshop.api.auth.login` | POST | form-urlencoded: `usr`, `pwd`, `csrf_token`; header `X-Frappe-CSRF-Token` | Login success sets `sid` cookie; response message contains session/user DTO |
| Current session | `/api/method/workshop.api.auth.me` | GET | `sid` cookie | `{ "message": <AuthSessionDto> }`; 401/403 when unauthenticated |
| Logout | `/api/method/workshop.api.auth.logout` | POST | `sid` cookie + CSRF header | Success; clears/invalidates session |

### AuthSessionDto
```json
{
  "ok": true,
  "user": {
    "id": "Administrator",
    "fullName": "System Administrator",
    "email": "admin@example.com",
    "mobile": "",
    "roleIds": ["Administrator"],
    "shopIds": [],
    "status": "Active",
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z"
  },
  "capabilities": ["admin.read"],
  "siteName": "continental-motor.com"
}
```

## 5. Common Response / Error Models

### List envelope
```json
{
  "message": {
    "data": [ { "id": "..." } ],
    "meta": { "total": 100, "page": 1, "pageSize": 20 }
  }
}
```

### Error example
```json
{
  "message": "Validation failed",
  "exception": "frappe.exceptions.ValidationError",
  "_server_messages": "[\"...\"]"
}
```

Frontend displays parsed message; use clear validation messages for field errors.

## 6. Master Data APIs

All master resources follow standard CRUD contract unless noted.

### 6.1 Departments
- **Base:** `/api/method/asset.api.departments`
- **Model:**
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | Primary ID |
| name | string | yes | max 100 |
| shortCode | string | no | max 20; used in Asset AutoId department token |
| creationDate | date | no | YYYY-MM-DD |
| remarks | string | no | max 250 |

### 6.2 Asset Groups
- **Base:** `/api/method/asset.api.asset_groups`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| groupId | string/digits | yes | max 5 digits; used in Asset AutoId group token |
| name | string | yes | max 100 |
| department | string | no | Department ID |

### 6.3 Asset Sub Groups
- **Base:** `/api/method/asset.api.asset_sub_groups`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| group | string | yes | Asset Group ID |
| subGroupId | string/digits | yes | max 5 digits; used in AutoId subGroup token |
| name | string | yes | max 100 |
| depreciationRate | number | yes | percent |
| method | string | no | `STRAIGHT LINE` or `WRITTEN DOWN VALUE` |
| assetLedger | string | no | Ledger ID |
| depnDebitLedger | string | no | Ledger ID |
| depnCreditLedger | string | no | Ledger ID |

### 6.4 Brands
- **Base:** `/api/method/asset.api.brands`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| name | string | yes | max 100 |

### 6.5 Branches
- **Base:** `/api/method/asset.api.branches`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| companyName | string | no | max 100 |
| branchId | string | yes | max 20; used in AutoId branch token |
| name | string | yes | max 100 |
| mnemonic | string | no | max 20; fallback for branch token |
| currency | string | no | max 10 |
| description | string | no | max 250 |

### 6.6 Fixed Asset Users
- **Base:** `/api/method/asset.api.asset_users`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | UI also allows userId field |
| userId | string | yes | max 20 |
| name | string | yes | max 100 |
| department | string | no | Department ID |
| branch | string | no | Branch ID |
| remarks | string | no | max 250 |

### 6.7 Vendors
- **Base:** `/api/method/asset.api.vendors`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| name | string | yes | max 100 |
| shortCode | string | no | max 20 |
| contactPerson | string | no | max 100 |
| phone | string | no | max 30 |
| email | string | no | max 100 |
| remarks | string | no | max 250 |

## 7. Configuration APIs

### 7.1 Organization Policy
- **Base:** `/api/method/asset.api.organization_policy`
- **UI expectation:** Single policy record is acceptable; CRUD endpoints supported.
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| company | string | yes | max 100 |
| organizationInitial | string | no | max 10; AutoId company fallback |
| address | string | no | max 200 |
| phone | string | no | max 30 |
| fax | string | no | max 30 |
| email | string | no | max 100 |
| contactPerson | string | no | max 100 |
| method | string | yes | `STRAIGHT LINE` / `WRITTEN DOWN VALUE` |
| mode | string | yes | `Monthly (Date of Operation Basis)` |
| startDate | date | yes | depreciation start |
| capitalizationLimit | number | yes | entry validation |
| minimumBookValue | number | yes | depreciation floor |
| baseCurrency | string | no | max 10 |
| divisionWiseFiltering | string | no | `Yes`/`No` |
| headOfficeBranch | string | no | Branch ID |

### 7.2 Asset AutoId Configuration
- **Base:** `/api/method/asset.api.autoid_config`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| company | string | yes | max 100 |
| companyId | string | yes | max 10; company token |
| item | string | yes | max 50 |
| sequence | string | yes | max 120; default `company-branch-group-subGroup-department-serial` |
| separator | string | no | max 3; default `-` |
| serialLength | number | yes | zero-pad length |
| groupId | string | no | legacy field kept by UI |

**ID generation rules:**
- Tokens: `company`, `branch`, `group`, `subGroup`, `department`, `serial`.
- Resolve codes from linked records: policy/companyId, branch.branchId/mnemonic, group.groupId, subGroup.subGroupId, department.shortCode/id.
- Serial is highest existing serial for same prefix + 1, zero-padded.
- `assets.preview` must return generated `id` for UI read-only field.
- `assets.create` is authoritative; ignore client-supplied generated ID if unsafe.

### 7.3 Voucher Configuration
- **Base:** `/api/method/asset.api.voucher_config`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| series | string | yes | max 50 |
| voucherType | string | yes | `Depreciation`, `Disposal`, `Transfer`, `Revaluation`, `Overhaul` |
| debitLedger | string | no | Ledger ID |
| creditLedger | string | no | Ledger ID |

## 8. Ledger API (Read-only)

- **Path:** `/api/method/asset.api.ledgers.list`
- **Method:** GET
- **Request:** optional `page`, `pageSize`, `search`
- **Response:**
```json
{
  "message": {
    "data": [
      { "id": "LED-ASSET", "name": "Fixed Asset Ledger" }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 100 }
  }
}
```

## 9. Asset Entry APIs

### 9.1 Assets CRUD
- **Base:** `/api/method/asset.api.assets`
- **List filters:** `entryType=opening|new`
- **Create body:** includes `entryType` (`opening` or `new`) from UI.
- **Preview:** `/api/method/asset.api.assets.preview` (POST)

#### Asset model
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | AutoId-generated |
| previousId | string | no | set after acknowledged transfer |
| name | string | yes | max 100 |
| group | string | yes | Asset Group ID |
| subGroup | string | yes | Asset Sub Group ID |
| brand | string | no | Brand ID |
| branch | string | yes | Branch ID |
| department | string | no | Department ID |
| user | string | no | Asset User ID |
| vendor | string | no | Vendor ID |
| dateOfPurchase | date | yes | |
| dateOfOperation | date | yes | |
| cost | number | yes | |
| tax | number | no | |
| vat | number | no | |
| openingAccumulatedDepn | number | opening only | default 0 |
| accumulatedDepn | number | system | |
| bookValue | number | system | computed |
| status | string | system | `Active`, `Disposed`, etc. |
| entryType | string | yes | `opening` or `new` |
| remarks | string | no | max 250 |

#### Asset preview request
```json
{
  "group": "AG-0001",
  "subGroup": "ASG-0001",
  "branch": "BR-0001",
  "department": "DEP-0001",
  "cost": 10000,
  "openingAccumulatedDepn": 0
}
```

#### Asset preview response
```json
{
  "message": {
    "id": "DF-0171-00001-00001-IT-0000000001",
    "bookValue": 10000
  }
}
```

## 10. Process APIs

### 10.1 Asset Transfer
- **Base:** `/api/method/asset.api.transfers`
- **Acknowledge:** `/api/method/asset.api.transfers.acknowledge` (POST)
- **List filter:** `status=Pending` used by acknowledgement screen.

#### Transfer model
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| asset | string | yes | Asset ID |
| assetName | string | snapshot | |
| group/subGroup | string | snapshot | |
| dateOfOperation/dateOfPurchase | date | snapshot | |
| cost/accumulatedDepn/bookValue | number | snapshot | |
| fromBranch/fromUser | string | snapshot/system | current location |
| toBranch | string | yes | Branch ID |
| toUser | string | yes | Asset User ID |
| toProject | string | no | max 100 |
| effectiveDate | date | yes | default today |
| remarks | string | no | max 150 |
| status | string | system | `Pending`, `Acknowledged` |
| oldAssetId/newAssetId | string | system | set on acknowledgement |

#### Acknowledge request/response
```json
{ "id": "TR-0001" }
```
```json
{
  "message": {
    "id": "TR-0001",
    "status": "Acknowledged",
    "oldAssetId": "DF-0171-...0001",
    "newAssetId": "DF-0189-...0001"
  }
}
```

**Business rule:** Asset location/ID change happens on acknowledgement, not on transfer create. Block duplicate pending transfer for same asset.

### 10.2 Sale / Disposal / Partial Disposal
- **Base:** `/api/method/asset.api.disposals`
- **Preview:** `/api/method/asset.api.disposals.preview` (POST)

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| asset | string | yes | |
| type | string | yes | `Sale`, `Permanent Disposal`, `Partial Disposal` |
| date | date | yes | |
| sellingPrice | number | no | |
| portion | number | partial only | cost portion |
| cost/accumulatedDepn/bookValue | number | system | computed |
| totalProfitLoss/capitalGain/businessGainLoss | number | system | computed server-side |
| remarks | string | no | max 250 |
| status | string | system | |

Preview should compute gain/loss fields from asset + input.

### 10.3 Revaluation
- **Base:** `/api/method/asset.api.revaluations`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| asset | string | yes | |
| newValue | number | yes | |
| effectiveDate | date | yes | |
| reason | string | no | max 250 |
| status | string | system | |

### 10.4 Overhauling
- **Base:** `/api/method/asset.api.overhauls`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| asset | string | yes | |
| amount | number | yes | capitalized cost |
| effectiveDate | date | yes | |
| remarks | string | no | max 250 |
| status | string | system | |

### 10.5 Change of Depreciation Rate
- **Base:** `/api/method/asset.api.rate_changes`
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| subGroup | string | yes | Asset Sub Group ID |
| currentRate | number | system | old rate snapshot |
| newRate | number | yes | |
| effectiveMonth | date | yes | UI sends date |
| reason | string | no | max 250 |
| status | string | system | |

Business rule: updates sub-group depreciation rate effective from selected period/month as defined by accounting policy.

## 11. Period End & Voucher APIs

### 11.1 Period End
- **List:** `GET /api/method/asset.api.period_end.list`
- **Execute:** `POST /api/method/asset.api.period_end.execute` body `{}`
- **Delete last:** `POST /api/method/asset.api.period_end.delete_last` body `{}`
- **Status:** `GET /api/method/asset.api.period_end.status` (optional but recommended)

#### PeriodRun model
```json
{
  "id": "PER-0001",
  "period": "2026-11",
  "label": "01-11-2026 - 30-11-2026",
  "status": "Completed",
  "entries": 4,
  "total": 1234.56,
  "executedAt": "2026-11-30T10:00:00Z"
}
```

**Rules:**
- Idempotent per period: executing same period should return clear error or existing run (prefer clear 400 validation).
- `delete_last` reverses only last run and related depreciation/voucher artifacts.
- Depreciation uses Organization Policy + Sub Group rate/method. Straight-line monthly date-of-operation basis required by current UI spec.

### 11.2 Vouchers
- **List:** `GET /api/method/asset.api.vouchers.list` (standard list envelope)
- **Post one:** `POST /api/method/asset.api.vouchers.post` body `{ "id": "VCH-0001" }`
- **Post all drafts:** `POST /api/method/asset.api.vouchers.post_all` body `{}`

#### Voucher model
| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | system | |
| type | string | yes | Depreciation/Disposal/Transfer/Revaluation/Overhaul |
| period | string | no/yes | period key/label |
| amount | number | yes | |
| debitLedger | string | yes | Ledger ID/name |
| creditLedger | string | yes | Ledger ID/name |
| reference | string | no | asset/process reference |
| status | string | system | `Draft`, `Posted` |
| createdAt/postedAt | datetime | system | |

`post_all` response should be list of posted vouchers (UI uses `posted.length`).

## 12. Dashboard API

- **Path:** `GET /api/method/asset.api.dashboard.stats`
- **Response:**
```json
{
  "message": {
    "assetCount": 10,
    "activeCount": 9,
    "disposedCount": 1,
    "totalCost": 100000,
    "totalAccumulatedDepn": 12000,
    "totalBookValue": 88000,
    "monthAdditions": 2,
    "monthDisposals": 1,
    "lastPeriod": "01-11-2026 - 30-11-2026"
  }
}
```

## 13. Bulk Upload (Frontend-handled, backend impact)

Bulk Excel import is implemented in frontend route `/api/bulk-assets/import`:
- Frontend parses `.xlsx`, validates format/rows/fields.
- Frontend creates assets by calling `POST /api/method/asset.api.assets.create` per row through BFF.
- **Backend requirement:** `assets.create` must be idempotent-safe for validation errors and return clear field-level messages where possible.
- Optional improvement: provide batch endpoint `asset.api.assets.bulk_create` to reduce round trips; frontend can be adapted later.

## 14. Security / Validation Requirements

- Enforce Frappe permissions/roles on every method.
- Validate FK IDs (group, subGroup, branch, department, user, vendor, ledgers, assets).
- Enforce capitalization limit and minimum book value from Organization Policy.
- Compute depreciation, book value, disposal gain/loss server-side.
- Prevent negative book value below minimum allowable book value.
- Prevent deleting/reversing periods outside allowed sequence.
- Return 401/403 for auth failures, 400 for validation, 404 for missing records.

## 15. Suggested Frappe Doctypes / Models

Minimum suggested doctypes (adjust to site conventions):

- `Asset Organization Policy` (single)
- `Asset AutoId Config`
- `Asset Voucher Config`
- `Asset Department`
- `Asset Group`
- `Asset Sub Group`
- `Asset Brand`
- `Asset Branch`
- `Asset User`
- `Asset Vendor`
- `Asset`
- `Asset Transfer`
- `Asset Disposal`
- `Asset Revaluation`
- `Asset Overhaul`
- `Asset Depreciation Rate Change`
- `Asset Depreciation Entry`
- `Asset Period End Run`
- `Asset Voucher`

## 16. Delivery Checklist for Backend

- [ ] Implement auth methods used by frontend (`workshop.api.auth.*`) or provide compatible aliases.
- [ ] Implement all `asset.api.*` endpoints listed above.
- [ ] Match `{message: ...}` envelope and list `{data, meta}` shape.
- [ ] Support `page/pageSize/search` and documented filters.
- [ ] Implement server-side calculations and status transitions.
- [ ] Add permission checks and tests for 401/403/400/404.
- [ ] Provide sample seed data for QA.
- [ ] Share deployed endpoint list and any field-name deviations before frontend integration test.

## 17. Known Frontend Assumptions / Gaps to Confirm

- Frontend currently has workshop-era role names in `lib/auth/roles.ts`; backend should confirm final Asset roles (Admin/Accounts/Asset Manager/Viewer etc.) and role IDs.
- `Voucher Post` screen expects `vouchers.list` rows to include ledger IDs/names as `debitLedger`/`creditLedger`.
- Transfer acknowledgement UI expects response to include `oldAssetId`/`newAssetId` when ID changes.
- Some process screens are implemented in UI but need business-rule confirmation against accounting policy (revaluation/overhaul/rate-change GL impact).
