import { DOCUMENT_RESOURCES } from '@/lib/resources/documents'
import { MASTER_RESOURCES, type MasterResource } from '@/lib/resources/masters'

const ASSET_LOOKUP_RESOURCE: MasterResource = {
  key: 'assets',
  label: 'Assets',
  singular: 'Asset',
  href: '/entry/new-assets',
  basePath: '/api/method/asset.api.assets',
  fields: [],
  columns: [],
  group: 'Entry',
}

const ALL_RESOURCES: MasterResource[] = [
  ...MASTER_RESOURCES.map((resource) => ({ ...resource, group: 'Master' as const })),
  ...DOCUMENT_RESOURCES,
  ASSET_LOOKUP_RESOURCE,
]

export function getResource(key: string): MasterResource | undefined {
  return ALL_RESOURCES.find((resource) => resource.key === key)
}
