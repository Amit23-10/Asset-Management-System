'use client'

import { useCallback, useEffect, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import { listRows } from '@/lib/api/crud-shared'
import { getMasterApi } from '@/lib/resources/master-api'
import type { MasterRow } from '@/lib/resources/masters'
import { getMockRows, MOCK_WRITE_MESSAGE } from '@/lib/mock-data'
import { MockDataNotice } from '@/components/features/mock-data-notice'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

export function TransferAcknowledgements() {
  const api = getMasterApi('/api/method/asset.api.transfers')
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
      .list({ status: 'Pending', page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) {
          setRows(listRows(result))
          setUsingMock(false)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows(getMockRows('transfers'))
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

  const acknowledge = (id: string) => {
    setBusyId(id)
    setError(null)
    apiRequest<{ oldAssetId?: string; newAssetId?: string }>(
      '/api/method/asset.api.transfers.acknowledge',
      { method: 'POST', body: { id } },
    )
      .then((result) => {
        setNotice(
          result.newAssetId
            ? `Transfer ${id} acknowledged. Asset ${result.oldAssetId} is now ${result.newAssetId}.`
            : `Transfer ${id} acknowledged. Asset location updated.`,
        )
        setRetry((value) => value + 1)
      })
      .catch(() => {
        setNotice(MOCK_WRITE_MESSAGE)
        setUsingMock(true)
      })
      .finally(() => setBusyId(null))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Process</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          Acknowledgement of Asset Transfer
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Receiving branch confirms pending transfers; the asset moves and its ID changes only after acknowledgement.
        </p>
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

      <SectionCard title="Pending Transfers" description="Acknowledge to move the asset." icon={ClipboardCheck}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>From Branch</TableHead>
              <TableHead>To Branch</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <Spinner className="mx-auto size-5" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No pending transfers.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{String(row.id)}</TableCell>
                  <TableCell>{String(row.assetName ?? row.asset)}</TableCell>
                  <TableCell>{String(row.fromBranch)}</TableCell>
                  <TableCell>{String(row.toBranch)}</TableCell>
                  <TableCell>{String(row.effectiveDate)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => acknowledge(String(row.id))}
                    >
                      {busyId === row.id ? <Spinner /> : null}
                      Acknowledge
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
