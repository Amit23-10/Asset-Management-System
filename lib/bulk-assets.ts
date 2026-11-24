import ExcelJS from 'exceljs'
import type { MasterField, MasterResource } from '@/lib/resources/masters'
import { getResource } from '@/lib/resources/registry'

export const BULK_RESOURCE_KEYS = ['new-assets', 'opening-assets'] as const
export const BULK_TEMPLATE_VERSION = 'AMS-ASSET-BULK-V1'
export const MAX_BULK_ROWS = 1000

const DATA_SHEET = 'Assets'
const SIGNATURE_SHEET = '_ams_template'

export type BulkRow = { rowNumber: number; body: Record<string, unknown> }

export function getBulkResource(key: string): MasterResource | undefined {
  if (!BULK_RESOURCE_KEYS.includes(key as (typeof BULK_RESOURCE_KEYS)[number])) return undefined
  return getResource(key)
}

function templateFields(resource: MasterResource): MasterField[] {
  return resource.fields.filter((field) => field.name !== 'id')
}

function templateHeaders(resource: MasterResource): string[] {
  return templateFields(resource).map((field) => field.label)
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    const record = value as { text?: unknown; result?: unknown; richText?: unknown[] }
    if (Array.isArray(record.richText)) return record.richText.map((part) => cellText(part)).join('')
    if (record.text !== undefined) return cellText(record.text)
    if (record.result !== undefined) return cellText(record.result)
  }
  return ''
}

function normalizeDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  throw new Error('Use yyyy-mm-dd or dd-mm-yyyy')
}

function parseField(field: MasterField, raw: string): unknown | undefined {
  const value = raw.trim()
  if (value === '') {
    if (field.required) throw new Error(`${field.label} is required`)
    return undefined
  }
  if (field.maxLength && value.length > field.maxLength) {
    throw new Error(`Max ${field.maxLength} characters`)
  }
  if (field.digits && !new RegExp(`^\\d{1,${field.digits}}$`).test(value)) {
    throw new Error(`Max ${field.digits} digits`)
  }
  if (field.type === 'number') {
    const numeric = Number(value.replace(/,/g, ''))
    if (!Number.isFinite(numeric)) throw new Error('Must be a number')
    return numeric
  }
  if (field.type === 'date') return normalizeDate(value)
  if (field.options && !field.options.some((option) => option.value === value)) {
    throw new Error(`Must be one of: ${field.options.map((option) => option.value).join(', ')}`)
  }
  return value
}

export async function buildAssetTemplate(resource: MasterResource): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Asset Management System'
  workbook.created = new Date()

  const headers = templateHeaders(resource)
  const sheet = workbook.addWorksheet(DATA_SHEET, {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  sheet.addRow(headers)
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 28
  headers.forEach((label, index) => {
    sheet.getColumn(index + 1).width = Math.max(14, Math.min(42, label.length + 4))
  })
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  }

  const signature = workbook.addWorksheet(SIGNATURE_SHEET, { state: 'hidden' })
  signature.getCell('A1').value = BULK_TEMPLATE_VERSION
  signature.getCell('A2').value = resource.key
  signature.getCell('A3').value = JSON.stringify(headers)

  const written = await workbook.xlsx.writeBuffer()
  return Uint8Array.from(written as unknown as ArrayLike<number>)
}

export async function parseAssetWorkbook(
  resource: MasterResource,
  input: Uint8Array,
): Promise<{ rows: BulkRow[]; errors: string[] }> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(input as unknown as ExcelJS.Buffer)

  const signature = workbook.getWorksheet(SIGNATURE_SHEET)
  const expected = templateHeaders(resource)
  if (
    !signature ||
    cellText(signature.getCell('A1').value) !== BULK_TEMPLATE_VERSION ||
    cellText(signature.getCell('A2').value) !== resource.key
  ) {
    return { rows: [], errors: ['This is not the system format. Download the format for this page and try again.'] }
  }

  let storedHeaders: string[] = []
  try {
    storedHeaders = JSON.parse(cellText(signature.getCell('A3').value)) as string[]
  } catch {
    storedHeaders = []
  }
  if (JSON.stringify(storedHeaders) !== JSON.stringify(expected)) {
    return { rows: [], errors: ['The format was modified. Download a fresh format and try again.'] }
  }

  const sheet = workbook.getWorksheet(DATA_SHEET)
  if (!sheet) return { rows: [], errors: [`Missing "${DATA_SHEET}" sheet. Download the system format and try again.`] }

  const headerRow = sheet.getRow(1)
  const actualHeaders = expected.map((_, index) => cellText(headerRow.getCell(index + 1).value))
  let extraColumn = false
  headerRow.eachCell({ includeEmpty: false }, (cell, column) => {
    if (column > expected.length && cellText(cell.value) !== '') extraColumn = true
  })
  if (extraColumn || JSON.stringify(actualHeaders) !== JSON.stringify(expected)) {
    return {
      rows: [],
      errors: [`Column headers must match the downloaded format exactly: ${expected.join(' | ')}`],
    }
  }

  const fields = templateFields(resource)
  const rows: BulkRow[] = []
  const errors: string[] = []
  let dataRows = 0
  let maxReached = false

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const values = expected.map((_, index) => cellText(row.getCell(index + 1).value))
    if (values.every((value) => value.trim() === '')) return
    dataRows += 1
    if (dataRows > MAX_BULK_ROWS) {
      if (!maxReached) {
        errors.push(`Maximum ${MAX_BULK_ROWS} rows per upload`)
        maxReached = true
      }
      return
    }

    const body: Record<string, unknown> = {}
    fields.forEach((field, index) => {
      if (field.readOnly) return
      try {
        const parsed = parseField(field, values[index])
        if (parsed !== undefined) body[field.name] = parsed
      } catch (error) {
        errors.push(`Row ${rowNumber} — ${field.label}: ${error instanceof Error ? error.message : 'Invalid value'}`)
      }
    })
    if (Object.keys(body).length > 0) rows.push({ rowNumber, body })
  })

  if (dataRows === 0) errors.push('The file contains no asset rows')
  return { rows, errors }
}
