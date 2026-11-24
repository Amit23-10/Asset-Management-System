import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(ROOT, 'dev-erp-data.json')
const PORT = Number(process.env.PORT || 4000)

const LEDGERS = [
  { id: 'LED-ASSET', name: 'Fixed Asset Ledger' },
  { id: 'LED-DEPN-EXP', name: 'Depreciation Expense' },
  { id: 'LED-ACC-DEPN', name: 'Accumulated Depreciation' },
  { id: 'LED-CASH', name: 'Cash' },
  { id: 'LED-BANK', name: 'Bank' },
  { id: 'LED-GAIN', name: 'Gain on Disposal' },
  { id: 'LED-LOSS', name: 'Loss on Disposal' },
]

function seed() {
  return {
    users: [
      {
        id: 'Administrator',
        password: 'admin123',
        fullName: 'System Administrator',
        email: 'admin@example.com',
        mobile: '',
        roleIds: ['Administrator'],
        shopIds: [],
        status: 'Active',
      },
      {
        id: 'accounts',
        password: 'accounts123',
        fullName: 'Accounts User',
        email: 'accounts@example.com',
        mobile: '',
        roleIds: ['Accounts'],
        shopIds: [],
        status: 'Active',
      },
    ],
    collections: {
      departments: [
        { id: 'DEP-0001', name: 'Accounting', shortCode: 'AC', creationDate: '2022-10-16', remarks: 'Finance and accounts' },
        { id: 'DEP-0002', name: 'Human Resource', shortCode: 'HR', creationDate: '2022-10-17', remarks: '' },
        { id: 'DEP-0003', name: 'IT', shortCode: 'IT', creationDate: '2022-12-05', remarks: 'Information technology' },
      ],
      asset_groups: [
        { id: 'AG-0001', groupId: '00001', name: 'Computer Equipment', department: 'DEP-0003' },
        { id: 'AG-0002', groupId: '00002', name: 'Furniture & Fixtures', department: 'DEP-0001' },
        { id: 'AG-0003', groupId: '00003', name: 'Vehicles', department: 'DEP-0001' },
      ],
      asset_sub_groups: [
        { id: 'ASG-0001', group: 'AG-0001', subGroupId: '00001', name: 'Laptops', depreciationRate: 10, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
        { id: 'ASG-0002', group: 'AG-0001', subGroupId: '00002', name: 'Servers', depreciationRate: 10, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
        { id: 'ASG-0003', group: 'AG-0002', subGroupId: '00003', name: 'Office Furniture', depreciationRate: 5, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
        { id: 'ASG-0004', group: 'AG-0003', subGroupId: '00004', name: 'Motor Cars', depreciationRate: 10, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
      ],
      vendors: [
        { id: 'VEN-0001', name: 'Tech Supplies Ltd', shortCode: 'TSL', contactPerson: 'Karim', phone: '+8801700000001', email: 'sales@tsl.example', remarks: '' },
        { id: 'VEN-0002', name: 'Office Mart', shortCode: 'OM', contactPerson: 'Rahim', phone: '+8801700000002', email: 'info@om.example', remarks: '' },
      ],
      branches: [
        { id: 'BR-0001', companyName: 'Demo Foundation', branchId: '0171', name: 'Abdullahbag', mnemonic: '0171', currency: 'BDT', description: '' },
        { id: 'BR-0002', companyName: 'Demo Foundation', branchId: '0189', name: 'Abdullahpur', mnemonic: '0189', currency: 'BDT', description: '' },
        { id: 'BR-0003', companyName: 'Demo Foundation', branchId: '0409', name: 'Adda', mnemonic: '0409', currency: 'BDT', description: '' },
        { id: 'BR-0004', companyName: 'Demo Foundation', branchId: 'HO', name: 'Head Office', mnemonic: 'HO', currency: 'BDT', description: 'Gulshan, Dhaka' },
      ],
      asset_users: [
        { id: 'S00974', userId: 'S00974', name: 'Md. Abul Kamal Hossain', department: 'DEP-0001', branch: 'BR-0001', remarks: '' },
        { id: 'S02321', userId: 'S02321', name: 'Md. Alomgir Hossain', department: 'DEP-0003', branch: 'BR-0002', remarks: '' },
        { id: 'S04893', userId: 'S04893', name: 'Kutubuddin Ahamed', department: 'DEP-0002', branch: 'BR-0003', remarks: '' },
        { id: 'S05173', userId: 'S05173', name: 'Md. Alamgir Hossain', department: 'DEP-0001', branch: 'BR-0004', remarks: '' },
      ],
      brands: [
        { id: 'BRD-0001', name: 'Dell' },
        { id: 'BRD-0002', name: 'HP' },
        { id: 'BRD-0003', name: 'Toyota' },
      ],
      organization_policy: [
        {
          id: 'POL-0001',
          company: 'Demo Foundation',
          address: 'Gulshan, Dhaka',
          phone: '+8802222290513',
          fax: '+8802222263165',
          email: 'sf@example.com',
          contactPerson: 'Sam',
          organizationInitial: 'DF',
          method: 'STRAIGHT LINE',
          mode: 'Monthly (Date of Operation Basis)',
          startDate: '2022-07-01',
          capitalizationLimit: 100,
          minimumBookValue: 1,
          baseCurrency: 'BDT',
          divisionWiseFiltering: 'No',
          headOfficeBranch: 'BR-0004',
        },
      ],
      autoid_config: [
        {
          id: 'AID-0001',
          company: 'Demo Foundation',
          companyId: 'DF',
          item: 'Asset',
          sequence: 'company-branch-group-subGroup-department-serial',
          separator: '-',
          serialLength: 10,
          groupId: '00001',
        },
      ],
      voucher_config: [
        { id: 'VC-0001', series: 'DEPN-.YYYY.-', voucherType: 'Depreciation', debitLedger: 'LED-DEPN-EXP', creditLedger: 'LED-ACC-DEPN' },
        { id: 'VC-0002', series: 'DISP-.YYYY.-', voucherType: 'Disposal', debitLedger: 'LED-CASH', creditLedger: 'LED-ASSET' },
      ],
      assets: [
        {
          id: '000010000000001', name: 'Dell Latitude 5420', group: 'AG-0001', subGroup: 'ASG-0001', brand: 'BRD-0001',
          branch: 'BR-0001', department: 'DEP-0001', user: 'S00974', vendor: 'VEN-0001',
          dateOfPurchase: '2021-01-01', dateOfOperation: '2022-07-01', cost: 13900, tax: 0, vat: 0,
          openingAccumulatedDepn: 0, accumulatedDepn: 0, bookValue: 13900, status: 'Active', entryType: 'opening', remarks: '',
        },
        {
          id: '000010000000002', name: 'HP ProDesk 400', group: 'AG-0001', subGroup: 'ASG-0001', brand: 'BRD-0002',
          branch: 'BR-0002', department: 'DEP-0003', user: 'S02321', vendor: 'VEN-0001',
          dateOfPurchase: '2025-02-10', dateOfOperation: '2025-02-18', cost: 7786, tax: 0, vat: 0,
          openingAccumulatedDepn: 0, accumulatedDepn: 0, bookValue: 7786, status: 'Active', entryType: 'new', remarks: '',
        },
        {
          id: '000020000000003', name: 'Conference Table', group: 'AG-0002', subGroup: 'ASG-0003', brand: '',
          branch: 'BR-0004', department: 'DEP-0001', user: 'S05173', vendor: 'VEN-0002',
          dateOfPurchase: '2022-06-15', dateOfOperation: '2022-07-01', cost: 25000, tax: 0, vat: 0,
          openingAccumulatedDepn: 5000, accumulatedDepn: 5000, bookValue: 20000, status: 'Active', entryType: 'opening', remarks: '',
        },
        {
          id: '000030000000004', name: 'Toyota Corolla', group: 'AG-0003', subGroup: 'ASG-0004', brand: 'BRD-0003',
          branch: 'BR-0004', department: 'DEP-0001', user: 'S05173', vendor: 'VEN-0002',
          dateOfPurchase: '2023-03-01', dateOfOperation: '2023-03-15', cost: 1500000, tax: 0, vat: 0,
          openingAccumulatedDepn: 0, accumulatedDepn: 0, bookValue: 1500000, status: 'Active', entryType: 'new', remarks: '',
        },
      ],
      transfers: [
        {
          id: 'TR-0001', asset: '000010000000002', assetName: 'HP ProDesk 400', group: 'AG-0001', subGroup: 'ASG-0001',
          dateOfOperation: '2025-02-18', dateOfPurchase: '2025-02-10', cost: 7786, accumulatedDepn: 0,
          fromBranch: 'BR-0002', fromUser: 'S02321', toBranch: 'BR-0001', toUser: 'S00974', toProject: '',
          effectiveDate: '2026-11-01', remarks: 'Relocation to head office', status: 'Pending',
        },
      ],
      disposals: [],
      revaluations: [],
      overhauls: [],
      rate_changes: [],
      vouchers: [],
      depreciation_entries: [],
      period_runs: [],
    },
    counters: {},
  }
}

let db
try {
  db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
} catch {
  db = seed()
}

let saveTimer = null
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2))
  }, 200)
}

const sessions = new Map()

function nextId(collection, prefix) {
  const counters = db.counters
  counters[collection] = (counters[collection] ?? db.collections[collection].length) + 1
  return `${prefix}-${String(counters[collection]).padStart(4, '0')}`
}

const DEFAULT_ID_SEQUENCE = ['company', 'branch', 'group', 'subGroup', 'department', 'serial']
const DEFAULT_ID_SEPARATOR = '-'

function policy() {
  return db.collections.organization_policy[0] ?? { capitalizationLimit: 0, minimumBookValue: 1 }
}

function idConfig() {
  return db.collections.autoid_config[0] ?? {}
}

function idSequence(config) {
  const tokens = String(config.sequence ?? '')
    .split(/[,\s|-]+/)
    .map((token) => token.trim())
    .filter((token) => DEFAULT_ID_SEQUENCE.includes(token))
  return tokens.length ? tokens : DEFAULT_ID_SEQUENCE
}

function idParts(body, config) {
  const branch = db.collections.branches.find((row) => row.id === body.branch)
  const group = db.collections.asset_groups.find((row) => row.id === body.group)
  const subGroup = db.collections.asset_sub_groups.find((row) => row.id === body.subGroup)
  const department = db.collections.departments.find((row) => row.id === body.department)
  return {
    company: String(config.companyId ?? policy().organizationInitial ?? ''),
    branch: String(branch?.branchId ?? branch?.mnemonic ?? ''),
    group: String(group?.groupId ?? ''),
    subGroup: String(subGroup?.subGroupId ?? ''),
    department: String(department?.shortCode ?? department?.id ?? ''),
  }
}

function nextAssetSerial(prefix) {
  const ids = db.collections.assets.flatMap((row) => [
    row.id,
    row.previousId,
    ...(Array.isArray(row.assetIdHistory) ? row.assetIdHistory : []),
  ])
  const used = ids
    .filter(Boolean)
    .map((id) => String(id))
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((value) => Number.isFinite(value))
  return used.length ? Math.max(...used) + 1 : 1
}

function generateAssetId(body) {
  const config = idConfig()
  const separator = String(config.separator ?? DEFAULT_ID_SEPARATOR)
  const parts = idParts(body, config)
  const prefix = idSequence(config)
    .filter((token) => token !== 'serial')
    .map((token) => parts[token])
    .filter(Boolean)
    .join(separator)
  const length = Math.max(1, Number(config.serialLength ?? 10))
  const serial = String(nextAssetSerial(prefix ? `${prefix}${separator}` : '')).padStart(length, '0')
  return prefix ? `${prefix}${separator}${serial}` : serial
}

function updateAssetReferences(oldId, newId) {
  for (const name of ['transfers', 'disposals', 'revaluations', 'overhauls', 'rate_changes', 'depreciation_entries']) {
    for (const row of db.collections[name] ?? []) {
      if (row.asset === oldId) row.asset = newId
    }
  }
  for (const voucher of db.collections.vouchers ?? []) {
    if (voucher.reference === oldId) voucher.reference = newId
  }
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function periodKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function periodLabel(key) {
  const [year, month] = key.split('-').map(Number)
  const start = `01-${String(month).padStart(2, '0')}-${year}`
  const end = `${daysInMonth(year, month)}-${String(month).padStart(2, '0')}-${year}`
  return `${start} - ${end}`
}

function recomputeBookValue(asset) {
  const floor = Number(policy().minimumBookValue ?? 1)
  asset.accumulatedDepn = round2(Number(asset.accumulatedDepn ?? 0))
  asset.bookValue = round2(Math.max(floor, Number(asset.cost ?? 0) - asset.accumulatedDepn))
}

function subGroupOf(asset) {
  return db.collections.asset_sub_groups.find((row) => row.id === asset.subGroup)
}

function depreciationForPeriod(asset, key) {
  const [year, month] = key.split('-').map(Number)
  const operation = new Date(asset.dateOfOperation)
  if (Number.isNaN(operation.getTime())) return 0
  const operationKey = periodKey(operation)
  if (operationKey > key) return 0
  const rate = Number(subGroupOf(asset)?.depreciationRate ?? 0)
  const cost = Number(asset.cost ?? 0)
  if (operationKey === key) {
    const remaining = daysInMonth(year, month) - operation.getDate() + 1
    return round2((cost * rate * remaining) / (100 * 360))
  }
  return round2((cost * rate) / (100 * 12))
}

function snapshotAsset(asset) {
  return {
    assetName: asset.name,
    group: asset.group,
    subGroup: asset.subGroup,
    dateOfOperation: asset.dateOfOperation,
    dateOfPurchase: asset.dateOfPurchase,
    cost: asset.cost,
    accumulatedDepn: asset.accumulatedDepn,
    bookValue: asset.bookValue,
    fromBranch: asset.branch,
    fromUser: asset.user,
  }
}

function disposalCompute(input) {
  const asset = db.collections.assets.find((row) => row.id === input.asset)
  if (!asset) return { error: 'Select a valid asset' }
  const sellingPrice = Number(input.sellingPrice ?? 0)
  const portion = input.type === 'Partial Disposal' ? Math.min(Number(input.portion ?? 0), Number(asset.cost)) : Number(asset.cost)
  const ratio = Number(asset.cost) > 0 ? portion / Number(asset.cost) : 0
  const cost = round2(portion)
  const accDepn = round2(Number(asset.accumulatedDepn) * ratio)
  const bookValue = round2(cost - accDepn)
  const businessGainLoss = round2(sellingPrice - bookValue)
  const capitalGain = round2(Math.max(0, sellingPrice - cost))
  return {
    cost,
    accumulatedDepn: accDepn,
    bookValue,
    totalProfitLoss: businessGainLoss,
    capitalGain,
    businessGainLoss,
  }
}

function makeVoucher(type, amount, period, debit, credit, reference) {
  const voucher = {
    id: nextId('vouchers', 'VCH'),
    type,
    amount: round2(amount),
    period,
    debitLedger: debit,
    creditLedger: credit,
    reference,
    status: 'Draft',
    createdAt: new Date().toISOString(),
  }
  db.collections.vouchers.push(voucher)
  return voucher
}

const PREFIXES = {
  departments: 'DEP',
  asset_groups: 'AG',
  asset_sub_groups: 'ASG',
  vendors: 'VEN',
  branches: 'BR',
  asset_users: 'USR',
  brands: 'BRD',
  organization_policy: 'POL',
  autoid_config: 'AID',
  voucher_config: 'VC',
  transfers: 'TR',
  disposals: 'DSP',
  revaluations: 'REV',
  overhauls: 'OVH',
  rate_changes: 'RC',
}

function createAsset(body) {
  const asset = {
    ...body,
    id: generateAssetId(body),
    cost: Number(body.cost ?? 0),
    tax: Number(body.tax ?? 0),
    vat: Number(body.vat ?? 0),
    openingAccumulatedDepn: Number(body.openingAccumulatedDepn ?? 0),
    accumulatedDepn: Number(body.openingAccumulatedDepn ?? 0),
    status: 'Active',
  }
  recomputeBookValue(asset)
  db.collections.assets.push(asset)
  return asset
}

function applyProcess(collection, body) {
  const asset = db.collections.assets.find((row) => row.id === body.asset)
  if (collection !== 'rate_changes' && !asset) return { error: 'Select a valid asset' }

  if (collection === 'transfers') {
    if (asset.status !== 'Active') return { error: 'Only active assets can be transferred' }
    if (db.collections.transfers.some((row) => row.asset === asset.id && row.status === 'Pending')) {
      return { error: 'Asset already has a pending transfer; acknowledge it first' }
    }
    if (body.toBranch === asset.branch) return { error: 'Transfer branch must differ from the current branch' }
    const record = { ...body, ...snapshotAsset(asset), id: nextId(collection, PREFIXES[collection]), status: 'Pending' }
    db.collections.transfers.push(record)
    return record
  }

  if (collection === 'disposals') {
    const computed = disposalCompute(body)
    if (computed.error) return computed
    const record = { ...body, ...computed, id: nextId(collection, PREFIXES[collection]), status: 'Completed' }
    db.collections.disposals.push(record)
    if (body.type === 'Partial Disposal') {
      asset.cost = round2(Number(asset.cost) - computed.cost)
      asset.accumulatedDepn = round2(Number(asset.accumulatedDepn) - computed.accumulatedDepn)
      recomputeBookValue(asset)
    } else {
      asset.status = 'Disposed'
    }
    makeVoucher('Disposal', Number(body.sellingPrice ?? 0), periodKey(new Date()), 'LED-CASH', 'LED-ASSET', record.id)
    return record
  }

  if (collection === 'revaluations') {
    const record = { ...body, id: nextId(collection, PREFIXES[collection]), status: 'Completed' }
    db.collections.revaluations.push(record)
    asset.cost = Number(body.newValue ?? asset.cost)
    recomputeBookValue(asset)
    return record
  }

  if (collection === 'overhauls') {
    const record = { ...body, id: nextId(collection, PREFIXES[collection]), status: 'Completed' }
    db.collections.overhauls.push(record)
    asset.cost = round2(Number(asset.cost) + Number(body.amount ?? 0))
    recomputeBookValue(asset)
    return record
  }

  if (collection === 'rate_changes') {
    const subGroup = db.collections.asset_sub_groups.find((row) => row.id === body.subGroup)
    if (!subGroup) return { error: 'Select a valid sub group' }
    const record = { ...body, currentRate: subGroup.depreciationRate, id: nextId(collection, PREFIXES[collection]), status: 'Completed' }
    db.collections.rate_changes.push(record)
    subGroup.depreciationRate = Number(body.newRate ?? subGroup.depreciationRate)
    return record
  }

  return { error: 'Unknown process' }
}

function executePeriodEnd() {
  const key = periodKey(new Date())
  if (db.collections.period_runs.some((run) => run.period === key)) {
    return { error: `Period ${periodLabel(key)} already executed` }
  }
  const run = { id: nextId('period_runs', 'PER'), period: key, label: periodLabel(key), status: 'Completed', executedAt: new Date().toISOString(), entries: 0, total: 0 }
  let total = 0
  let entries = 0
  for (const asset of db.collections.assets) {
    if (asset.status !== 'Active') continue
    const amount = depreciationForPeriod(asset, key)
    if (amount <= 0) continue
    const floor = Number(policy().minimumBookValue ?? 1)
    const capped = round2(Math.min(amount, Math.max(0, Number(asset.bookValue) - floor)))
    if (capped <= 0) continue
    const entry = { id: nextId('depreciation_entries', 'DE'), asset: asset.id, period: key, amount: capped, run: run.id }
    db.collections.depreciation_entries.push(entry)
    asset.accumulatedDepn = round2(Number(asset.accumulatedDepn) + capped)
    recomputeBookValue(asset)
    const subGroup = subGroupOf(asset)
    makeVoucher('Depreciation', capped, key, subGroup?.depnDebitLedger ?? 'LED-DEPN-EXP', subGroup?.depnCreditLedger ?? 'LED-ACC-DEPN', asset.id)
    total = round2(total + capped)
    entries += 1
  }
  run.entries = entries
  run.total = total
  db.collections.period_runs.push(run)
  return run
}

function deleteLastRun() {
  const run = db.collections.period_runs[db.collections.period_runs.length - 1]
  if (!run) return { error: 'No period run to delete' }
  const entries = db.collections.depreciation_entries.filter((entry) => entry.run === run.id)
  for (const entry of entries) {
    const asset = db.collections.assets.find((row) => row.id === entry.asset)
    if (asset) {
      asset.accumulatedDepn = round2(Math.max(0, Number(asset.accumulatedDepn) - entry.amount))
      recomputeBookValue(asset)
    }
  }
  db.collections.depreciation_entries = db.collections.depreciation_entries.filter((entry) => entry.run !== run.id)
  db.collections.vouchers = db.collections.vouchers.filter((voucher) => !(voucher.type === 'Depreciation' && voucher.period === run.period))
  db.collections.period_runs.pop()
  return run
}

function dashboardStats() {
  const assets = db.collections.assets
  const active = assets.filter((asset) => asset.status === 'Active')
  const nowKey = periodKey(new Date())
  const sum = (rows, key) => round2(rows.reduce((acc, row) => acc + Number(row[key] ?? 0), 0))
  return {
    assetCount: assets.length,
    activeCount: active.length,
    disposedCount: assets.length - active.length,
    totalCost: sum(assets, 'cost'),
    totalAccumulatedDepn: sum(assets, 'accumulatedDepn'),
    totalBookValue: sum(assets, 'bookValue'),
    monthAdditions: assets.filter((asset) => periodKey(new Date(asset.dateOfOperation)) === nowKey).length,
    monthDisposals: db.collections.disposals.filter((row) => periodKey(new Date(row.date)) === nowKey).length,
    lastPeriod: db.collections.period_runs[db.collections.period_runs.length - 1]?.label ?? 'Not executed',
  }
}

function listRows(collection, query) {
  let rows = [...db.collections[collection]]
  const entryType = query.get('entryType')
  if (entryType) rows = rows.filter((row) => row.entryType === entryType)
  const status = query.get('status')
  if (status) rows = rows.filter((row) => row.status === status)
  const search = (query.get('search') ?? '').toLowerCase()
  if (search) {
    rows = rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(search)),
    )
  }
  const total = rows.length
  const page = Math.max(1, Number(query.get('page') ?? 1))
  const pageSize = Math.max(1, Number(query.get('pageSize') ?? 10))
  const data = rows.slice((page - 1) * pageSize, page * pageSize)
  return { data, meta: { total, page, pageSize } }
}

function sessionDto(user) {
  return {
    ok: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      roleIds: user.roleIds,
      shopIds: user.shopIds,
      status: user.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    capabilities: user.roleIds.includes('Administrator') ? ['admin.read'] : [],
    siteName: 'dev-erp',
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function cookieValue(req, name) {
  const header = req.headers.cookie ?? ''
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim()
  }
  return ''
}

function json(res, status, payload, cookies = []) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...(cookies.length ? { 'Set-Cookie': cookies } : {}),
  })
  res.end(JSON.stringify(payload))
}

function currentUser(req) {
  const sid = cookieValue(req, 'sid')
  const userId = sessions.get(sid)
  return db.users.find((user) => user.id === userId) ?? null
}

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const query = url.searchParams
  const pathname = url.pathname
  const rawBody = await readBody(req)

  if (pathname === '/api/method/workshop.api.auth.csrf_token') {
    return json(res, 200, { message: { csrf_token: 'dev-csrf-token' } })
  }

  if (pathname === '/api/method/workshop.api.auth.login' && req.method === 'POST') {
    const form = new URLSearchParams(rawBody)
    const usr = form.get('usr') ?? ''
    const pwd = form.get('pwd') ?? ''
    const user = db.users.find((row) => row.id === usr || row.email === usr)
    if (!user || user.password !== pwd) {
      return json(res, 401, { message: 'Invalid credentials. Demo users: Administrator / admin123, accounts / accounts123' })
    }
    const sid = crypto.randomBytes(16).toString('hex')
    sessions.set(sid, user.id)
    return json(res, 200, { message: sessionDto(user) }, [`sid=${sid}; Path=/; HttpOnly; SameSite=Lax`])
  }

  if (pathname === '/api/method/workshop.api.auth.me') {
    const user = currentUser(req)
    if (!user) return json(res, 401, { message: 'Not logged in' })
    return json(res, 200, { message: sessionDto(user) })
  }

  if (pathname === '/api/method/workshop.api.auth.logout') {
    sessions.delete(cookieValue(req, 'sid'))
    return json(res, 200, { message: { ok: true } }, ['sid=; Path=/; HttpOnly; Max-Age=0'])
  }

  if (!pathname.startsWith('/api/method/asset.api.')) {
    return json(res, 404, { message: `Unknown method ${pathname}` })
  }

  const user = currentUser(req)
  if (!user) return json(res, 401, { message: 'Not logged in' })

  const method = pathname.replace('/api/method/asset.api.', '')
  const body = rawBody ? JSON.parse(rawBody) : {}
  const [resource, action] = method.split('.')

  if (resource === 'ledgers' && action === 'list') {
    return json(res, 200, { message: { data: LEDGERS, meta: { total: LEDGERS.length, page: 1, pageSize: 100 } } })
  }

  if (resource === 'dashboard' && action === 'stats') {
    return json(res, 200, { message: dashboardStats() })
  }

  if (resource === 'period_end') {
    if (action === 'list') {
      const runs = [...db.collections.period_runs].reverse()
      return json(res, 200, { message: { data: runs, meta: { total: runs.length, page: 1, pageSize: 100 } } })
    }
    if (action === 'execute') {
      const result = executePeriodEnd()
      if (result.error) return json(res, 400, { message: result.error })
      persist()
      return json(res, 200, { message: result })
    }
    if (action === 'delete_last') {
      const result = deleteLastRun()
      if (result.error) return json(res, 400, { message: result.error })
      persist()
      return json(res, 200, { message: result })
    }
    if (action === 'status') {
      const last = db.collections.period_runs[db.collections.period_runs.length - 1]
      return json(res, 200, { message: { status: last ? 'Completed' : 'Idle', last } })
    }
  }

  if (resource === 'vouchers') {
    if (action === 'list') return json(res, 200, { message: listRows('vouchers', query) })
    if (action === 'post') {
      const voucher = db.collections.vouchers.find((row) => row.id === body.id)
      if (!voucher) return json(res, 404, { message: 'Voucher not found' })
      voucher.status = 'Posted'
      voucher.postedAt = new Date().toISOString()
      persist()
      return json(res, 200, { message: voucher })
    }
    if (action === 'post_all') {
      const posted = []
      for (const voucher of db.collections.vouchers) {
        if (voucher.status === 'Draft') {
          voucher.status = 'Posted'
          voucher.postedAt = new Date().toISOString()
          posted.push(voucher)
        }
      }
      persist()
      return json(res, 200, { message: posted })
    }
  }

  if (resource === 'transfers' && action === 'acknowledge') {
    const transfer = db.collections.transfers.find((row) => row.id === body.id)
    if (!transfer) return json(res, 404, { message: 'Transfer not found' })
    if (transfer.status !== 'Pending') return json(res, 400, { message: 'Transfer is not pending' })
    const asset = db.collections.assets.find((row) => row.id === transfer.asset)
    if (!asset) return json(res, 404, { message: 'Asset not found' })

    const previousId = asset.id
    const previousBranch = asset.branch
    const previousUser = asset.user
    asset.branch = transfer.toBranch
    asset.user = transfer.toUser
    asset.previousBranch = previousBranch
    asset.previousUser = previousUser
    asset.previousId = previousId
    asset.assetIdHistory = [
      ...(Array.isArray(asset.assetIdHistory) ? asset.assetIdHistory : []),
      previousId,
    ]
    const newId = generateAssetId({ ...asset, branch: transfer.toBranch })
    asset.id = newId
    updateAssetReferences(previousId, newId)
    transfer.asset = newId
    transfer.oldAssetId = previousId
    transfer.newAssetId = newId
    transfer.status = 'Acknowledged'
    transfer.acknowledgedAt = new Date().toISOString()
    persist()
    return json(res, 200, { message: transfer })
  }

  if (resource === 'disposals' && action === 'preview') {
    const computed = disposalCompute(body)
    if (computed.error) return json(res, 400, { message: computed.error })
    return json(res, 200, { message: computed })
  }

  if (resource === 'assets' && action === 'preview') {
    const asset = db.collections.assets.find((row) => row.id === body.asset)
    if (asset) return json(res, 200, { message: snapshotAsset(asset) })
    const preview = {}
    if (body.group || body.branch || body.subGroup || body.department) {
      preview.id = generateAssetId(body)
    }
    if (body.cost !== undefined && body.cost !== '') {
      const floor = Number(policy().minimumBookValue ?? 1)
      const cost = Number(body.cost ?? 0)
      const accDepn = Number(body.openingAccumulatedDepn ?? 0)
      preview.bookValue = round2(Math.max(floor, cost - accDepn))
    }
    return json(res, 200, { message: preview })
  }

  if (resource === 'assets' && action === 'create') {
    const asset = createAsset(body)
    persist()
    return json(res, 200, { message: asset })
  }

  if (['transfers', 'disposals', 'revaluations', 'overhauls', 'rate_changes'].includes(resource) && action === 'create') {
    const record = applyProcess(resource, body)
    if (record.error) return json(res, 400, { message: record.error })
    persist()
    return json(res, 200, { message: record })
  }

  const collection = db.collections[resource]
  if (!collection) return json(res, 404, { message: `Unknown resource ${resource}` })

  if (action === 'list') return json(res, 200, { message: listRows(resource, query) })

  if (action === 'get') {
    const row = collection.find((item) => item.id === query.get('id'))
    if (!row) return json(res, 404, { message: 'Record not found' })
    return json(res, 200, { message: row })
  }

  if (action === 'create') {
    const row = { ...body, id: body.id || nextId(resource, PREFIXES[resource] ?? 'REC') }
    collection.push(row)
    persist()
    return json(res, 200, { message: row })
  }

  if (action === 'update') {
    const row = collection.find((item) => item.id === body.id)
    if (!row) return json(res, 404, { message: 'Record not found' })
    Object.assign(row, body, { id: row.id })
    if (resource === 'assets') recomputeBookValue(row)
    persist()
    return json(res, 200, { message: row })
  }

  if (action === 'delete') {
    const index = collection.findIndex((item) => item.id === body.id)
    if (index < 0) return json(res, 404, { message: 'Record not found' })
    const [removed] = collection.splice(index, 1)
    persist()
    return json(res, 200, { message: removed })
  }

  if (action === 'set_status') {
    const row = collection.find((item) => item.id === body.id)
    if (!row) return json(res, 404, { message: 'Record not found' })
    row.status = body.status
    persist()
    return json(res, 200, { message: row })
  }

  return json(res, 404, { message: `Unknown action ${method}` })
}

http
  .createServer((req, res) => {
    handle(req, res).catch((error) => {
      json(res, 500, { message: error instanceof Error ? error.message : 'Server error' })
    })
  })
  .listen(PORT, () => {
    console.log(`dev-erp listening on http://127.0.0.1:${PORT}`)
    console.log('Demo users: Administrator / admin123 (Admin), accounts / accounts123 (Accounts)')
  })
