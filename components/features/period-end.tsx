'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Play, Undo2 } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import { currentPeriodLabel } from '@/lib/format'
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

type PeriodRun = {
  id: string
  period: string
  label: string
  status: string
  entries: number
  total: number
  executedAt: string
}

export function PeriodEnd() {
  const [runs, setRuns] = useState<PeriodRun[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  const load = useCallback(() => {
    let cancelled = false
    apiRequest<{ data: PeriodRun[] }>('/api/method/asset.api.period_end.list', { silent: true })
      .then((result) => {
        if (!cancelled) setRuns(result.data ?? [])
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Failed to load periods')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => load(), [load, retry])

  const execute = () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    apiRequest<PeriodRun>('/api/method/asset.api.period_end.execute', { method: 'POST', body: {} })
      .then((run) => {
        setNotice(`Executed ${run.label}: ${run.entries} entries, total ${run.total}.`)
        setRetry((value) => value + 1)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Execution failed'))
      .finally(() => setBusy(false))
  }

  const deleteLast = () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    apiRequest<PeriodRun>('/api/method/asset.api.period_end.delete_last', { method: 'POST', body: {} })
      .then((run) => {
        setNotice(`Deleted last run ${run.label}.`)
        setRetry((value) => value + 1)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Delete failed'))
      .finally(() => setBusy(false))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Process</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          Period End Process
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Current period: {currentPeriodLabel()}. Request status:{' '}
          {runs.length > 0 ? runs[0].status : 'Idle'}.
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

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || loading} onClick={execute}>
          {busy ? <Spinner /> : <Play data-icon="inline-start" />}
          Execute End for Current Period
        </Button>
        <Button variant="outline" disabled={busy || loading || runs.length === 0} onClick={deleteLast}>
          <Undo2 data-icon="inline-start" />
          Delete Last
        </Button>
      </div>

      <SectionCard title="Executed Periods" description="Monthly depreciation runs, newest first." icon={CalendarClock}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Total Depreciation</TableHead>
              <TableHead>Executed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <Spinner className="mx-auto size-5" />
                </TableCell>
              </TableRow>
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No period executed yet.
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{run.label}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{run.entries}</TableCell>
                  <TableCell>{run.total.toLocaleString()}</TableCell>
                  <TableCell>{run.executedAt.slice(0, 10)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  )
}
