import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/errors'
import { requireSameOrigin } from '@/lib/api/frappe'
import { requireApiUser } from '@/lib/auth/guards'
import { buildAssetTemplate, getBulkResource } from '@/lib/bulk-assets'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    requireSameOrigin(request)
    const guard = await requireApiUser()
    if (!guard.ok) return guard.response

    const resourceKey = request.nextUrl.searchParams.get('resource') ?? ''
    const resource = getBulkResource(resourceKey)
    if (!resource) return NextResponse.json({ error: 'Unknown bulk resource' }, { status: 400 })

    const file = await buildAssetTemplate(resource)
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${resourceKey}-template.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
