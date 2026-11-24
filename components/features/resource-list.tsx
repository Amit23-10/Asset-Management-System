'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { listRows, listTotal } from '@/lib/api/crud-shared'
import { getMasterApi } from '@/lib/resources/master-api'
import { getResource } from '@/lib/resources/registry'
import type { MasterRow } from '@/lib/resources/masters'
import { BulkAssetActions } from '@/components/features/bulk-asset-actions'
import { DataTable } from '@/components/features/data-table'
import { buttonVariants } from '@/components/ui/button'

export function ResourceList({ resourceKey }: { resourceKey: string }) {
  const resource = getResource(resourceKey)
  const api = getMasterApi(resource?.basePath ?? '')

  const [rows, setRows] = useState<MasterRow[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (searchInput === search) return undefined
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
      setLoading(true)
      setError(null)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, search])

  const load = useCallback(() => {
    if (!resource) return undefined
    let cancelled = false
    api
      .list({ ...resource.listParams, page, pageSize, search })
      .then((result) => {
        if (cancelled) return
        setRows(listRows(result))
        setTotal(listTotal(result) ?? null)
      })
      .catch((cause) => {
        if (cancelled) return
        setRows([])
        setTotal(null)
        setError(cause instanceof Error ? cause.message : 'Failed to load records')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, resource, page, pageSize, search])

  useEffect(() => load(), [load, retry])

  if (!resource) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            {resource.group ?? 'Master'}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {resource.label} List
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and maintain {resource.label.toLowerCase()} records.
          </p>
        </div>
        <Link href={`${resource.href}/new`} className={cn(buttonVariants())}>
          <Plus data-icon="inline-start" />
          Add New
        </Link>
      </div>

      {resource.bulk ? (
        <BulkAssetActions
          resourceKey={resource.key}
          onImported={() => {
            setRetry((value) => value + 1)
            setLoading(true)
          }}
        />
      ) : null}

      <DataTable
        columns={resource.columns}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        error={error}
        search={searchInput}
        onSearch={setSearchInput}
        onPage={(next) => {
          setPage(next)
          setLoading(true)
          setError(null)
        }}
        onPageSize={(size) => {
          setPageSize(size)
          setPage(1)
          setLoading(true)
          setError(null)
        }}
        onRetry={() => {
          setRetry((value) => value + 1)
          setLoading(true)
          setError(null)
        }}
        editHref={(row) => `${resource.href}/${row.id}`}
      />
    </div>
  )
}
