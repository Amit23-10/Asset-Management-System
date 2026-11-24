'use client'

import { createCrudResource, type CrudResource } from '@/lib/api/crud'
import type { MasterRow } from '@/lib/resources/masters'

type MasterApi = CrudResource<MasterRow, Partial<MasterRow>, Partial<MasterRow>>

const cache = new Map<string, MasterApi>()

export function getMasterApi(basePath: string): MasterApi {
  const cached = cache.get(basePath)
  if (cached) return cached
  const api = createCrudResource<MasterRow>({ basePath, silent: true })
  cache.set(basePath, api)
  return api
}
