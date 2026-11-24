import type { MasterRow } from '@/lib/resources/masters'

/**
 * Read-only sample data used only when an ERP API call fails.
 * These values are illustrative and must never be treated as live records.
 */
export const MOCK_DATA_MESSAGE =
  'Mock data is shown because the ERP APIs are not available yet. API implementation is in progress.'
export const MOCK_WRITE_MESSAGE =
  'ERP API implementation is in progress. This demo does not save changes.'

const LEDGERS = [
  { id: 'LED-ASSET', name: 'Fixed Asset Ledger' },
  { id: 'LED-DEPN-EXP', name: 'Depreciation Expense' },
  { id: 'LED-ACC-DEPN', name: 'Accumulated Depreciation' },
  { id: 'LED-CASH', name: 'Cash' },
  { id: 'LED-BANK', name: 'Bank' },
  { id: 'LED-GAIN', name: 'Gain on Disposal' },
  { id: 'LED-LOSS', name: 'Loss on Disposal' },
]

const MOCK_ROWS: Record<string, MasterRow[]> = {
  departments: [
    { id: 'DEP-0001', name: 'Accounting', shortCode: 'AC', creationDate: '2022-10-16', remarks: 'Finance and accounts' },
    { id: 'DEP-0002', name: 'Human Resource', shortCode: 'HR', creationDate: '2022-10-17', remarks: '' },
    { id: 'DEP-0003', name: 'IT', shortCode: 'IT', creationDate: '2022-12-05', remarks: 'Information technology' },
  ],
  'asset-groups': [
    { id: 'AG-0001', groupId: '00001', name: 'Computer Equipment', department: 'DEP-0003' },
    { id: 'AG-0002', groupId: '00002', name: 'Furniture & Fixtures', department: 'DEP-0001' },
    { id: 'AG-0003', groupId: '00003', name: 'Vehicles', department: 'DEP-0001' },
  ],
  'asset-sub-groups': [
    { id: 'ASG-0001', group: 'AG-0001', subGroupId: '00001', name: 'Laptops', depreciationRate: 10, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
    { id: 'ASG-0002', group: 'AG-0001', subGroupId: '00002', name: 'Servers', depreciationRate: 10, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
    { id: 'ASG-0003', group: 'AG-0002', subGroupId: '00003', name: 'Office Furniture', depreciationRate: 5, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
    { id: 'ASG-0004', group: 'AG-0003', subGroupId: '00004', name: 'Motor Cars', depreciationRate: 10, method: 'STRAIGHT LINE', assetLedger: 'LED-ASSET', depnDebitLedger: 'LED-DEPN-EXP', depnCreditLedger: 'LED-ACC-DEPN' },
  ],
  brands: [
    { id: 'BRD-0001', name: 'Dell' },
    { id: 'BRD-0002', name: 'HP' },
    { id: 'BRD-0003', name: 'Toyota' },
  ],
  branches: [
    { id: 'BR-0001', companyName: 'Demo Foundation', branchId: '0171', name: 'Abdullahbag', mnemonic: '0171', currency: 'BDT', description: '' },
    { id: 'BR-0002', companyName: 'Demo Foundation', branchId: '0189', name: 'Abdullahpur', mnemonic: '0189', currency: 'BDT', description: '' },
    { id: 'BR-0003', companyName: 'Demo Foundation', branchId: '0409', name: 'Adda', mnemonic: '0409', currency: 'BDT', description: '' },
    { id: 'BR-0004', companyName: 'Demo Foundation', branchId: 'HO', name: 'Head Office', mnemonic: 'HO', currency: 'BDT', description: 'Gulshan, Dhaka' },
  ],
  'asset-users': [
    { id: 'S00974', userId: 'S00974', name: 'Md. Abul Kamal Hossain', department: 'DEP-0001', branch: 'BR-0001', remarks: '' },
    { id: 'S02321', userId: 'S02321', name: 'Md. Alomgir Hossain', department: 'DEP-0003', branch: 'BR-0002', remarks: '' },
    { id: 'S04893', userId: 'S04893', name: 'Kutubuddin Ahamed', department: 'DEP-0002', branch: 'BR-0003', remarks: '' },
    { id: 'S05173', userId: 'S05173', name: 'Md. Alamgir Hossain', department: 'DEP-0001', branch: 'BR-0004', remarks: '' },
  ],
  vendors: [
    { id: 'VEN-0001', name: 'Tech Supplies Ltd', shortCode: 'TSL', contactPerson: 'Karim', phone: '+8801700000001', email: 'sales@tsl.example', remarks: '' },
    { id: 'VEN-0002', name: 'Office Mart', shortCode: 'OM', contactPerson: 'Rahim', phone: '+8801700000002', email: 'info@om.example', remarks: '' },
  ],
  'organization-policy': [
    {
      id: 'POL-0001',
      company: 'Demo Foundation',
      organizationInitial: 'DF',
      address: 'Gulshan, Dhaka',
      phone: '+8802222290513',
      fax: '+8802222263165',
      email: 'sf@example.com',
      contactPerson: 'Sam',
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
  'asset-autoid': [
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
  'voucher-config': [
    { id: 'VC-0001', series: 'DEPN-.YYYY.-', voucherType: 'Depreciation', debitLedger: 'LED-DEPN-EXP', creditLedger: 'LED-ACC-DEPN' },
    { id: 'VC-0002', series: 'DISP-.YYYY.-', voucherType: 'Disposal', debitLedger: 'LED-CASH', creditLedger: 'LED-ASSET' },
  ],
  assets: [
    { id: '000010000000001', name: 'Dell Latitude 5420', group: 'AG-0001', subGroup: 'ASG-0001', brand: 'BRD-0001', branch: 'BR-0001', department: 'DEP-0001', user: 'S00974', vendor: 'VEN-0001', dateOfPurchase: '2021-01-01', dateOfOperation: '2022-07-01', cost: 13900, tax: 0, vat: 0, openingAccumulatedDepn: 0, accumulatedDepn: 0, bookValue: 13900, status: 'Active', entryType: 'opening', remarks: '' },
    { id: '000010000000002', name: 'HP ProDesk 400', group: 'AG-0001', subGroup: 'ASG-0001', brand: 'BRD-0002', branch: 'BR-0002', department: 'DEP-0003', user: 'S02321', vendor: 'VEN-0001', dateOfPurchase: '2025-02-10', dateOfOperation: '2025-02-18', cost: 7786, tax: 0, vat: 0, openingAccumulatedDepn: 0, accumulatedDepn: 0, bookValue: 7786, status: 'Active', entryType: 'new', remarks: '' },
    { id: '000020000000003', name: 'Conference Table', group: 'AG-0002', subGroup: 'ASG-0003', brand: '', branch: 'BR-0004', department: 'DEP-0001', user: 'S05173', vendor: 'VEN-0002', dateOfPurchase: '2022-06-15', dateOfOperation: '2022-07-01', cost: 25000, tax: 0, vat: 0, openingAccumulatedDepn: 5000, accumulatedDepn: 5000, bookValue: 20000, status: 'Active', entryType: 'opening', remarks: '' },
    { id: '000030000000004', name: 'Toyota Corolla', group: 'AG-0003', subGroup: 'ASG-0004', brand: 'BRD-0003', branch: 'BR-0004', department: 'DEP-0001', user: 'S05173', vendor: 'VEN-0002', dateOfPurchase: '2023-03-01', dateOfOperation: '2023-03-15', cost: 1500000, tax: 0, vat: 0, openingAccumulatedDepn: 0, accumulatedDepn: 0, bookValue: 1500000, status: 'Active', entryType: 'new', remarks: '' },
  ],
  transfers: [
    { id: 'TR-0001', asset: '000010000000002', assetName: 'HP ProDesk 400', group: 'AG-0001', subGroup: 'ASG-0001', dateOfOperation: '2025-02-18', dateOfPurchase: '2025-02-10', cost: 7786, accumulatedDepn: 0, bookValue: 7786, fromBranch: 'BR-0002', fromUser: 'S02321', toBranch: 'BR-0001', toUser: 'S00974', toProject: '', effectiveDate: '2026-11-01', remarks: 'Relocation to head office', status: 'Pending' },
  ],
  disposals: [
    { id: 'DSP-0001', asset: '000010000000001', assetName: 'Dell Latitude 5420', type: 'Sale', date: '2026-10-15', cost: 13900, accumulatedDepn: 1000, bookValue: 12900, sellingPrice: 12000, totalProfitLoss: -900, capitalGain: 0, businessGainLoss: -900, status: 'Completed', remarks: '' },
  ],
  revaluations: [
    { id: 'REV-0001', asset: '000020000000003', assetName: 'Conference Table', newValue: 23000, effectiveDate: '2026-10-01', reason: 'Market value review', status: 'Completed' },
  ],
  overhauls: [
    { id: 'OVH-0001', asset: '000030000000004', assetName: 'Toyota Corolla', amount: 85000, effectiveDate: '2026-09-20', remarks: 'Engine overhaul', status: 'Completed' },
  ],
  'rate-changes': [
    { id: 'RC-0001', subGroup: 'ASG-0003', currentRate: 5, newRate: 7.5, effectiveMonth: '2026-10-01', reason: 'Policy revision', status: 'Completed' },
  ],
  vouchers: [
    { id: 'VCH-0001', type: 'Depreciation', period: '2026-10', amount: 1290.5, debitLedger: 'LED-DEPN-EXP', creditLedger: 'LED-ACC-DEPN', reference: 'PER-0001', status: 'Draft', createdAt: '2026-11-01T09:00:00Z' },
    { id: 'VCH-0002', type: 'Disposal', period: '2026-10', amount: 12000, debitLedger: 'LED-CASH', creditLedger: 'LED-ASSET', reference: 'DSP-0001', status: 'Posted', createdAt: '2026-10-15T11:30:00Z' },
  ],
  ledgers: LEDGERS,
}

const RESOURCE_KEY_ALIASES: Record<string, string> = {
  'asset-groups': 'asset-groups',
  'asset-sub-groups': 'asset-sub-groups',
  'asset-users': 'asset-users',
  'organization-policy': 'organization-policy',
  'asset-autoid': 'asset-autoid',
  'voucher-config': 'voucher-config',
  'opening-assets': 'assets',
  'new-assets': 'assets',
  assets: 'assets',
  ledgers: 'ledgers',
}

const LEDGER_ENDPOINT = '/api/method/asset.api.ledgers.list'

export function getMockRows(key: string): MasterRow[] {
  const resourceKey = RESOURCE_KEY_ALIASES[key] ?? key
  const endpointKey = key === LEDGER_ENDPOINT ? 'ledgers' : key
  return MOCK_ROWS[resourceKey] ?? MOCK_ROWS[endpointKey] ?? []
}

export function getMockRecord(key: string, id: string): MasterRow | undefined {
  const rows = getMockRows(key)
  return rows.find((row) => String(row.id) === id) ?? rows[0]
}

export const MOCK_ASSET_STATS = {
  assetCount: 4,
  activeCount: 4,
  disposedCount: 0,
  totalCost: 1547686,
  totalAccumulatedDepn: 5000,
  totalBookValue: 1541686,
  monthAdditions: 1,
  monthDisposals: 0,
  lastPeriod: '01-11-2026 - 30-11-2026',
}

export type MockPeriodRun = {
  id: string
  period: string
  label: string
  status: string
  entries: number
  total: number
  executedAt: string
}

export const MOCK_PERIOD_RUNS: MockPeriodRun[] = [
  { id: 'PER-0001', period: '2026-10', label: '01-10-2026 - 31-10-2026', status: 'Completed', entries: 4, total: 1290.5, executedAt: '2026-11-01T09:00:00Z' },
  { id: 'PER-0002', period: '2026-09', label: '01-09-2026 - 30-09-2026', status: 'Completed', entries: 4, total: 1180.25, executedAt: '2026-10-01T09:15:00Z' },
]
