import { NextRequest, NextResponse } from 'next/server'
import { CSRF_HEADER, ERP_METHODS } from '@/lib/config'
import {
  forwardSetCookies,
  frappeFetch,
  getServerCsrfToken,
  requireSameOrigin,
} from '@/lib/api/frappe'
import { errorResponse, parseFrappeError, readMessage } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

type FrappeUploadResult = { file_url: string; file_name: string; name: string }

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request)

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'The selected file exceeds the 25 MB upload limit.' }, { status: 413 })
    }

    const cookieHeader = request.headers.get('cookie') ?? ''
    const csrfToken =
      request.headers.get('x-frappe-csrf-token') ?? (await getServerCsrfToken(cookieHeader))

    const upstream = await frappeFetch(ERP_METHODS.uploadFile, {
      method: 'POST',
      cookieHeader,
      rawBody: formData,
      headers: { [CSRF_HEADER]: csrfToken },
    })

    if (!upstream.ok) {
      throw await parseFrappeError(upstream, 'File upload failed')
    }

    const message = await readMessage<FrappeUploadResult>(upstream)
    const response = NextResponse.json({
      fileUrl: message.file_url,
      fileName: message.file_name,
      name: message.name,
    })
    forwardSetCookies(upstream, response)
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
