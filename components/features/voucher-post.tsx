'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileCheck2, Send } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import { listRows } from '@/lib/api/crud-shared'
import { getMasterApi } from '@/lib/resources/master-api'
import type { MasterRow } from '@/lib/resources/masters'
import { getMockRows, MOCK_WRITE_MESSAGE } from '@/lib/mock-data'
import { MockDataNotice } from '@/components/features/mock-data-notice'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/section-card'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function VoucherPost() {
  const api = getMasterApi('/api/method/asset.api.vouchers')
  const [rows, setRows] = useState<MasterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)
  const [retry, setRetry] = useState(0)

  const load = useCallback(() => {
    let cancelled = false
    api
      .list({ page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) {
          setRows(listRows(result))
          setUsingMock(false)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows(getMockRows('vouchers'))
          setUsingMock(true)
          setError(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  useEffect(() => load(), [load, retry])

  const post = (id: string) => {
    setBusyId(id)
    setError(null)
    apiRequest('/api/method/asset.api.vouchers.post', { method: 'POST', body: { id } })
      .then(() => {
        setNotice(`Voucher ${id} posted.`)
        setRetry((value) => value + 1)
      })
      .catch(() => {
        setNotice(MOCK_WRITE_MESSAGE)
        setUsingMock(true)
      })
      .finally(() => setBusyId(null))
  }

  const postAll = () => {
    setBusyId('all')
    setError(null)
    apiRequest<MasterRow[]>('/api/method/asset.api.vouchers.post_all', { method: 'POST', body: {} })
      .then((posted) => {
        setNotice(`Posted ${posted.length} vouchers.`)
        setRetry((value) => value + 1)
      })
      .catch(() => {
        setNotice(MOCK_WRITE_MESSAGE)
        setUsingMock(true)
      })
      .finally(() => setBusyId(null))
  }

  const draftCount = rows.filter((row) => row.status === 'Draft').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Process</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Voucher Post
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Post generated GL vouchers to accounts. {draftCount} draft(s) pending.
          </p>
        </div>
        <Button disabled={loading || busyId !== null || draftCount === 0} onClick={postAll}>
          {busyId === 'all' ? <Spinner /> : <Send data-icon="inline-start" />}
          Post All Drafts
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {usingMock ? <MockDataNotice /> : null}

      <SectionCard title="Vouchers" description="Depreciation and disposal vouchers from processes." icon={FileCheck2}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  <Spinner className="mx-auto size-5" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No vouchers generated yet. Run a process or period end first.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{String(row.id)}</TableCell>
                  <TableCell>{String(row.type)}</TableCell>
                  <TableCell>{String(row.period)}</TableCell>
                  <TableCell>{Number(row.amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{String(row.debitLedger)}</TableCell>
                  <TableCell>{String(row.creditLedger)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        row.status === 'Posted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }
                    >
                      {String(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={row.status === 'Posted' || busyId !== null}
                      onClick={() => post(String(row.id))}
                    >
                      {busyId === row.id ? <Spinner /> : null}
                      Post
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  )
}
