export type MasterFieldOption = { value: string; label: string }

export type MasterField = {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required?: boolean
  maxLength?: number
  digits?: number
  placeholder?: string
  options?: MasterFieldOption[]
  optionsResource?: string
  optionsEndpoint?: string
  searchable?: boolean
  defaultToday?: boolean
  defaultValue?: string
  readOnly?: boolean
  source?: string
  section?: string
  snapshot?: boolean
}

export type MasterColumn = {
  name: string
  label: string
  type?: 'text' | 'number' | 'date'
}

export type MasterResource = {
  key: string
  label: string
  singular: string
  href: string
  basePath: string
  fields: MasterField[]
  columns: MasterColumn[]
  group?: 'Master' | 'Configuration' | 'Entry' | 'Process'
  previewPath?: string
  extraBody?: Record<string, unknown>
  listParams?: Record<string, string>
  bulk?: boolean
}

export type MasterRow = { id: string } & Record<string, unknown>

const LEDGERS_ENDPOINT = '/api/method/asset.api.ledgers.list'

export const MASTER_RESOURCES: MasterResource[] = [
  {
    key: 'departments',
    label: 'Department',
    singular: 'Department',
    href: '/master/departments',
    basePath: '/api/method/asset.api.departments',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 100 },
      { name: 'shortCode', label: 'Short Code', type: 'text', maxLength: 20 },
      { name: 'creationDate', label: 'Creation Date', type: 'date', defaultToday: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea', maxLength: 250 },
    ],
    columns: [
      { name: 'name', label: 'Department Name' },
      { name: 'shortCode', label: 'Short Code' },
      { name: 'creationDate', label: 'Creation Date', type: 'date' },
      { name: 'remarks', label: 'Description' },
    ],
  },
  {
    key: 'asset-groups',
    label: 'Asset Group',
    singular: 'Asset Group',
    href: '/master/asset-groups',
    basePath: '/api/method/asset.api.asset_groups',
    fields: [
      {
        name: 'groupId',
        label: 'Group ID',
        type: 'text',
        required: true,
        digits: 5,
        placeholder: 'Max 5 digits',
      },
      { name: 'name', label: 'Group Name', type: 'text', required: true, maxLength: 100 },
      { name: 'department', label: 'Department', type: 'select', optionsResource: 'departments' },
    ],
    columns: [
      { name: 'groupId', label: 'Group ID' },
      { name: 'name', label: 'Group Name' },
      { name: 'department', label: 'Department' },
    ],
  },
  {
    key: 'asset-sub-groups',
    label: 'Asset Sub Group',
    singular: 'Asset Sub Group',
    href: '/master/asset-sub-groups',
    basePath: '/api/method/asset.api.asset_sub_groups',
    fields: [
      { name: 'group', label: 'Group', type: 'select', required: true, optionsResource: 'asset-groups' },
      {
        name: 'subGroupId',
        label: 'Sub Group ID',
        type: 'text',
        required: true,
        digits: 5,
        placeholder: 'Max 5 digits',
      },
      { name: 'name', label: 'Sub Group Name', type: 'text', required: true, maxLength: 100 },
      { name: 'depreciationRate', label: 'Depreciation Rate %', type: 'number', required: true },
      {
        name: 'method',
        label: 'Method of Depreciation',
        type: 'select',
        options: [
          { value: 'STRAIGHT LINE', label: 'STRAIGHT LINE' },
          { value: 'WRITTEN DOWN VALUE', label: 'WRITTEN DOWN VALUE' },
        ],
      },
      { name: 'assetLedger', label: 'Asset Ledger', type: 'select', optionsEndpoint: LEDGERS_ENDPOINT },
      {
        name: 'depnDebitLedger',
        label: 'Depreciation Debit Ledger',
        type: 'select',
        optionsEndpoint: LEDGERS_ENDPOINT,
      },
      {
        name: 'depnCreditLedger',
        label: 'Depreciation Credit Ledger',
        type: 'select',
        optionsEndpoint: LEDGERS_ENDPOINT,
      },
    ],
    columns: [
      { name: 'subGroupId', label: 'Sub Group ID' },
      { name: 'name', label: 'Sub Group Name' },
      { name: 'group', label: 'Group' },
      { name: 'depreciationRate', label: 'Depreciation Rate %', type: 'number' },
      { name: 'method', label: 'Method' },
    ],
  },
  {
    key: 'vendors',
    label: 'Vendor',
    singular: 'Vendor',
    href: '/master/vendors',
    basePath: '/api/method/asset.api.vendors',
    fields: [
      { name: 'name', label: 'Vendor Name', type: 'text', required: true, maxLength: 100 },
      { name: 'shortCode', label: 'Short Code', type: 'text', maxLength: 20 },
      { name: 'contactPerson', label: 'Contact Person', type: 'text', maxLength: 100 },
      { name: 'phone', label: 'Phone', type: 'text', maxLength: 30 },
      { name: 'email', label: 'Email', type: 'text', maxLength: 100 },
      { name: 'remarks', label: 'Remarks', type: 'textarea', maxLength: 250 },
    ],
    columns: [
      { name: 'name', label: 'Vendor Name' },
      { name: 'shortCode', label: 'Short Code' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email' },
    ],
  },
  {
    key: 'branches',
    label: 'Branch',
    singular: 'Branch',
    href: '/master/branches',
    basePath: '/api/method/asset.api.branches',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', maxLength: 100 },
      { name: 'branchId', label: 'Branch ID', type: 'text', required: true, maxLength: 20 },
      { name: 'name', label: 'Branch Name', type: 'text', required: true, maxLength: 100 },
      { name: 'mnemonic', label: 'Mnemonic', type: 'text', maxLength: 20 },
      { name: 'currency', label: 'Currency', type: 'text', maxLength: 10 },
      { name: 'description', label: 'Description', type: 'textarea', maxLength: 250 },
    ],
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'mnemonic', label: 'Mnemonic' },
      { name: 'currency', label: 'Currency' },
    ],
  },
  {
    key: 'asset-users',
    label: 'Fixed Asset User',
    singular: 'Fixed Asset User',
    href: '/master/asset-users',
    basePath: '/api/method/asset.api.asset_users',
    fields: [
      { name: 'userId', label: 'User ID', type: 'text', required: true, maxLength: 20 },
      { name: 'name', label: 'User Name', type: 'text', required: true, maxLength: 100 },
      { name: 'department', label: 'Department', type: 'select', optionsResource: 'departments' },
      { name: 'branch', label: 'Branch', type: 'select', optionsResource: 'branches' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', maxLength: 250 },
    ],
    columns: [
      { name: 'userId', label: 'User ID' },
      { name: 'name', label: 'User Name' },
      { name: 'department', label: 'Department' },
    ],
  },
  {
    key: 'brands',
    label: 'Brand',
    singular: 'Brand',
    href: '/master/brands',
    basePath: '/api/method/asset.api.brands',
    fields: [
      { name: 'name', label: 'Brand Name', type: 'text', required: true, maxLength: 100 },
    ],
    columns: [{ name: 'name', label: 'Brand Name' }],
  },
]

export function getMasterResource(key: string): MasterResource | undefined {
  return MASTER_RESOURCES.find((resource) => resource.key === key)
}
