'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cellText } from '@/lib/format'
import type { MasterColumn, MasterRow } from '@/lib/resources/masters'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZES = { '10': '10', '20': '20', '50': '50', '100': '100' }

export function DataTable({
  columns,
  rows,
  total,
  page,
  pageSize,
  loading,
  error,
  search,
  onSearch,
  onPage,
  onPageSize,
  onRetry,
  editHref,
}: {
  columns: MasterColumn[]
  rows: MasterRow[]
  total: number | null
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  search: string
  onSearch: (value: string) => void
  onPage: (page: number) => void
  onPageSize: (size: number) => void
  onRetry: () => void
  editHref: (row: MasterRow) => string
}) {
  const start = (page - 1) * pageSize + 1
  const end = (page - 1) * pageSize + rows.length
  const nextDisabled =
    loading || rows.length < pageSize || (total !== null && page * pageSize >= total)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search all columns…"
          aria-label="Search all columns"
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select
            items={PAGE_SIZES}
            value={String(pageSize)}
            onValueChange={(next) => onPageSize(Number(next))}
          >
            <SelectTrigger size="sm" aria-label="Entries per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PAGE_SIZES).map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.name}>{column.label}</TableHead>
              ))}
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-10 text-center">
                  <Spinner className="mx-auto size-5" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="py-10 text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.name}>{cellText(row[column.name], column.type)}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Link
                      href={editHref(row)}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    >
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total !== null && rows.length > 0
            ? `Showing ${start}–${end} of ${total}`
            : `Page ${page}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={nextDisabled} onClick={() => onPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
