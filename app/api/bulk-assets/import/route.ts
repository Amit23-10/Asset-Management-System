import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/errors'
import { requireSameOrigin, serverFrappeRequest } from '@/lib/api/frappe'
import { requireApiUser } from '@/lib/auth/guards'
import { getBulkResource, parseAssetWorkbook } from '@/lib/bulk-assets'

export const dynamic = 'force-dynamic'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request)
    const guard = await requireApiUser()
    if (!guard.ok) return guard.response

    const formData = await request.formData()
    const resourceKey = String(formData.get('resource') ?? '')
    const resource = getBulkResource(resourceKey)
    if (!resource) return NextResponse.json({ error: 'Unknown bulk resource' }, { status: 400 })

    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing Excel file' }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Only the downloaded .xlsx format is accepted' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'The file exceeds the 10 MB upload limit' }, { status: 413 })
    }

    const parsed = await parseAssetWorkbook(resource, new Uint8Array(await file.arrayBuffer()))
    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'The file is not a valid system format', details: parsed.errors },
        { status: 400 },
      )
    }

    let created = 0
    const failures: string[] = []
    for (const row of parsed.rows) {
      try {
        await serverFrappeRequest(`${resource.basePath}.create`, {
          method: 'POST',
          body: { ...row.body, ...(resource.extraBody ?? {}) },
        })
        created += 1
      } catch (error) {
        failures.push(`Row ${row.rowNumber}: ${error instanceof Error ? error.message : 'Create failed'}`)
      }
    }

    if (failures.length > 0) {
      return NextResponse.json(
        { created, failed: failures.length, errors: failures },
        { status: created > 0 ? 207 : 400 },
      )
    }
    return NextResponse.json({ created, failed: 0, total: parsed.rows.length })
  } catch (error) {
    return errorResponse(error)
  }
}
